import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";
const OMDB_BASE = "https://www.omdbapi.com";
const NO_GZIP = { headers: { "Accept-Encoding": "identity" } };
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const { movie_id, language = "ko-KR" } = await req.json();
    if (!movie_id) {
      return new Response(JSON.stringify({ error: "movie_id is required" }), { status: 400, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 캐시 조회
    const { data: cached, error: cacheError } = await supabase
      .from("movie_cache")
      .select("data")
      .eq("movie_id", String(movie_id))
      .eq("ui_language", language)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached && !cacheError) {
      return new Response(JSON.stringify(cached.data), { headers: CORS });
    }

    const tmdbKey = Deno.env.get("TMDB_API_KEY")!;
    const omdbKey = Deno.env.get("OMDB_API_KEY");
    const base = `${TMDB_BASE}/movie/${movie_id}`;
    const langParam = `language=${language}&api_key=${tmdbKey}`;

    // TMDB 병렬 호출
    const [detailRes, creditsRes, videosRes, reviewsRes, similarRes, providersRes, collectionsBaseRes] =
      await Promise.all([
        fetch(`${base}?${langParam}`, NO_GZIP),
        fetch(`${base}/credits?${langParam}`, NO_GZIP),
        fetch(`${base}/videos?${langParam}`, NO_GZIP),
        fetch(`${base}/reviews?${langParam}&page=1`, NO_GZIP),
        fetch(`${base}/similar?${langParam}&page=1`, NO_GZIP),
        fetch(`${base}/watch/providers?api_key=${tmdbKey}`, NO_GZIP),
        fetch(`${base}?api_key=${tmdbKey}&language=en-US`, NO_GZIP),
      ]);

    if (!detailRes.ok) throw new Error(`TMDB detail ${detailRes.status}`);

    const [detail, credits, videos, reviews, similar, providers, detailEn] = await Promise.all([
      detailRes.json(),
      creditsRes.ok ? creditsRes.json() : { cast: [], crew: [] },
      videosRes.ok ? videosRes.json() : { results: [] },
      reviewsRes.ok ? reviewsRes.json() : { results: [] },
      similarRes.ok ? similarRes.json() : { results: [] },
      providersRes.ok ? providersRes.json() : { results: {} },
      collectionsBaseRes.ok ? collectionsBaseRes.json() : null,
    ]);

    // 시리즈 정보 (belongs_to_collection 있을 때만)
    let collection = null;
    const collectionId = detailEn?.belongs_to_collection?.id;
    if (collectionId) {
      const colRes = await fetch(`${TMDB_BASE}/collection/${collectionId}?${langParam}`, NO_GZIP);
      if (colRes.ok) collection = await colRes.json();
    }

    // OMDB IMDb 평점 (imdb_id 있을 때만)
    let imdbRating: string | null = null;
    if (omdbKey && detail.imdb_id) {
      const omdbRes = await fetch(`${OMDB_BASE}/?i=${detail.imdb_id}&apikey=${omdbKey}`);
      if (omdbRes.ok) {
        const omdb = await omdbRes.json();
        imdbRating = omdb.imdbRating !== "N/A" ? omdb.imdbRating : null;
      }
    }

    // YouTube 예고편 필터
    const trailers = (videos.results as Array<{ type: string; site: string; key: string; name: string }>)
      .filter((v) => v.type === "Trailer" && v.site === "YouTube")
      .slice(0, 3);

    // 감독 + 배우 상위 10명
    const director = (credits.crew as Array<{ job: string; id: number; name: string; profile_path: string | null }>)
      .find((c) => c.job === "Director") ?? null;
    const cast = (credits.cast as Array<{ id: number; name: string; character: string; profile_path: string | null }>)
      .slice(0, 10);

    // OTT (KR 기준)
    const watchProviders = providers.results?.KR ?? null;

    const result = {
      ...detail,
      trailers,
      director,
      cast,
      reviews: reviews.results?.slice(0, 5) ?? [],
      similar: similar.results?.slice(0, 6) ?? [],
      watch_providers: watchProviders,
      collection,
      imdb_rating: imdbRating,
    };

    // 캐시 저장 (upsert)
    await supabase.from("movie_cache").upsert(
      {
        movie_id: String(movie_id),
        ui_language: language,
        data: result,
        expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      },
      { onConflict: "movie_id,ui_language" }
    );

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
