import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";
import { anilistRequest, parseAnilistMedia, SEARCH_QUERY, ANILIST_STATUS } from "../_shared/anilist.ts";
import { parseMangaItem, enrichCoversWithMAL, mangaListUrl, NO_GZIP } from "../_shared/mangadex.ts";

const LIMIT = 24;

async function searchMangaDex(query: string, page: number) {
  const offset = (page - 1) * LIMIT;
  const urlStr = mangaListUrl({
    title: query,
    limit: String(LIMIT),
    offset: String(offset),
    "order[followedCount]": "desc",
  });
  const res = await fetch(urlStr, NO_GZIP);
  if (!res.ok) return null;
  const raw = await res.json();
  const total: number = raw.total ?? 0;
  const items = await enrichCoversWithMAL((raw.data ?? []).map(parseMangaItem));
  return {
    data: items,
    pagination: {
      current_page: page,
      last_page: Math.ceil(total / LIMIT),
      has_next_page: page < Math.ceil(total / LIMIT),
      total,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const query: string | undefined = body.query?.trim() || undefined;
    const genre: string | undefined = body.genre || undefined;
    const status: string | undefined = body.status ? ANILIST_STATUS[body.status] : undefined;
    const page: number = Math.max(1, Number(body.page) || 1);

    if (!query && !genre && !status) {
      return new Response(JSON.stringify({ error: "query, genre, or status required" }), {
        status: 400, headers: CORS,
      });
    }

    const variables: Record<string, unknown> = { page };
    if (query)  variables.search   = query;
    if (genre)  variables.genre_in = [genre];
    if (status) variables.status   = status;

    const data = await anilistRequest<{
      Page: {
        pageInfo: { total: number; lastPage: number; hasNextPage: boolean };
        media: unknown[];
      };
    }>(SEARCH_QUERY, variables);

    if (data && data.Page.media.length > 0) {
      const { pageInfo, media } = data.Page;
      return new Response(JSON.stringify({
        data: media.map((m) => parseAnilistMedia(m as Parameters<typeof parseAnilistMedia>[0])),
        pagination: {
          current_page: page,
          last_page: pageInfo.lastPage,
          has_next_page: pageInfo.hasNextPage,
          total: pageInfo.total,
        },
      }), { headers: CORS });
    }

    // AniList 결과 없고 텍스트 검색인 경우 MangaDex fallback
    if (query) {
      const mdResult = await searchMangaDex(query, page);
      if (mdResult) {
        return new Response(JSON.stringify(mdResult), { headers: CORS });
      }
    }

    // 둘 다 없으면 빈 결과
    return new Response(JSON.stringify({
      data: [],
      pagination: { current_page: page, last_page: 1, has_next_page: false, total: 0 },
    }), { headers: CORS });

  } catch (err) {
    return errResponse(err);
  }
});
