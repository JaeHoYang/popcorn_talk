export interface Drama {
  id: number;
  name: string;
  original_name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  origin_country: string[];
  genre_ids?: number[];
}

export interface DramaDetail {
  id: number;
  name: string;
  original_name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  last_air_date: string | null;
  vote_average: number;
  vote_count: number;
  origin_country: string[];
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  genres: { id: number; name: string }[];
  networks: { id: number; name: string; logo_path: string | null }[];
  seasons: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    air_date: string | null;
    poster_path: string | null;
  }[];
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string; profile_path: string | null }[];
  };
  videos: { key: string; type: string; site: string }[];
  watch_providers?: {
    flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
  };
  similar: Drama[];
  trailer_key: string | null;
}

export type DramaCountry = "ALL" | "KR" | "US" | "JP" | "GB" | "CN" | "TH";

export const DRAMA_COUNTRIES: { code: DramaCountry; ko: string; en: string; flag: string }[] = [
  { code: "ALL", ko: "전체",   en: "All",      flag: "🌐" },
  { code: "KR",  ko: "한국",   en: "Korea",    flag: "🇰🇷" },
  { code: "US",  ko: "미국",   en: "USA",      flag: "🇺🇸" },
  { code: "JP",  ko: "일본",   en: "Japan",    flag: "🇯🇵" },
  { code: "GB",  ko: "영국",   en: "UK",       flag: "🇬🇧" },
  { code: "CN",  ko: "중국",   en: "China",    flag: "🇨🇳" },
  { code: "TH",  ko: "태국",   en: "Thailand", flag: "🇹🇭" },
];

export type DramaRankingFilter = "popularity" | "rating" | "newest" | "airing" | "upcoming" | "ended";

export const TV_GENRES: { id: number; ko: string; en: string }[] = [
  { id: 18,    ko: "드라마",       en: "Drama" },
  { id: 35,    ko: "코미디",       en: "Comedy" },
  { id: 80,    ko: "범죄",         en: "Crime" },
  { id: 9648,  ko: "미스터리",     en: "Mystery" },
  { id: 10759, ko: "액션/어드벤처", en: "Action & Adventure" },
  { id: 10765, ko: "SF/판타지",    en: "Sci-Fi & Fantasy" },
  { id: 10768, ko: "전쟁/정치",    en: "War & Politics" },
  { id: 10751, ko: "가족",         en: "Family" },
  { id: 10749, ko: "로맨스",       en: "Romance" },
  { id: 99,    ko: "다큐멘터리",   en: "Documentary" },
];

export const DRAMA_STATUS_MAP: Record<string, { ko: string; color: string }> = {
  "Returning Series": { ko: "방영중",  color: "text-emerald-400" },
  "Ended":            { ko: "종영",    color: "text-slate-400"   },
  "In Production":    { ko: "제작중",  color: "text-blue-400"    },
  "Planned":          { ko: "예정",    color: "text-yellow-400"  },
  "Canceled":         { ko: "취소됨",  color: "text-red-400"     },
};
