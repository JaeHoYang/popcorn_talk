import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";
const NO_GZIP = { headers: { "Accept-Encoding": "identity" } };
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const country: string = body.country ?? "KR";
    const page: number = body.page ?? 1;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cacheId = `popular-drama:${country}:${page}`;
    const { data: cached } = await supabase
      .from("boxoffice_cache") // 범용 캐시 테이블 재사용
      .select("data")
      .eq("id", cacheId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: CORS });

    const apiKey = Deno.env.get("TMDB_API_KEY")!;
    const url = new URL(`${TMDB_BASE}/discover/tv`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("language", "ko-KR");
    url.searchParams.set("sort_by", "popularity.desc");
    url.searchParams.set("page", String(page));
    url.searchParams.set("with_type", "2|4"); // Miniseries | Scripted (예능/리얼리티 제외)
    url.searchParams.set("without_genres", "16,10764,10767"); // 애니메이션·리얼리티·토크쇼 제외
    if (country !== "ALL") url.searchParams.set("with_origin_country", country);

    const res = await fetch(url.toString(), NO_GZIP);
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    data.results = (data.results ?? []).filter((r: { poster_path: string | null }) => !!r.poster_path);

    await supabase.from("boxoffice_cache").upsert({
      id: cacheId,
      box_type: "drama",
      data,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    }, { onConflict: "id" });

    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
