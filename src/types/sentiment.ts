export interface SentimentResult {
  sentiment_score: number;
  positive_keywords: string[];
  negative_keywords: string[];
  summary: string;
  viewing_point: string;        // 관람 포인트 (2~3문장)
  downside: string;             // 아쉬운 점 (2~3문장)
  youtube_samples: string[];    // YouTube 댓글 샘플 최대 5개
  naver_samples: string[];      // 네이버 후기 샘플 최대 3개
  analyzed_at: string;
  data_sources: {
    youtube_comments: number;
    naver_reviews: number;
  };
}

export interface SentimentJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  stage: string;
  stage_message: string;
  progress: number;
  result: SentimentResult | null;
  error_message: string | null;
}
