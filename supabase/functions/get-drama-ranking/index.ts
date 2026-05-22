import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";
const NO_GZIP = { headers: { "Accept-Encoding": "identity" } };
const CACHE_TTL_MS = 60 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const filter: string = body.filter ?? "popularity";
    const country: string = body.country ?? "ALL";
    const page: number = Math.max(1, Number(body.page) || 1);
    const genres: string = body.genres ?? "";
    const yearFrom: string = body.yearFrom ?? "";
    const yearTo: string = body.yearTo ?? "";
    const minRating: number = Number(body.minRating) || 0;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cacheId = `drama-ranking:${filter}:${country}:${page}:${genres}:${yearFrom}:${yearTo}:${minRating}`;
    const { data: cached } = await supabase
      .from("boxoffice_cache")
      .select("data")
      .eq("id", cacheId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: CORS });

    const apiKey = Deno.env.get("TMDB_API_KEY")!;
    const url = new URL(`${TMDB_BASE}/discover/tv`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", "ko-KR");
    url.searchParams.set("page", String(page));
    url.searchParams.set("with_type", "2|4"); // Miniseries | Scripted (예능/리얼리티 제외)
    url.searchParams.set("without_genres", "16,10764,10767"); // 애니메이션·리얼리티·토크쇼 제외

    if (filter === "rating") {
      url.searchParams.set("sort_by", "vote_average.desc");
      url.searchParams.set("vote_count.gte", "100");
    } else if (filter === "newest") {
      url.searchParams.set("sort_by", "first_air_date.desc");
    } else if (filter === "airing") {
      url.searchParams.set("sort_by", "popularity.desc");
      url.searchParams.set("with_status", "0"); // Returning Series
    } else if (filter === "upcoming") {
      const today = new Date().toISOString().slice(0, 10);
      url.searchParams.set("sort_by", "first_air_date.asc");
      url.searchParams.set("first_air_date.gte", today);
      url.searchParams.set("with_status", "1"); // Planned
    } else if (filter === "ended") {
      url.searchParams.set("sort_by", "popularity.desc");
      url.searchParams.set("with_status", "3"); // Ended
    } else {
      url.searchParams.set("sort_by", "popularity.desc");
    }

    if (country !== "ALL") url.searchParams.set("with_origin_country", country);
    if (genres) url.searchParams.set("with_genres", genres);
    if (yearFrom) url.searchParams.set("first_air_date.gte", `${yearFrom}-01-01`);
    if (yearTo)   url.searchParams.set("first_air_date.lte", `${yearTo}-12-31`);
    if (minRating > 0) {
      url.searchParams.set("vote_average.gte", String(minRating));
      if (!url.searchParams.has("vote_count.gte")) url.searchParams.set("vote_count.gte", "20");
    }

    const res = await fetch(url.toString(), NO_GZIP);
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    data.results = (data.results ?? []).filter((r: { poster_path: string | null }) => !!r.poster_path);

    await supabase.from("boxoffice_cache").upsert({
      id: cacheId,
      box_type: "drama-ranking",
      data,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    }, { onConflict: "id" });

    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
