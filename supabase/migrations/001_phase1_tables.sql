-- Phase 1: movie_cache, popular_movies_cache

CREATE TABLE IF NOT EXISTS public.movie_cache (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id     TEXT        NOT NULL,
  ui_language  TEXT        NOT NULL,
  data         JSONB       NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (movie_id, ui_language)
);

CREATE TABLE IF NOT EXISTS public.popular_movies_cache (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  data        JSONB       NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 조회 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_movie_cache_lookup
  ON public.movie_cache (movie_id, ui_language, expires_at);

CREATE INDEX IF NOT EXISTS idx_popular_movies_expires
  ON public.popular_movies_cache (expires_at);

-- RLS 활성화
ALTER TABLE public.movie_cache          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popular_movies_cache ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 허용 (anon key)
CREATE POLICY "public_read_movie_cache"
  ON public.movie_cache FOR SELECT USING (true);

CREATE POLICY "public_read_popular_movies_cache"
  ON public.popular_movies_cache FOR SELECT USING (true);

-- 쓰기는 Edge Function(service role)만 허용 — 별도 policy 불필요
