import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    // 관리자 인증 확인
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const since7  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000).toISOString();

    // 방문 요약 (30일)
    const { data: pageRows } = await supabase
      .from("page_views")
      .select("ip, created_at")
      .gte("created_at", since30);

    const totalVisits  = pageRows?.length ?? 0;
    const uniqueIPs    = new Set(pageRows?.map((r) => r.ip).filter(Boolean)).size;

    // 일별 방문 수 (7일)
    const dailyMap = new Map<string, number>();
    for (const row of pageRows ?? []) {
      if (row.created_at >= since7) {
        const day = row.created_at.slice(0, 10);
        dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
      }
    }
    const dailyVisits = Array.from(dailyMap.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // IP별 방문 TOP 10 (30일)
    const ipMap = new Map<string, number>();
    for (const row of pageRows ?? []) {
      if (!row.ip) continue;
      ipMap.set(row.ip, (ipMap.get(row.ip) ?? 0) + 1);
    }
    const topIPs = Array.from(ipMap.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 영화 / 드라마 / 애니 / 웹툰 조회 TOP 10 (30일) — 병렬
    const [{ data: movieRows }, { data: dramaRows }, { data: animeRows }, { data: webtoonRows }] = await Promise.all([
      supabase.from("movie_views").select("movie_id, movie_title, poster_path").gte("created_at", since30),
      supabase.from("drama_views").select("drama_id, title").gte("created_at", since30),
      supabase.from("anime_views").select("mal_id, title").gte("created_at", since30),
      supabase.from("webtoon_views").select("webtoon_id, title").gte("created_at", since30),
    ]);

    const movieMap = new Map<string, { movie_id: string; movie_title: string; poster_path: string | null; count: number }>();
    for (const row of movieRows ?? []) {
      const existing = movieMap.get(row.movie_id);
      if (existing) {
        existing.count++;
      } else {
        movieMap.set(row.movie_id, { movie_id: row.movie_id, movie_title: row.movie_title, poster_path: row.poster_path, count: 1 });
      }
    }
    const topMovies = Array.from(movieMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const dramaMap = new Map<string, { drama_id: string; title: string; count: number }>();
    for (const row of dramaRows ?? []) {
      const existing = dramaMap.get(row.drama_id);
      if (existing) {
        existing.count++;
      } else {
        dramaMap.set(row.drama_id, { drama_id: row.drama_id, title: row.title, count: 1 });
      }
    }
    const topDramas = Array.from(dramaMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const animeMap = new Map<number, { mal_id: number; title: string; count: number }>();
    for (const row of animeRows ?? []) {
      const existing = animeMap.get(row.mal_id);
      if (existing) {
        existing.count++;
      } else {
        animeMap.set(row.mal_id, { mal_id: row.mal_id, title: row.title, count: 1 });
      }
    }
    const topAnime = Array.from(animeMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const webtoonMap = new Map<string, { webtoon_id: string; title: string; count: number }>();
    for (const row of webtoonRows ?? []) {
      const existing = webtoonMap.get(row.webtoon_id);
      if (existing) {
        existing.count++;
      } else {
        webtoonMap.set(row.webtoon_id, { webtoon_id: row.webtoon_id, title: row.title, count: 1 });
      }
    }
    const topWebtoons = Array.from(webtoonMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return new Response(JSON.stringify({
      summary: {
        totalVisits,
        uniqueIPs,
        totalMovieViews: movieRows?.length ?? 0,
        totalDramaViews: dramaRows?.length ?? 0,
        totalAnimeViews: animeRows?.length ?? 0,
        totalWebtoonViews: webtoonRows?.length ?? 0,
      },
      dailyVisits,
      topIPs,
      topMovies,
      topDramas,
      topAnime,
      topWebtoons,
    }), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
