import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";
import { anilistRequest, parseAnilistMedia, RANKING_QUERY, ANILIST_STATUS } from "../_shared/anilist.ts";

const CACHE_TTL_MS = 60 * 60 * 1000;

const FILTER_IDX: Record<string, number> = {
  bypopularity: 0,
  rating:       1,
  ongoing:      2,
  completed:    3,
  new:          4,
};

function cacheId(filter: string, page: number, order: string): string {
  const fi = FILTER_IDX[filter] ?? 0;
  const od = order === "asc" ? 1 : 0;
  return `00000000-0000-0000-0006-${String(fi)}${od}${String(page).padStart(10, "0")}`;
}

function buildSort(filter: string, order: "asc" | "desc"): string[] {
  const desc = order === "desc";
  switch (filter) {
    case "rating":    return [desc ? "SCORE_DESC"      : "SCORE"];
    case "new":       return [desc ? "START_DATE_DESC" : "START_DATE"];
    default:          return [desc ? "POPULARITY_DESC" : "POPULARITY"];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const filter: string = body.filter ?? "bypopularity";
    const page: number = Math.max(1, Number(body.page) || 1);
    const order: "asc" | "desc" = body.order === "asc" ? "asc" : "desc";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const id = cacheId(filter, page, order);
    const { data: cached } = await supabase
      .from("popular_webtoon_cache")
      .select("data")
      .eq("id", id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: CORS });

    const status = (filter === "ongoing" || filter === "completed")
      ? ANILIST_STATUS[filter]
      : undefined;

    const variables: Record<string, unknown> = {
      page,
      sort: buildSort(filter, order),
    };
    if (status) variables.status = status;

    const data = await anilistRequest<{
      Page: {
        pageInfo: { total: number; currentPage: number; lastPage: number; hasNextPage: boolean };
        media: unknown[];
      };
    }>(RANKING_QUERY, variables);

    if (!data) throw new Error("AniList request failed");

    const { pageInfo, media } = data.Page;
    const items = media.map((m) => parseAnilistMedia(m as Parameters<typeof parseAnilistMedia>[0]));

    const result = {
      data: items,
      pagination: {
        current_page: pageInfo.currentPage,
        last_page: pageInfo.lastPage,
        has_next_page: pageInfo.hasNextPage,
        total: pageInfo.total,
      },
    };

    await supabase.from("popular_webtoon_cache").upsert({
      id,
      data: result,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    });

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
