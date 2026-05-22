import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";
const NO_GZIP = { headers: { "Accept-Encoding": "identity" } };
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const VIDEO_PRIORITY = ["Trailer", "Teaser", "Featurette", "Clip"];

function pickTrailer(videos: { type: string; site: string; key: string }[]): string | null {
  for (const type of VIDEO_PRIORITY) {
    const v = videos.find((r) => r.type === type && r.site === "YouTube");
    if (v) return v.key;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const { id, language = "ko-KR" } = await req.json();
    if (!id)
      return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: CORS });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cacheId = `drama:${id}:${language}`;
    const { data: cached } = await supabase
      .from("movie_cache")
      .select("data")
      .eq("movie_id", cacheId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: CORS });

    const apiKey = Deno.env.get("TMDB_API_KEY")!;

    // TMDB 병렬 호출
    const [detailRes, creditsRes, videosKoRes, providersRes, similarRes] = await Promise.all([
      fetch(`${TMDB_BASE}/tv/${id}?api_key=${apiKey}&language=${language}`, NO_GZIP),
      fetch(`${TMDB_BASE}/tv/${id}/credits?api_key=${apiKey}&language=${language}`, NO_GZIP),
      fetch(`${TMDB_BASE}/tv/${id}/videos?api_key=${apiKey}&language=${language}`, NO_GZIP),
      fetch(`${TMDB_BASE}/tv/${id}/watch/providers?api_key=${apiKey}`, NO_GZIP),
      fetch(`${TMDB_BASE}/tv/${id}/recommendations?api_key=${apiKey}&language=${language}&page=1`, NO_GZIP),
    ]);

    if (!detailRes.ok) throw new Error(`TMDB detail ${detailRes.status}`);

    const [detail, credits, videosKo, providers, similar] = await Promise.all([
      detailRes.json(),
      creditsRes.ok ? creditsRes.json() : { cast: [], crew: [] },
      videosKoRes.ok ? videosKoRes.json() : { results: [] },
      providersRes.ok ? providersRes.json() : { results: {} },
      similarRes.ok ? similarRes.json() : { results: [] },
    ]);

    // 트레일러: ko-KR 우선, 없으면 en-US fallback
    let trailerKey = pickTrailer(videosKo.results ?? []);
    if (!trailerKey) {
      const videosEnRes = await fetch(`${TMDB_BASE}/tv/${id}/videos?api_key=${apiKey}&language=en-US`, NO_GZIP);
      if (videosEnRes.ok) {
        const videosEn = await videosEnRes.json();
        trailerKey = pickTrailer(videosEn.results ?? []);
      }
    }

    // overview가 비어있으면 영어로 fallback
    let overview = detail.overview?.trim() || "";
    if (!overview && language !== "en-US") {
      const enRes = await fetch(`${TMDB_BASE}/tv/${id}?api_key=${apiKey}&language=en-US`, NO_GZIP);
      if (enRes.ok) {
        const enDetail = await enRes.json();
        overview = enDetail.overview?.trim() || "";
      }
    }

    const result = {
      ...detail,
      overview,
      credits: {
        cast: (credits.cast ?? []).slice(0, 20),
        crew: (credits.crew ?? []).filter((c: { job: string }) => ["Director", "Creator", "Executive Producer"].includes(c.job)).slice(0, 5),
      },
      watch_providers: providers.results?.KR ?? null,
      similar: (similar.results ?? []).slice(0, 6),
      trailer_key: trailerKey,
    };

    await supabase.from("movie_cache").upsert({
      movie_id: cacheId,
      ui_language: language,
      data: result,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    }, { onConflict: "movie_id" });

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
