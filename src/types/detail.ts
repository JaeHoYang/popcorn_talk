import { Movie } from "./movie";

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

export interface Trailer {
  key: string;
  name: string;
  type: string;
  site: string;
}

export interface Review {
  id: string;
  author: string;
  content: string;
  created_at: string;
  author_details: { rating: number | null };
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviders {
  flatrate?: WatchProvider[];
  buy?: WatchProvider[];
  rent?: WatchProvider[];
  link?: string;
}

export interface Collection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: Array<{ id: number; title: string; release_date: string; poster_path: string | null }>;
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
}

export interface MovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  genres: Genre[];
  original_language: string;
  production_companies: ProductionCompany[];
  imdb_id: string | null;
  imdb_rating: string | null;
  status: string;
  // 확장 필드 (Edge Function 조합)
  trailers: Trailer[];
  director: CrewMember | null;
  cast: CastMember[];
  reviews: Review[];
  similar: Movie[];
  watch_providers: WatchProviders | null;
  collection: Collection | null;
}

export interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  filmography: Array<{
    id: number;
    title: string;
    release_date: string;
    poster_path: string | null;
    character: string;
    role: string;
    role_en: string;
  }>;
}
