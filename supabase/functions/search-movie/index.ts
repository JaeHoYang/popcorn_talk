import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";
const NO_GZIP = { headers: { "Accept-Encoding": "identity" } };

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const { query, language = "ko-KR", searchType = "title" } = await req.json();

    if (!query?.trim()) {
      return new Response(JSON.stringify({ error: "query is required" }), { status: 400, headers: CORS });
    }

    const apiKey = Deno.env.get("TMDB_API_KEY")!;

    // 제목 검색 (기존)
    if (searchType === "title") {
      const url = new URL(`${TMDB_BASE}/search/movie`);
      url.searchParams.set("api_key", apiKey);
      url.searchParams.set("query", query.trim());
      url.searchParams.set("language", language);
      url.searchParams.set("include_adult", "false");

      const res = await fetch(url.toString(), NO_GZIP);
      if (!res.ok) throw new Error(`TMDB ${res.status}`);
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: CORS });
    }

    // 배우 / 감독 검색
    const personUrl = new URL(`${TMDB_BASE}/search/person`);
    personUrl.searchParams.set("api_key", apiKey);
    personUrl.searchParams.set("query", query.trim());
    personUrl.searchParams.set("language", language);

    const personRes = await fetch(personUrl.toString(), NO_GZIP);
    if (!personRes.ok) throw new Error(`TMDB person ${personRes.status}`);
    const personData = await personRes.json();

    const persons: { id: number; name: string; known_for_department: string }[] =
      personData.results ?? [];

    if (persons.length === 0) {
      return new Response(JSON.stringify({ results: [], person: null }), { headers: CORS });
    }

    // 첫 번째 매칭 인물 선택
    const person = persons[0];

    // 해당 인물의 영화 크레딧 조회
    const creditsUrl = new URL(`${TMDB_BASE}/person/${person.id}/movie_credits`);
    creditsUrl.searchParams.set("api_key", apiKey);
    creditsUrl.searchParams.set("language", language);

    const creditsRes = await fetch(creditsUrl.toString(), NO_GZIP);
    if (!creditsRes.ok) throw new Error(`TMDB credits ${creditsRes.status}`);
    const creditsData = await creditsRes.json();

    let movies: { id: number; title: string; release_date: string; poster_path: string | null; vote_average: number; overview: string }[] = [];

    if (searchType === "actor") {
      // 출연 영화 (cast)
      movies = (creditsData.cast ?? [])
        .filter((m: { vote_count: number }) => m.vote_count > 10)
        .sort((a: { popularity: number }, b: { popularity: number }) => b.popularity - a.popularity)
        .slice(0, 20);
    } else {
      // 감독 영화 (crew, job=Director)
      movies = (creditsData.crew ?? [])
        .filter((m: { job: string; vote_count: number }) => m.job === "Director" && m.vote_count > 10)
        .sort((a: { popularity: number }, b: { popularity: number }) => b.popularity - a.popularity)
        .slice(0, 20);
    }

    return new Response(JSON.stringify({
      results: movies,
      person: { id: person.id, name: person.name },
    }), { headers: CORS });

  } catch (err) {
    return errResponse(err);
  }
});
