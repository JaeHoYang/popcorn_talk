import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";
const NO_GZIP = { headers: { "Accept-Encoding": "identity" } };
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const { person_id, language = "ko-KR" } = await req.json();
    if (!person_id) {
      return new Response(JSON.stringify({ error: "person_id is required" }), { status: 400, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 캐시 조회
    const { data: cached, error: cacheError } = await supabase
      .from("person_cache")
      .select("data")
      .eq("person_id", String(person_id))
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached && !cacheError) {
      return new Response(JSON.stringify(cached.data), { headers: CORS });
    }

    const tmdbKey = Deno.env.get("TMDB_API_KEY")!;
    const base = `${TMDB_BASE}/person/${person_id}`;
    const langParam = `language=${language}&api_key=${tmdbKey}`;

    const [detailRes, creditsRes] = await Promise.all([
      fetch(`${base}?${langParam}`, NO_GZIP),
      fetch(`${base}/movie_credits?${langParam}`, NO_GZIP),
    ]);

    if (!detailRes.ok) throw new Error(`TMDB person ${detailRes.status}`);

    const [detail, movieCredits] = await Promise.all([
      detailRes.json(),
      creditsRes.ok ? creditsRes.json() : { cast: [], crew: [] },
    ]);

    // 필모그래피: 출연(cast) + 감독(crew) 병합 후 개봉일 최신순 정렬
    const filmography = [
      ...(movieCredits.cast as Array<{ id: number; title: string; release_date: string; poster_path: string | null; character: string }>)
        .map((m) => ({ ...m, role: "배우", role_en: "Actor" })),
      ...(movieCredits.crew as Array<{ id: number; title: string; release_date: string; poster_path: string | null; job: string }>)
        .filter((m) => m.job === "Director")
        .map((m) => ({ ...m, character: "", role: "감독", role_en: "Director" })),
    ]
      .filter((m) => m.release_date)
      .sort((a, b) => b.release_date.localeCompare(a.release_date))
      .slice(0, 30);

    const result = { ...detail, filmography };

    // 캐시 저장 (upsert)
    await supabase.from("person_cache").upsert(
      {
        person_id: String(person_id),
        data: result,
        expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      },
      { onConflict: "person_id" }
    );

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
