export interface WebtoonItem {
  id: string;
  title: string;
  title_english: string | null;
  cover_url: string;
  status: "ongoing" | "completed" | "hiatus" | "cancelled";
  genres: { id: string; name: string }[];
  themes?: { id: string; name: string }[];
  demographic: string | null;
  author: string;
  year: number | null;
  chapters: number | null;
  score: number | null;
  followed_count: number | null;
  synopsis: string | null;
  anilist_id: string;
}

export const GENRE_KO: Record<string, string> = {
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
  "Supernatural":  "초자연",
  "Thriller":      "스릴러",
  "Mecha":         "메카",
  "Music":         "음악",
};

const STATUS_MAP: Record<string, WebtoonItem["status"]> = {
  RELEASING:        "ongoing",
  FINISHED:         "completed",
  HIATUS:           "hiatus",
  CANCELLED:        "cancelled",
  NOT_YET_RELEASED: "ongoing",
};

export const ANILIST_STATUS: Record<string, string> = {
  ongoing:   "RELEASING",
  completed: "FINISHED",
  hiatus:    "HIATUS",
};

function stripHtml(text: string | null | undefined): string | null {
  if (!text) return null;
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/~!.*?!~/gs, "")  // AniList 스포일러 태그 제거
    .trim() || null;
}

function getAuthor(edges: { role: string; node: { name: { native?: string; full?: string } } }[]): string {
  const ROLES = ["Story & Art", "Story", "Original Story", "Original Creator"];
  for (const role of ROLES) {
    const edge = edges.find((e) => e.role === role);
    if (edge) return edge.node.name.native || edge.node.name.full || "";
  }
  return edges[0]?.node?.name?.native || edges[0]?.node?.name?.full || "";
}

export function parseAnilistMedia(media: {
  id: number;
  title?: { native?: string; english?: string | null; romaji?: string };
  coverImage?: { large?: string; extraLarge?: string };
  averageScore?: number | null;
  popularity?: number;
  status?: string;
  genres?: string[];
  tags?: { name: string; category: string; isMediaSpoiler?: boolean }[];
  description?: string | null;
  startDate?: { year?: number | null };
  chapters?: number | null;
  staff?: { edges: { role: string; node: { id?: number; name: { native?: string; full?: string } } }[] };
}): WebtoonItem {
  const title = media.title?.native || media.title?.romaji || media.title?.english || "";
  const title_english = media.title?.english || media.title?.romaji || null;

  const genres = (media.genres ?? [])
    .filter((g) => g !== "Hentai" && g !== "Ecchi")
    .map((g) => ({ id: g, name: GENRE_KO[g] || g }));

  const themes = (media.tags ?? [])
    .filter((t) => !t.isMediaSpoiler && t.category !== "Sexual Content")
    .slice(0, 8)
    .map((t) => ({ id: t.name, name: t.name }));

  const demographicTag = (media.tags ?? []).find((t) => t.category === "Demographic");
  const demographic = demographicTag?.name?.toLowerCase() ?? null;

  return {
    id: String(media.id),
    title,
    title_english,
    cover_url: media.coverImage?.large || media.coverImage?.extraLarge || "",
    status: STATUS_MAP[media.status ?? ""] ?? "ongoing",
    genres,
    themes,
    demographic,
    author: getAuthor(media.staff?.edges ?? []),
    year: media.startDate?.year ?? null,
    chapters: media.chapters ?? null,
    score: media.averageScore ? Math.round(media.averageScore) / 10 : null,
    followed_count: media.popularity ?? null,
    synopsis: stripHtml(media.description),
    anilist_id: String(media.id),
  };
}

export async function anilistRequest<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T | null> {
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) return null;
    return json.data as T;
  } catch {
    return null;
  }
}

// 랭킹용 GraphQL 쿼리
export const RANKING_QUERY = `
query($page: Int!, $sort: [MediaSort]!, $status: MediaStatus, $genre_in: [String]) {
  Page(page: $page, perPage: 25) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(
      countryOfOrigin: KR
      type: MANGA
      sort: $sort
      status: $status
      genre_in: $genre_in
      isAdult: false
    ) {
      id
      title { native english romaji }
      coverImage { large }
      averageScore
      popularity
      status
      genres
      description(asHtml: false)
      startDate { year }
      chapters
      staff(sort: ROLE, perPage: 5) {
        edges { role node { name { native full } } }
      }
    }
  }
}`;

// 검색용 GraphQL 쿼리
export const SEARCH_QUERY = `
query($search: String, $genre_in: [String], $status: MediaStatus, $page: Int!) {
  Page(page: $page, perPage: 24) {
    pageInfo { total lastPage hasNextPage }
    media(
      search: $search
      genre_in: $genre_in
      status: $status
      countryOfOrigin: KR
      type: MANGA
      isAdult: false
      sort: [SEARCH_MATCH, POPULARITY_DESC]
    ) {
      id
      title { native english romaji }
      coverImage { large }
      averageScore
      popularity
      status
      genres
      description(asHtml: false)
      startDate { year }
      chapters
      staff(sort: ROLE, perPage: 3) {
        edges { role node { name { native full } } }
      }
    }
  }
}`;

// 상세용 GraphQL 쿼리
export const DETAIL_QUERY = `
query($id: Int!) {
  Media(id: $id, type: MANGA) {
    id
    title { native english romaji }
    coverImage { large extraLarge }
    averageScore
    popularity
    status
    genres
    tags(sort: RANK) { name category isMediaSpoiler }
    description(asHtml: false)
    startDate { year }
    chapters
    staff(sort: ROLE, perPage: 10) {
      edges { role node { id name { native full } } }
    }
    externalLinks { url site }
    relations {
      edges {
        relationType
        node {
          id type
          title { native romaji }
          coverImage { large }
          status
          startDate { year }
          siteUrl
        }
      }
    }
    recommendations(sort: RATING_DESC, perPage: 9) {
      nodes {
        rating
        mediaRecommendation {
          id
          title { native romaji }
          coverImage { large }
          averageScore
          popularity
          status
          genres
          startDate { year }
          chapters
          staff(sort: ROLE, perPage: 3) {
            edges { role node { name { native full } } }
          }
        }
      }
    }
  }
}`;

// 작가 다른 작품용 GraphQL 쿼리
export const STAFF_WORKS_QUERY = `
query($staffId: Int!, $excludeId: Int!) {
  Staff(id: $staffId) {
    staffMedia(perPage: 7, type: MANGA, sort: POPULARITY_DESC) {
      nodes {
        id
        title { native romaji }
        coverImage { large }
        averageScore
        popularity
        status
        genres
        startDate { year }
        chapters
        staff(sort: ROLE, perPage: 3) {
          edges { role node { name { native full } } }
        }
      }
    }
  }
}`;
