import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";
import { anilistRequest, parseAnilistMedia, DETAIL_QUERY, STAFF_WORKS_QUERY } from "../_shared/anilist.ts";
// MangaDex fallback (curated list 등)
import { parseMangaItem, enrichCoversWithMAL, MANGADEX, NO_GZIP } from "../_shared/mangadex.ts";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const LINK_NAME: Record<string, string> = {
  "Naver Webtoon":   "네이버 웹툰",
  "Kakao Webtoon":   "카카오 웹툰",
  "Kakao Page":      "카카오페이지",
  "Lezhin Comics":   "레진코믹스",
  "Webtoons.com":    "공식 영문판",
  "Official Site":   "공식 사이트",
  "MangaDex":        "MangaDex",
  "MyAnimeList":     "MyAnimeList",
  "AniList":         "AniList",
  "MangaUpdates":    "MangaUpdates",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const { id } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "id is required" }), { status: 400, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cacheKey = String(id);
    const { data: cached } = await supabase
      .from("webtoon_cache")
      .select("data")
      .eq("id", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data) return new Response(JSON.stringify(cached.data), { headers: CORS });

    // MangaDex UUID (contains '-') → 기존 MangaDex 처리
    if (String(id).includes("-")) {
      return await handleMangaDex(id, cacheKey, supabase);
    }

    // AniList 숫자 ID 처리
    const anilistId = parseInt(id);
    if (isNaN(anilistId)) {
      return new Response(JSON.stringify({ error: "invalid id" }), { status: 400, headers: CORS });
    }

    const data = await anilistRequest<{ Media: Record<string, unknown> }>(DETAIL_QUERY, { id: anilistId });
    if (!data?.Media) throw new Error("AniList: media not found");

    const media = data.Media as {
      id: number;
      title: { native?: string; english?: string | null; romaji?: string };
      coverImage: { large?: string; extraLarge?: string };
      averageScore?: number | null;
      popularity?: number;
      status?: string;
      genres?: string[];
      tags?: { name: string; category: string; isMediaSpoiler?: boolean }[];
      description?: string | null;
      startDate?: { year?: number | null };
      chapters?: number | null;
      staff?: { edges: { role: string; node: { id?: number; name: { native?: string; full?: string } } }[] };
      externalLinks?: { url: string; site: string }[];
      relations?: {
        edges: {
          relationType: string;
          node: {
            id: number; type: string;
            title: { native?: string; romaji?: string };
            coverImage?: { large?: string };
            status?: string;
            startDate?: { year?: number | null };
            siteUrl?: string;
          };
        }[];
      };
      recommendations?: {
        nodes: {
          rating?: number;
          mediaRecommendation?: {
            id: number;
            title: { native?: string; romaji?: string };
            coverImage?: { large?: string };
            averageScore?: number | null;
            popularity?: number;
            status?: string;
            genres?: string[];
            startDate?: { year?: number | null };
            chapters?: number | null;
            staff?: { edges: { role: string; node: { name: { native?: string; full?: string } } }[] };
          };
        }[];
      };
    };

    const base = parseAnilistMedia(media);

    // 플랫폼 링크
    const platforms: { name: string; url: string }[] = (media.externalLinks ?? [])
      .filter((l) => LINK_NAME[l.site])
      .map((l) => ({ name: LINK_NAME[l.site], url: l.url }));
    platforms.push({ name: "AniList", url: `https://anilist.co/manga/${anilistId}` });

    // 애니화 정보
    const animeEdge = (media.relations?.edges ?? []).find(
      (e) => e.relationType === "ADAPTATION" && e.node.type === "ANIME"
    );
    const anime_adaptation = animeEdge
      ? {
          title: animeEdge.node.title?.native || animeEdge.node.title?.romaji || "",
          title_en: animeEdge.node.title?.romaji || null,
          cover_url: animeEdge.node.coverImage?.large || null,
          year: animeEdge.node.startDate?.year || null,
          episodes: null,
          status: animeEdge.node.status || null,
          anilist_url: animeEdge.node.siteUrl || null,
        }
      : null;

    // 원작 정보
    const adapted_from = (media.relations?.edges ?? [])
      .filter((e) => e.relationType === "SOURCE")
      .map((e) => ({
        id: String(e.node.id),
        title: e.node.title?.native || e.node.title?.romaji || "",
      }))
      .filter((e) => e.title);

    // 유사 웹툰 (AniList 추천)
    const similar = (media.recommendations?.nodes ?? [])
      .filter((n) => n.mediaRecommendation && (n.rating ?? 0) >= 0)
      .map((n) => parseAnilistMedia(n.mediaRecommendation!))
      .filter((w) => w.id !== String(anilistId))
      .slice(0, 8);

    // 작가 다른 작품
    let author_other_works: ReturnType<typeof parseAnilistMedia>[] = [];
    const storyEdge = (media.staff?.edges ?? []).find((e) =>
      ["Story & Art", "Story", "Original Story", "Original Creator"].includes(e.role)
    );
    if (storyEdge?.node?.id) {
      const staffData = await anilistRequest<{
        Staff: { staffMedia: { nodes: unknown[] } };
      }>(STAFF_WORKS_QUERY, { staffId: storyEdge.node.id, excludeId: anilistId });

      if (staffData?.Staff?.staffMedia?.nodes) {
        author_other_works = staffData.Staff.staffMedia.nodes
          .map((m) => parseAnilistMedia(m as Parameters<typeof parseAnilistMedia>[0]))
          .filter((w) => w.id !== String(anilistId))
          .slice(0, 6);
      }
    }

    const result = {
      ...base,
      platforms,
      similar,
      anime_adaptation,
      adapted_from,
      author_other_works,
    };

    await supabase.from("webtoon_cache").upsert({
      id: cacheKey,
      data: result,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    });

    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});

// MangaDex UUID fallback (큐레이션 목록용)
async function handleMangaDex(id: string, cacheKey: string, supabase: ReturnType<typeof createClient>) {
  const JIKAN = "https://api.jikan.moe/v4";

  const detailUrl = `${MANGADEX}/manga/${id}?includes[]=cover_art&includes[]=author`;
  const statsUrl  = `${MANGADEX}/statistics/manga/${id}`;

  const [detailRes, statsRes] = await Promise.all([fetch(detailUrl, NO_GZIP), fetch(statsUrl, NO_GZIP)]);
  if (!detailRes.ok) throw new Error(`MangaDex detail ${detailRes.status}`);

  const [detailRaw, statsRaw] = await Promise.all([detailRes.json(), statsRes.ok ? statsRes.json() : null]);
  const manga = detailRaw.data;
  const [base] = await enrichCoversWithMAL([parseMangaItem(manga)]);

  const stats = statsRaw?.statistics?.[id];
  const followed_count: number | null = stats?.follows ?? null;
  const score: number | null = stats?.rating?.bayesian
    ? Math.round(stats.rating.bayesian * 100) / 100
    : null;

  const links = manga.attributes?.links ?? {};
  const LINK_MAP: Record<string, string> = {
    naver: "네이버 웹툰", kakao: "카카오 웹툰", lezhin: "레진코믹스",
    engtl: "공식 영문판", raw: "공식 원문",
  };
  const platforms: { name: string; url: string }[] = Object.entries(LINK_MAP)
    .filter(([key]) => links[key])
    .map(([key, name]) => ({ name, url: links[key] }));
  if (links.al)  platforms.push({ name: "AniList",      url: `https://anilist.co/manga/${links.al}` });
  if (links.mal) platforms.push({ name: "MyAnimeList",  url: `https://myanimelist.net/manga/${links.mal}` });
  platforms.push({ name: "MangaDex", url: `https://mangadex.org/title/${id}` });

  const finalScore = score ?? (base.title ? await fetchJikanScore(JIKAN, base.title_english ?? base.title) : null);

  const result = {
    ...base, followed_count, score: finalScore, platforms,
    similar: [], anime_adaptation: null, adapted_from: [], author_other_works: [],
  };

  await supabase.from("webtoon_cache").upsert({
    id: cacheKey, data: result,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  return new Response(JSON.stringify(result), { headers: CORS });
}

async function fetchJikanScore(jikan: string, title: string): Promise<number | null> {
  try {
    const url = new URL(`${jikan}/manga`);
    url.searchParams.set("q", title);
    url.searchParams.set("type", "manhwa");
    url.searchParams.set("limit", "1");
    const res = await fetch(url.toString(), NO_GZIP);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.score ?? null;
  } catch { return null; }
}
