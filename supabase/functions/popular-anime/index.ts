import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const JIKAN = "https://api.jikan.moe/v4";
const TMDB_BASE = "https://api.themoviedb.org/3";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_IDS: Record<string, string> = {
  bypopularity: "00000000-0000-0000-0000-000000000010",
  airing:       "00000000-0000-0000-0000-000000000011",
  upcoming:     "00000000-0000-0000-0000-000000000012",
};

async function fetchKoTitle(anime: { title: string; title_english: string | null }, tmdbKey: string): Promise<string | null> {
  try {
    const searchTitle = anime.title_english ?? anime.title;
    const searchUrl = new URL(`${TMDB_BASE}/search/tv`);
    searchUrl.searchParams.set("api_key", tmdbKey);
    searchUrl.searchParams.set("query", searchTitle);
    const searchRes = await fetch(searchUrl.toString(), { headers: { "Accept-Encoding": "identity" } });
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const tvId = searchData.results?.[0]?.id;
    if (!tvId) return null;

    const detailRes = await fetch(
      `${TMDB_BASE}/tv/${tvId}?api_key=${tmdbKey}&language=ko-KR`,
      { headers: { "Accept-Encoding": "identity" } }
    );
    if (!detailRes.ok) return null;
    const detail = await detailRes.json();
    return detail.name?.trim() || null;
  } catch { return null; }
}

async function enrichKoTitles(
  animeList: Array<{ title: string; title_english: string | null }>,
  tmdbKey: string
): Promise<(string | null)[]> {
  const results: (string | null)[] = [];
  const BATCH = 10;
  for (let i = 0; i < animeList.length; i += BATCH) {
    const batch = animeList.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map((a) => fetchKoTitle(a, tmdbKey)));
    results.push(...batchResults);
  }
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const filter: string = body.filter ?? "bypopularity"; // bypopularity | airing | upcoming

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cacheId = CACHE_IDS[filter] ?? CACHE_IDS.bypopularity;

    const { data: cached } = await supabase
      .from("popular_anime_cache")
      .select("data")
      .eq("id", cacheId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: CORS });

    const url = new URL(`${JIKAN}/top/anime`);
    url.searchParams.set("type", "tv");
    url.searchParams.set("filter", filter);
    url.searchParams.set("limit", "20");

    const res = await fetch(url.toString(), { headers: { "Accept-Encoding": "identity" } });
    if (!res.ok) throw new Error(`Jikan ${res.status}`);
    const data = await res.json();

    const tmdbKey = Deno.env.get("TMDB_API_KEY");
    const koTitles = tmdbKey ? await enrichKoTitles(data.data ?? [], tmdbKey) : [];
    const enriched = {
      ...data,
      data: (data.data ?? []).map((anime: { title: string; title_english: string | null }, i: number) => ({
        ...anime,
        title: koTitles[i] ?? anime.title,
      })),
    };

    await supabase.from("popular_anime_cache").upsert({
      id: cacheId,
      data: enriched,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    });

    return new Response(JSON.stringify(enriched), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
