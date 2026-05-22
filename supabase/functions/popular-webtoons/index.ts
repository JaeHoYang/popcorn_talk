import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";
import { anilistRequest, parseAnilistMedia } from "../_shared/anilist.ts";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_ID = "00000000-0000-0000-0007-000000000001";

const QUERY = `
query {
  Page(page: 1, perPage: 20) {
    media(countryOfOrigin: KR, type: MANGA, sort: [POPULARITY_DESC], isAdult: false) {
      id
      title { native english romaji }
      coverImage { large }
      averageScore
      popularity
      status
      genres
      description(asHtml: false)
      startDate { year }
      chapters
      staff(sort: ROLE, perPage: 5) {
        edges { role node { name { native full } } }
      }
    }
  }
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: cached } = await supabase
      .from("popular_webtoon_cache")
      .select("data")
      .eq("id", CACHE_ID)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: CORS });

    const data = await anilistRequest<{ Page: { media: unknown[] } }>(QUERY, {});
    if (!data) throw new Error("AniList request failed");

    const items = data.Page.media.map((m) => parseAnilistMedia(m as Parameters<typeof parseAnilistMedia>[0]));
    const result = { data: items, total: items.length };

    await supabase.from("popular_webtoon_cache").upsert({
      id: CACHE_ID,
      data: result,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    });

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
