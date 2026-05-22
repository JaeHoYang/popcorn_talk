import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const JIKAN = "https://api.jikan.moe/v4";
const TMDB_BASE = "https://api.themoviedb.org/3";
const NO_GZIP = { headers: { "Accept-Encoding": "identity" } };
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface TMDBData {
  watchProviders: unknown;
  synopsis: string | null;
  title: string | null;
  youtubeId: string | null;
}

const VIDEO_PRIORITY = ["Trailer", "Teaser", "Featurette", "Clip"];

function pickYouTubeId(results: { type: string; site: string; key: string }[]): string | null {
  for (const type of VIDEO_PRIORITY) {
    const v = results.find((r) => r.type === type && r.site === "YouTube");
    if (v) return v.key;
  }
  return null;
}

async function fetchTMDBData(title: string, tmdbKey: string): Promise<TMDBData> {
  const empty: TMDBData = { watchProviders: null, synopsis: null, title: null, youtubeId: null };
  try {
    const searchUrl = new URL(`${TMDB_BASE}/search/tv`);
    searchUrl.searchParams.set("api_key", tmdbKey);
    searchUrl.searchParams.set("query", title);
    searchUrl.searchParams.set("page", "1");
    const searchRes = await fetch(searchUrl.toString(), NO_GZIP);
    if (!searchRes.ok) return empty;
    const searchData = await searchRes.json();
    const tvId = searchData.results?.[0]?.id;
    if (!tvId) return empty;

    const [provRes, detailRes, videoKoRes] = await Promise.all([
      fetch(`${TMDB_BASE}/tv/${tvId}/watch/providers?api_key=${tmdbKey}`, NO_GZIP),
      fetch(`${TMDB_BASE}/tv/${tvId}?api_key=${tmdbKey}&language=ko-KR`, NO_GZIP),
      fetch(`${TMDB_BASE}/tv/${tvId}/videos?api_key=${tmdbKey}&language=ko-KR`, NO_GZIP),
    ]);

    const watchProviders = provRes.ok ? (await provRes.json()).results?.KR ?? null : null;
    const detail = detailRes.ok ? await detailRes.json() : null;
    const synopsis = detail?.overview?.trim() || null;
    const koTitle = detail?.name?.trim() || null;

    // TMDB 영상: ko-KR 우선, 없으면 en-US fallback
    let youtubeId: string | null = null;
    if (videoKoRes.ok) {
      const videoKoData = await videoKoRes.json();
      youtubeId = pickYouTubeId(videoKoData.results ?? []);
    }
    if (!youtubeId) {
      const videoEnRes = await fetch(`${TMDB_BASE}/tv/${tvId}/videos?api_key=${tmdbKey}&language=en-US`, NO_GZIP);
      if (videoEnRes.ok) {
        const videoEnData = await videoEnRes.json();
        youtubeId = pickYouTubeId(videoEnData.results ?? []);
      }
    }

    return { watchProviders, synopsis, title: koTitle, youtubeId };
  } catch {
    return empty;
  }
}

async function fetchYouTubeTrailer(title: string, ytKey: string): Promise<string | null> {
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("key", ytKey);
    url.searchParams.set("q", `${title} anime trailer`);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    const res = await fetch(url.toString(), NO_GZIP);
    if (!res.ok) return null;
    const data = await res.json();
    return data.items?.[0]?.id?.videoId ?? null;
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const { mal_id } = await req.json();
    if (!mal_id) {
      return new Response(JSON.stringify({ error: "mal_id is required" }), { status: 400, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: cached } = await supabase
      .from("anime_cache")
      .select("data")
      .eq("mal_id", mal_id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: CORS });

    // Jikan 병렬 호출 (full + characters + recommendations + episodes)
    const [fullRes, charsRes, recsRes, epsRes] = await Promise.all([
      fetch(`${JIKAN}/anime/${mal_id}/full`, NO_GZIP),
      fetch(`${JIKAN}/anime/${mal_id}/characters`, NO_GZIP),
      fetch(`${JIKAN}/anime/${mal_id}/recommendations`, NO_GZIP),
      fetch(`${JIKAN}/anime/${mal_id}/episodes`, NO_GZIP),
    ]);

    if (!fullRes.ok) throw new Error(`Jikan full ${fullRes.status}`);

    const [fullData, charsData, recsData, epsData] = await Promise.all([
      fullRes.json(),
      charsRes.ok ? charsRes.json() : { data: [] },
      recsRes.ok ? recsRes.json() : { data: [] },
      epsRes.ok ? epsRes.json() : null,
    ]);

    const anime = fullData.data;

    // TMDB 조회: OTT + 한국어 시놉시스 + 한국어 제목 + 영상
    const tmdbKey = Deno.env.get("TMDB_API_KEY");
    const tmdb = tmdbKey
      ? await fetchTMDBData(anime.title_english ?? anime.title, tmdbKey)
      : { watchProviders: null, synopsis: null, title: null, youtubeId: null };

    // 트레일러 youtube_id: Jikan → TMDB 영상 → YouTube 검색 순서로 fallback
    let youtubeId: string | null = anime.trailer?.youtube_id ?? null;
    if (!youtubeId && tmdb.youtubeId) youtubeId = tmdb.youtubeId;
    if (!youtubeId) {
      const ytKey = Deno.env.get("YOUTUBE_API_KEY");
      if (ytKey) youtubeId = await fetchYouTubeTrailer(anime.title_english ?? anime.title, ytKey);
    }

    // 주요 성우 (일본어, Main 캐릭터만)
    const characters = ((charsData.data ?? []) as {
      character: { mal_id: number; name: string; images: { jpg: { image_url: string } } };
      role: string;
      voice_actors: { person: { name: string; images: { jpg: { image_url: string } } }; language: string }[];
    }[])
      .filter((c) => c.role === "Main")
      .slice(0, 10)
      .map((c) => ({
        character: c.character,
        role: c.role,
        voice_actors: c.voice_actors.filter((va) => va.language === "Japanese").slice(0, 1),
      }));

    const recommendations = ((recsData.data ?? []) as {
      entry: { mal_id: number; title: string; images: { jpg: { large_image_url: string } } };
    }[]).slice(0, 8);

    const airedEpisodes: number | null = epsData?.pagination?.items?.total ?? null;

    const result = {
      ...anime,
      title: tmdb.title ?? anime.title,
      synopsis: tmdb.synopsis ?? anime.synopsis,
      trailer: youtubeId
        ? { youtube_id: youtubeId, embed_url: `https://www.youtube.com/embed/${youtubeId}`, url: `https://youtu.be/${youtubeId}` }
        : anime.trailer,
      characters,
      recommendations,
      watch_providers: tmdb.watchProviders,
      aired_episodes: airedEpisodes,
    };

    await supabase.from("anime_cache").upsert({
      mal_id,
      data: result,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    });

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
