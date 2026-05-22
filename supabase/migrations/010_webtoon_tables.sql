-- 웹툰 상세 캐시
CREATE TABLE webtoon_cache (
  id          text        PRIMARY KEY,  -- MangaDex UUID
  data        jsonb       NOT NULL,
  expires_at  timestamptz NOT NULL
);

-- 인기 웹툰 캐시 (페이지별 단일 행 upsert)
CREATE TABLE popular_webtoon_cache (
  id          uuid        PRIMARY KEY,
  data        jsonb       NOT NULL,
  expires_at  timestamptz NOT NULL
);

-- AI 리뷰 분석 캐시
CREATE TABLE webtoon_sentiment_cache (
  id           text        NOT NULL,
  ui_language  text        NOT NULL DEFAULT 'ko-KR',
  data         jsonb       NOT NULL,
  expires_at   timestamptz NOT NULL,
  PRIMARY KEY (id, ui_language)
);

-- 플랫폼별 웹툰 큐레이션
CREATE TABLE webtoon_platforms (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  platform     varchar(20) NOT NULL,   -- 'naver' | 'kakao' | 'lezhin' | 'bomtoon' | 'toptoon'
  mangadex_id  text        NOT NULL,
  platform_url text,
  sort_order   int         DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- 조회 로그
CREATE TABLE webtoon_views (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  webtoon_id  text        NOT NULL,
  title       text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_webtoon_views_created_at ON webtoon_views (created_at DESC);
CREATE INDEX idx_webtoon_views_webtoon_id ON webtoon_views (webtoon_id);
CREATE INDEX idx_webtoon_platforms_platform ON webtoon_platforms (platform);

ALTER TABLE webtoon_cache           ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_webtoon_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE webtoon_sentiment_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE webtoon_platforms       ENABLE ROW LEVEL SECURITY;
ALTER TABLE webtoon_views           ENABLE ROW LEVEL SECURITY;
