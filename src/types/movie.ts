export interface Movie {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
}

export interface Genre {
  id: number;
  name: string;
}

export const GENRES: Genre[] = [
  { id: 28, name: "액션" },
  { id: 12, name: "어드벤처" },
  { id: 16, name: "애니메이션" },
  { id: 35, name: "코미디" },
  { id: 80, name: "범죄" },
  { id: 99, name: "다큐멘터리" },
  { id: 18, name: "드라마" },
  { id: 10751, name: "가족" },
  { id: 14, name: "판타지" },
  { id: 36, name: "역사" },
  { id: 27, name: "공포" },
  { id: 10402, name: "음악" },
  { id: 9648, name: "미스터리" },
  { id: 10749, name: "로맨스" },
  { id: 878, name: "SF" },
  { id: 53, name: "스릴러" },
  { id: 10752, name: "전쟁" },
  { id: 37, name: "서부" },
];

export const MOOD_MAP = [
  { emoji: "😂", label: "웃고 싶을 때",      labelEn: "Feel Like Laughing",  genres: [35] },
  { emoji: "😢", label: "울고 싶을 때",      labelEn: "Feel Like Crying",    genres: [18] },
  { emoji: "😱", label: "스릴 넘치게",       labelEn: "Thrilling",           genres: [27, 53] },
  { emoji: "🤩", label: "신나게",            labelEn: "Exciting",            genres: [28, 12] },
  { emoji: "😌", label: "힐링하고 싶을 때",  labelEn: "Healing",             genres: [16, 10751] },
  { emoji: "🤔", label: "생각하게 만드는",   labelEn: "Thought-Provoking",   genres: [878, 9648] },
] as const;
