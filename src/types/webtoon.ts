export interface Webtoon {
  id: string;           // MangaDex UUID
  title: string;        // 한국어 제목 우선
  title_english: string | null;
  cover_url: string;
  status: "ongoing" | "completed" | "hiatus" | "cancelled";
  genres: { id: string; name: string }[];
  themes?: { id: string; name: string }[];
  demographic?: string | null;
  author: string;
  year: number | null;
  chapters: number | null;
  score: number | null;         // MAL 평점
  followed_count: number | null;
  synopsis: string | null;
}

export interface AnimeAdaptation {
  title: string;
  title_en: string | null;
  cover_url: string | null;
  episodes: number | null;
  year: number | null;
  status: string | null;
  anilist_url: string | null;
}

export interface WebtoonDetail extends Webtoon {
  platforms: { name: string; url: string }[];
  similar: Webtoon[];
  mal_id?: number;
  anime_adaptation?: AnimeAdaptation | null;
  adapted_from?: { id: string; title: string }[];
  author_other_works?: Webtoon[];
}

export interface WebtoonPlatformEntry {
  id: string;
  platform: string;
  mangadex_id: string;
  platform_url: string | null;
  sort_order: number;
}

// AniList 장르 기반 태그 (id = AniList 영어 장르명)
export const WEBTOON_TAGS = [
  { id: "Romance",      name: "로맨스",   nameEn: "Romance",      emoji: "💕" },
  { id: "Action",       name: "액션",     nameEn: "Action",       emoji: "⚔️" },
  { id: "Fantasy",      name: "판타지",   nameEn: "Fantasy",      emoji: "🧙" },
  { id: "Slice of Life",name: "일상",     nameEn: "Slice of Life",emoji: "☕" },
  { id: "Drama",        name: "드라마",   nameEn: "Drama",        emoji: "🎭" },
  { id: "Comedy",       name: "코미디",   nameEn: "Comedy",       emoji: "😄" },
  { id: "Thriller",     name: "스릴러",   nameEn: "Thriller",     emoji: "😱" },
  { id: "Supernatural", name: "초자연",   nameEn: "Supernatural", emoji: "👻" },
  { id: "Mystery",      name: "미스터리", nameEn: "Mystery",      emoji: "🔍" },
  { id: "Sports",       name: "스포츠",   nameEn: "Sports",       emoji: "⚽" },
] as const;

export const WEBTOON_MOOD_MAP = [
  { emoji: "💕", label: "로맨스",        labelEn: "Romance",       genres: ["Romance"] },
  { emoji: "⚔️", label: "액션",          labelEn: "Action",        genres: ["Action"] },
  { emoji: "🧙", label: "판타지",        labelEn: "Fantasy",       genres: ["Fantasy"] },
  { emoji: "☕", label: "일상/힐링",     labelEn: "Slice of Life", genres: ["Slice of Life"] },
  { emoji: "😄", label: "웃고 싶을 때", labelEn: "Comedy",        genres: ["Comedy"] },
  { emoji: "👻", label: "초자연/공포",   labelEn: "Supernatural",  genres: ["Supernatural", "Horror"] },
];

export const PLATFORMS = [
  { key: "naver", name: "네이버 웹툰", color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30",  icon: "N" },
  { key: "kakao", name: "카카오 웹툰", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", icon: "K" },
] as const;

export type PlatformKey = typeof PLATFORMS[number]["key"];
