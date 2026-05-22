import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function cacheId(page: number): string {
  // page=1은 기존 ID 유지 (하위 호환), 2페이지 이상은 별도 ID
  if (page === 1) return "00000000-0000-0000-0000-000000000001";
  return `00000000-0000-0000-0001-${String(page).padStart(12, "0")}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const language: string = body.language ?? "ko-KR";
    const page: number = Math.max(1, Number(body.page) || 1);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const id = cacheId(page);
    const { data: cached } = await supabase
      .from("popular_movies_cache")
      .select("data")
      .eq("id", id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) {
      return new Response(JSON.stringify(cached.data), { headers: CORS });
    }

    const tmdbKey = Deno.env.get("TMDB_API_KEY");
    const url = new URL(`${TMDB_BASE}/movie/popular`);
    url.searchParams.set("api_key", tmdbKey!);
    url.searchParams.set("language", language);
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), { headers: { "Accept-Encoding": "identity" } });
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();

    await supabase.from("popular_movies_cache").upsert({
      id,
      data,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    });

    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (err) {
    console.error("[ERR]", err instanceof Error ? err.message : String(err));
    return errResponse(err);
  }
});
