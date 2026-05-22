import { WatchProviders } from "./detail";

export interface Anime {
  mal_id: number;
  title: string;
  title_japanese: string | null;
  title_english: string | null;
  images: {
    jpg: { image_url: string; large_image_url: string };
    webp: { image_url: string; large_image_url: string };
  };
  episodes: number | null;
  status: "Finished Airing" | "Currently Airing" | "Not yet aired";
  score: number | null;
  rank: number | null;
  synopsis: string | null;
  genres: { mal_id: number; name: string }[];
  aired: { from: string | null };
  year: number | null;
  season: string | null;
}

export interface AnimeCharacter {
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  role: "Main" | "Supporting";
  voice_actors: {
    person: { name: string; images: { jpg: { image_url: string } } };
    language: string;
  }[];
}

export interface AnimeRecommendation {
  entry: {
    mal_id: number;
    title: string;
    images: { jpg: { large_image_url: string } };
  };
}

export interface AnimeDetail extends Anime {
  trailer: { youtube_id: string | null; embed_url: string | null } | null;
  studios: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
  streaming: { name: string; url: string }[];
  broadcast: { day: string | null; time: string | null; timezone: string | null; string: string | null } | null;
  characters: AnimeCharacter[];
  recommendations: AnimeRecommendation[];
  watch_providers: WatchProviders | null;
  aired_episodes: number | null;
}

export const ANIME_GENRES = [
  { id: 1,  name: "액션" },
  { id: 2,  name: "어드벤처" },
  { id: 4,  name: "코미디" },
  { id: 8,  name: "드라마" },
  { id: 10, name: "판타지" },
  { id: 7,  name: "미스터리" },
  { id: 14, name: "공포" },
  { id: 22, name: "로맨스" },
  { id: 24, name: "SF" },
  { id: 30, name: "스포츠" },
  { id: 36, name: "일상" },
  { id: 37, name: "초자연" },
  { id: 40, name: "심리" },
  { id: 62, name: "이세계" },
] as const;

export const MOOD_MAP_ANIME = [
  { emoji: "⚔️", label: "액션/이세계",   labelEn: "Action / Isekai",  genres: [1, 62] },
  { emoji: "💕", label: "로맨스",         labelEn: "Romance",          genres: [22] },
  { emoji: "😂", label: "웃고 싶을 때",  labelEn: "Comedy",           genres: [4] },
  { emoji: "😌", label: "일상/힐링",      labelEn: "Slice of Life",    genres: [36] },
  { emoji: "🔮", label: "판타지/초자연",  labelEn: "Fantasy",          genres: [10, 37] },
  { emoji: "🏆", label: "스포츠",         labelEn: "Sports",           genres: [30] },
] as const;
