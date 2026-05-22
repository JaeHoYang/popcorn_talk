import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";

// 무드 섹션과 동일한 기준 적용
const DEFAULT_MIN_VOTE_COUNT = 100;

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const {
      genres = "",
      language = "ko-KR",
      original_language = "",
      sort_by = "popularity.desc",
      year_from = "",
      year_to = "",
      min_vote_average = 0,
      min_vote_count = DEFAULT_MIN_VOTE_COUNT,
    } = body;
    const page: number = Math.max(1, Number(body.page) || 1);

    const url = new URL(`${TMDB_BASE}/discover/movie`);
    url.searchParams.set("api_key", Deno.env.get("TMDB_API_KEY")!);
    url.searchParams.set("language", language);
    url.searchParams.set("sort_by", sort_by);
    url.searchParams.set("include_adult", "false");

    if (genres)            url.searchParams.set("with_genres", genres);
    if (original_language) url.searchParams.set("with_original_language", original_language);
    if (year_from)         url.searchParams.set("primary_release_date.gte", `${year_from}-01-01`);
    if (year_to)           url.searchParams.set("primary_release_date.lte", `${year_to}-12-31`);
    if (min_vote_average > 0) url.searchParams.set("vote_average.gte", String(min_vote_average));
    if (min_vote_count > 0)   url.searchParams.set("vote_count.gte", String(min_vote_count));
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), { headers: { "Accept-Encoding": "identity" } });
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();

    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
