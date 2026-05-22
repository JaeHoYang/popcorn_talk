-- Phase 3: sentiment_jobs, sentiment_cache, ai_usage_events

CREATE TABLE IF NOT EXISTS public.sentiment_jobs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id      TEXT        NOT NULL,
  ui_language   TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'pending',  -- pending | processing | completed | failed
  stage         TEXT        NOT NULL DEFAULT 'pending',
  stage_message TEXT        NOT NULL DEFAULT '',
  progress      INT         NOT NULL DEFAULT 0,
  result        JSONB,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sentiment_cache (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id    TEXT        NOT NULL,
  ui_language TEXT        NOT NULL,
  data        JSONB       NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (movie_id, ui_language)
);

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT        NOT NULL,
  model           TEXT        NOT NULL,
  duration_ms     INT         NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL,  -- success | error
  http_status     INT,
  prompt_chars    INT         NOT NULL DEFAULT 0,
  response_chars  INT         NOT NULL DEFAULT 0,
  retry_count     INT         NOT NULL DEFAULT 0,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sentiment_jobs_movie
  ON public.sentiment_jobs (movie_id, ui_language, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_cache_lookup
  ON public.sentiment_cache (movie_id, ui_language, expires_at);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created
  ON public.ai_usage_events (created_at DESC);

-- RLS
ALTER TABLE public.sentiment_jobs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_cache   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events   ENABLE ROW LEVEL SECURITY;

-- sentiment_jobs / sentiment_cache: 공개 읽기
CREATE POLICY "public_read_sentiment_jobs"
  ON public.sentiment_jobs FOR SELECT USING (true);

CREATE POLICY "public_read_sentiment_cache"
  ON public.sentiment_cache FOR SELECT USING (true);

-- ai_usage_events: 클라이언트 접근 완전 차단 (service role 전용)
-- policy 없음 → anon/authenticated 접근 불가
