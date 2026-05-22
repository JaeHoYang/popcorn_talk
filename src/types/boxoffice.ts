export interface BoxofficeEntry {
  rank: number;
  rankChange: number;
  isNew: boolean;
  movieCd: string;
  movieNm: string;
  openDt: string;
  audiCnt: number;
  audiAcc: number;
  tmdbId: number | null;
  poster_path: string | null;
}

export interface BoxofficeData {
  type: "daily" | "weekly";
  targetDt: string;
  showRange: string;
  list: BoxofficeEntry[];
}
