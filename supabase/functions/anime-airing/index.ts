import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const JIKAN = "https://api.jikan.moe/v4";
const TMDB_BASE = "https://api.themoviedb.org/3";
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2시간

// 페이지별 고정 UUID: 00000000-0000-0000-0000-0000000002xx (page 1~99)
function cacheId(page: number): string {
  return `00000000-0000-0000-0000-0000000002${String(page).padStart(2, "0")}`;
}

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
    const page: number = Math.max(1, Number(body.page) || 1);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const id = cacheId(page);

    const { data: cached } = await supabase
      .from("popular_anime_cache")
      .select("data")
      .eq("id", id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: CORS });

    const url = new URL(`${JIKAN}/seasons/now`);
    url.searchParams.set("page", String(page));

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
      id,
      data: enriched,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    });

    return new Response(JSON.stringify(enriched), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
