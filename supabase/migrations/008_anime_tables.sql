-- 애니 상세 캐시
CREATE TABLE anime_cache (
  mal_id      int         PRIMARY KEY,
  data        jsonb       NOT NULL,
  expires_at  timestamptz NOT NULL
);

-- 인기 애니 캐시 (단일 행 upsert)
CREATE TABLE popular_anime_cache (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  data        jsonb       NOT NULL,
  expires_at  timestamptz NOT NULL
);

-- AI 리뷰 분석 캐시
CREATE TABLE anime_sentiment_cache (
  mal_id      int         PRIMARY KEY,
  data        jsonb       NOT NULL,
  expires_at  timestamptz NOT NULL
);

-- 조회 로그
CREATE TABLE anime_views (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mal_id      int         NOT NULL,
  title       text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_anime_views_created_at ON anime_views (created_at DESC);
CREATE INDEX idx_anime_views_mal_id     ON anime_views (mal_id);

ALTER TABLE anime_cache           ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_anime_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_sentiment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE anime_views           ENABLE ROW LEVEL SECURITY;
