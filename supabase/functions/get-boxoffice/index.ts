import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface BoxofficeEntry {
  rank: number;
  rankChange: number;
  isNew: boolean;
  movieCd: string;
  movieNm: string;
  openDt: string;
  audiCnt: number;
  audiAcc: number;
  tmdbId: number | null;
  poster_path: string | null;
}

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// 해당 월의 모든 월요일 YYYYMMDD 반환
function getMondaysInMonth(yyyymm: string): string[] {
  const year = parseInt(yyyymm.slice(0, 4));
  const month = parseInt(yyyymm.slice(4, 6)) - 1;
  const mondays: string[] = [];
  const d = new Date(year, month, 1);
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1);
  while (d.getMonth() === month) {
    mondays.push(toYYYYMMDD(d));
    d.setDate(d.getDate() + 7);
  }
  return mondays;
}

function getDefaultDate(type: "daily" | "weekly" | "monthly"): string {
  const d = new Date();
  if (type === "daily") {
    d.setDate(d.getDate() - 1);
    return toYYYYMMDD(d);
  } else if (type === "weekly") {
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff - 7);
    return toYYYYMMDD(d);
  } else {
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
}

async function searchTMDB(
  title: string,
  apiKey: string
): Promise<{ tmdbId: number | null; poster_path: string | null }> {
  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", title);
  url.searchParams.set("language", "ko-KR");
  url.searchParams.set("page", "1");

  try {
    const res = await fetch(url.toString(), {
      headers: { "Accept-Encoding": "identity" },
    });
    if (!res.ok) return { tmdbId: null, poster_path: null };
    const data = await res.json();
    const first = data.results?.[0];
    if (!first) return { tmdbId: null, poster_path: null };
    return { tmdbId: first.id as number, poster_path: (first.poster_path as string) ?? null };
  } catch {
    return { tmdbId: null, poster_path: null };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const type: "daily" | "weekly" | "monthly" =
      body.type === "weekly" ? "weekly" : body.type === "monthly" ? "monthly" : "daily";
    const targetDt: string = body.targetDt ?? getDefaultDate(type);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 캐시 확인
    const cacheId = `${type}:${targetDt}`;
    const { data: cached } = await supabase
      .from("boxoffice_cache")
      .select("data")
      .eq("id", cacheId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify(cached.data), { headers: CORS });
    }

    const kobisKey = Deno.env.get("KOBIS_API_KEY");
    const tmdbKey = Deno.env.get("TMDB_API_KEY")!;

    if (!kobisKey) {
      return new Response(JSON.stringify({ error: "KOBIS_API_KEY not configured" }), {
        status: 503,
        headers: CORS,
      });
    }

    type RawEntry = {
      rank: string;
      rankInten: string;
      rankOldAndNew: string;
      movieCd: string;
      movieNm: string;
      openDt: string;
      audiCnt: string;
      audiAcc: string;
    };

    let entries: BoxofficeEntry[];
    let showRange: string;

    if (type === "monthly") {
      // 월간: 해당 월의 모든 주간 데이터 집계
      const mondays = getMondaysInMonth(targetDt);
      const weekResults = await Promise.all(
        mondays.map(async (monday) => {
          const url = new URL("https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchWeeklyBoxOfficeList.json");
          url.searchParams.set("key", kobisKey);
          url.searchParams.set("targetDt", monday);
          url.searchParams.set("itemPerPage", "50");
          url.searchParams.set("weekGb", "0");
          try {
            const res = await fetch(url.toString());
            if (!res.ok) return [] as RawEntry[];
            const data = await res.json();
            return (data.boxOfficeResult?.weeklyBoxOfficeList ?? []) as RawEntry[];
          } catch {
            return [] as RawEntry[];
          }
        })
      );

      // movieCd 기준 집계
      const movieMap = new Map<string, { movieCd: string; movieNm: string; openDt: string; totalAudiCnt: number; maxAudiAcc: number }>();
      for (const weekList of weekResults) {
        for (const item of weekList) {
          const audiCnt = parseInt(item.audiCnt.replace(/,/g, "") || "0");
          const audiAcc = parseInt(item.audiAcc.replace(/,/g, "") || "0");
          const existing = movieMap.get(item.movieCd);
          if (existing) {
            existing.totalAudiCnt += audiCnt;
            existing.maxAudiAcc = Math.max(existing.maxAudiAcc, audiAcc);
          } else {
            movieMap.set(item.movieCd, { movieCd: item.movieCd, movieNm: item.movieNm, openDt: item.openDt, totalAudiCnt: audiCnt, maxAudiAcc: audiAcc });
          }
        }
      }

      const sorted = Array.from(movieMap.values()).sort((a, b) => b.totalAudiCnt - a.totalAudiCnt).slice(0, 50);
      entries = await Promise.all(
        sorted.map(async (movie, idx) => {
          const { tmdbId, poster_path } = await searchTMDB(movie.movieNm, tmdbKey);
          return { rank: idx + 1, rankChange: 0, isNew: false, movieCd: movie.movieCd, movieNm: movie.movieNm, openDt: movie.openDt, audiCnt: movie.totalAudiCnt, audiAcc: movie.maxAudiAcc, tmdbId, poster_path };
        })
      );
      showRange = `${targetDt.slice(0, 4)}년 ${parseInt(targetDt.slice(4, 6))}월`;
    } else {
      // 일별 / 주간
      const kobisEndpoint = type === "daily"
        ? "https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json"
        : "https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchWeeklyBoxOfficeList.json";
      const listKey = type === "daily" ? "dailyBoxOfficeList" : "weeklyBoxOfficeList";

      // KOBIS는 페이지당 최대 10개 → 3페이지 병렬 요청으로 최대 30개 수집
      const pageResults = await Promise.all([1, 2, 3].map(async (curPage) => {
        const url = new URL(kobisEndpoint);
        url.searchParams.set("key", kobisKey);
        url.searchParams.set("targetDt", targetDt);
        url.searchParams.set("itemPerPage", "10");
        url.searchParams.set("curPage", String(curPage));
        if (type === "weekly") url.searchParams.set("weekGb", "0");
        try {
          const res = await fetch(url.toString());
          if (!res.ok) return { list: [] as RawEntry[], showRange: "" };
          const data = await res.json();
          return {
            list: (data.boxOfficeResult?.[listKey] ?? []) as RawEntry[],
            showRange: (data.boxOfficeResult?.showRange as string) ?? "",
          };
        } catch {
          return { list: [] as RawEntry[], showRange: "" };
        }
      }));

      showRange = pageResults[0].showRange;
      const rawList = pageResults.flatMap((p) => p.list);

      entries = await Promise.all(
        rawList.map(async (item) => {
          const { tmdbId, poster_path } = await searchTMDB(item.movieNm, tmdbKey);
          return {
            rank: parseInt(item.rank),
            rankChange: parseInt(item.rankInten),
            isNew: item.rankOldAndNew === "NEW",
            movieCd: item.movieCd,
            movieNm: item.movieNm,
            openDt: item.openDt,
            audiCnt: parseInt(item.audiCnt.replace(/,/g, "") || "0"),
            audiAcc: parseInt(item.audiAcc.replace(/,/g, "") || "0"),
            tmdbId,
            poster_path,
          };
        })
      );
    }

    const result = {
      type,
      targetDt,
      showRange,
      list: entries,
    };

    // 캐시 저장
    await supabase.from("boxoffice_cache").upsert(
      {
        id: cacheId,
        box_type: type,
        data: result,
        expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      },
      { onConflict: "id" }
    );

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
