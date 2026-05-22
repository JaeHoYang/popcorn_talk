// MangaDex 응답을 공통 Webtoon 형태로 변환하는 헬퍼

// MangaDex 태그 영어 → 한국어 번역 맵
const TAG_KO: Record<string, string> = {
  // 장르
  "Action":        "액션",
  "Adventure":     "모험",
  "Comedy":        "코미디",
  "Drama":         "드라마",
  "Fantasy":       "판타지",
  "Horror":        "공포",
  "Mystery":       "미스터리",
  "Psychological": "심리",
  "Romance":       "로맨스",
  "Sci-Fi":        "SF",
  "Slice of Life": "일상",
  "Sports":        "스포츠",
  "Thriller":      "스릴러",
  "Tragedy":       "비극",
  "Isekai":        "이세계",
  "Mecha":         "메카",
  "Wuxia":         "무협",
  "Philosophical": "철학",
  "Superhero":     "슈퍼히어로",
  "Survival":      "서바이벌",
  // 테마
  "Time Travel":        "시간여행",
  "Monsters":           "몬스터",
  "Martial Arts":       "무술",
  "Magic":              "마법",
  "Supernatural":       "초자연",
  "Reincarnation":      "환생",
  "Dungeons":           "던전",
  "System":             "시스템",
  "Strong Lead":        "강한 주인공",
  "Revenge":            "복수",
  "Harem":              "하렘",
  "Historical":         "역사",
  "School Life":        "학원",
  "Office Workers":     "직장인",
  "Video Games":        "게임",
  "Virtual Reality":    "가상현실",
  "Ghosts":             "귀신",
  "Vampires":           "뱀파이어",
  "Zombies":            "좀비",
  "Demons":             "악마",
  "Gods":               "신",
  "Military":           "군사물",
  "Post-Apocalyptic":   "포스트아포칼립스",
  "Villainess":         "악역 영애",
  "Regression":         "회귀",
  "Alchemy":            "연금술",
  "Amnesia":            "기억상실",
  "Animals":            "동물",
  "Crossdressing":      "크로스드레싱",
  "Delinquents":        "불량배",
  "Gyaru":              "갸루",
  "Mafia":              "마피아",
  "Ninja":              "닌자",
  "Samurai":            "사무라이",
  "Cultivation":        "수련",
  "Cyberpunk":          "사이버펑크",
  "Pirates":            "해적",
  "Police":             "경찰",
  "Cooking":            "요리",
  "Music":              "음악",
  "Medical":            "의료",
  "Nobility":           "귀족",
  "Politics":           "정치",
  "Tournament":         "토너먼트",
  "Tragedy":            "비극",
  "Space":              "우주",
  "Aliens":             "외계인",
  "Robots/Androids":    "로봇/안드로이드",
};

export interface WebtoonItem {
  id: string;
  title: string;
  title_english: string | null;
  cover_url: string;
  status: "ongoing" | "completed" | "hiatus" | "cancelled";
  genres: { id: string; name: string }[];
  themes: { id: string; name: string }[];
  demographic: string | null;
  author: string;
  year: number | null;
  chapters: number | null;
  score: number | null;
  followed_count: number | null;
  synopsis: string | null;
  anilist_id?: string | null;
}

export function parseMangaItem(item: {
  id: string;
  attributes: {
    title: Record<string, string>;
    altTitles?: Record<string, string>[];
    description?: Record<string, string>;
    status: string;
    year?: number | null;
    lastChapter?: string | null;
    links?: Record<string, string>;
    publicationDemographic?: string | null;
    tags?: { id: string; attributes: { name: Record<string, string>; group: string } }[];
  };
  relationships?: { type: string; attributes?: { fileName?: string; name?: string } }[];
}): WebtoonItem {
  const attrs = item.attributes;

  // 한국어 제목: title.ko → altTitles[].ko → title.en → 첫 번째 값
  const koFromAlt = attrs.altTitles?.find((t) => t.ko)?.ko ?? null;
  const title = attrs.title?.ko || koFromAlt || attrs.title?.en || Object.values(attrs.title ?? {})[0] || "";
  // 영어 제목: title.en → title["ko-ro"](로마자) → altTitles[].en
  const title_english =
    attrs.title?.en ??
    attrs.title?.["ko-ro"] ??
    attrs.altTitles?.find((t) => t.en)?.en ??
    null;

  // 커버 이미지
  const coverRel = item.relationships?.find((r) => r.type === "cover_art");
  const coverFileName = coverRel?.attributes?.fileName;
  const cover_url = coverFileName
    ? `https://uploads.mangadex.org/covers/${item.id}/${coverFileName}.256.jpg`
    : "";

  // 작가
  const authorRel = item.relationships?.find((r) => r.type === "author");
  const author = authorRel?.attributes?.name || "";

  // 장르 (group === "genre" 태그만)
  const genres = (attrs.tags ?? [])
    .filter((t) => t.attributes?.group === "genre")
    .map((t) => ({
      id: t.id,
      name: t.attributes?.name?.ko || TAG_KO[t.attributes?.name?.en ?? ""] || t.attributes?.name?.en || "",
    }));

  // 테마 (group === "theme" 태그)
  const themes = (attrs.tags ?? [])
    .filter((t) => t.attributes?.group === "theme")
    .map((t) => ({
      id: t.id,
      name: t.attributes?.name?.ko || TAG_KO[t.attributes?.name?.en ?? ""] || t.attributes?.name?.en || "",
    }));

  // 독자층
  const demographic = attrs.publicationDemographic ?? null;

  // 시놉시스: 한국어 우선 → 영어, 마크다운 링크/구분선 제거
  const rawSynopsis = attrs.description?.ko || attrs.description?.en || null;
  const synopsis = rawSynopsis
    ? rawSynopsis
        .split(/\n---+/)[0]                          // --- 이후 링크 섹션 제거
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")     // [text](url) → text
        .replace(/<[^>]+>/g, "")                     // <tag> 제거
        .trim() || null
    : null;

  // 최종화 번호
  const chapters = attrs.lastChapter ? parseInt(attrs.lastChapter) || null : null;

  const VALID_STATUS = ["ongoing", "completed", "hiatus", "cancelled"] as const;
  const status = VALID_STATUS.includes(attrs.status as typeof VALID_STATUS[number])
    ? (attrs.status as WebtoonItem["status"])
    : "ongoing";

  // AniList ID (MangaDex links.al)
  const anilist_id = attrs.links?.al ?? null;

  return {
    id: item.id,
    title,
    title_english,
    cover_url,
    status,
    genres,
    themes,
    demographic,
    author,
    year: attrs.year ?? null,
    chapters,
    score: null,
    followed_count: null,
    synopsis,
    anilist_id,
  };
}

export const MANGADEX = "https://api.mangadex.org";
export const NO_GZIP = { headers: { "Accept-Encoding": "identity" } };

async function anilistQuery(aliases: string[]): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `query { ${aliases.join(" ")} }` }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

// AniList ID가 있으면 ID 직접 조회(정확), 없으면 제목 검색
function makeAlias(item: WebtoonItem, idx: number): string {
  if (item.anilist_id) {
    return `m${idx}: Media(id: ${item.anilist_id}, type: MANGA) { coverImage { large } averageScore }`;
  }
  const q = (item.title_english || item.title || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `m${idx}: Media(search: "${q}", type: MANGA, countryOfOrigin: "KR") { coverImage { large } averageScore }`;
}

// countryOfOrigin 없이 재시도 (AniList에 KR 미분류 작품 대응)
function makeAliasFallback(item: WebtoonItem, idx: number): string {
  const q = (item.title_english || item.title || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `m${idx}: Media(search: "${q}", type: MANGA) { coverImage { large } averageScore }`;
}

function applyMedia(base: WebtoonItem, media: { coverImage?: { large?: string }; averageScore?: number } | null): WebtoonItem {
  const img = media?.coverImage?.large;
  if (!img) return base;
  return {
    ...base,
    cover_url: img,
    score: media?.averageScore != null ? Math.round(media.averageScore!) / 10 : base.score,
  };
}

// AniList GraphQL 배치 요청으로 커버 보강
// 1) AniList ID 직접 조회 (정확) 또는 제목 검색
// 2) 배치 실패 시 개별 재시도
// 3) 개별도 실패 시 countryOfOrigin 없이 재시도
export async function enrichCoversWithMAL(items: WebtoonItem[]): Promise<WebtoonItem[]> {
  if (items.length === 0) return items;

  const result = [...items];
  const BATCH_SIZE = 3;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const data = await anilistQuery(batch.map((item, j) => makeAlias(item, j)));

    if (data) {
      batch.forEach((item, j) => {
        result[i + j] = applyMedia(item, data[`m${j}`] as never);
      });
    } else {
      // 배치 실패 → 개별 재시도
      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        let single = await anilistQuery([makeAlias(item, 0)]);

        // AniList ID 없는 경우: countryOfOrigin 제거 후 재시도
        if (!single && !item.anilist_id) {
          single = await anilistQuery([makeAliasFallback(item, 0)]);
        }

        if (single) result[i + j] = applyMedia(item, single["m0"] as never);
      }
    }
  }

  return result;
}

export function mangaListUrl(params: Record<string, string | string[]>): string {
  // URLSearchParams가 [] 를 %5B%5D 로 인코딩하면 MangaDex가 파싱 못 함 → 직접 문자열 조립
  const fixed =
    `originalLanguage[]=ko` +
    `&contentRating[]=safe&contentRating[]=suggestive` +
    `&includes[]=cover_art&includes[]=author`;

  const extra: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((v) => extra.push(`${key}=${encodeURIComponent(v)}`));
    } else {
      extra.push(`${key}=${encodeURIComponent(value)}`);
    }
  }

  return `${MANGADEX}/manga?${fixed}${extra.length ? "&" + extra.join("&") : ""}`;
}
