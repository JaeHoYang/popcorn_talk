import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";
import { parseMangaItem, enrichCoversWithMAL, MANGADEX, NO_GZIP } from "../_shared/mangadex.ts";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// 플랫폼별 고정 캐시 UUID (hex만 허용)
const PLATFORM_CACHE_ID: Record<string, string> = {
  naver:   "00000000-0000-0000-0008-000000000001",
  kakao:   "00000000-0000-0000-0008-000000000002",
  lezhin:  "00000000-0000-0000-0008-000000000003",
  bomtoon: "00000000-0000-0000-0008-000000000004",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const { platform } = body;
    if (!platform) {
      return new Response(JSON.stringify({ error: "platform is required" }), { status: 400, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cacheId = PLATFORM_CACHE_ID[platform] ?? `00000000-0000-0000-0008-000000000099`;
    const { data: cached } = await supabase
      .from("popular_webtoon_cache")
      .select("data")
      .eq("id", cacheId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: CORS });

    // Supabase에서 플랫폼 큐레이션 목록 조회
    const { data: entries, error } = await supabase
      .from("webtoon_platforms")
      .select("mangadex_id, platform_url, sort_order")
      .eq("platform", platform)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ data: [] }), { headers: CORS });
    }

    // MangaDex에서 상세 정보 일괄 조회 (최대 100개)
    // URLSearchParams는 [] → %5B%5D 인코딩하므로 문자열 직접 조립
    const ids = entries.map((e: { mangadex_id: string }) => e.mangadex_id);
    const idParams = ids.map((id: string) => `ids[]=${encodeURIComponent(id)}`).join("&");
    const urlStr = `${MANGADEX}/manga?${idParams}&includes[]=cover_art&includes[]=author&limit=${ids.length}`;

    const res = await fetch(urlStr, NO_GZIP);
    if (!res.ok) throw new Error(`MangaDex ${res.status}`);
    const raw = await res.json();

    // sort_order 순서대로 정렬
    const mangaMap = new Map(
      (raw.data ?? []).map((item: { id: string }) => [item.id, item])
    );
    const parsed = entries
      .map((e: { mangadex_id: string; platform_url: string | null }) => {
        const manga = mangaMap.get(e.mangadex_id);
        if (!manga) return null;
        return {
          ...parseMangaItem(manga as Parameters<typeof parseMangaItem>[0]),
          platform_url: e.platform_url,
        };
      })
      .filter(Boolean);

    const enriched = await enrichCoversWithMAL(parsed as Parameters<typeof enrichCoversWithMAL>[0]);
    const result = { data: enriched };

    await supabase.from("popular_webtoon_cache").upsert({
      id: cacheId,
      data: result,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    });

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
