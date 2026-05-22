-- Phase 2: person_cache

CREATE TABLE IF NOT EXISTS public.person_cache (
  person_id   TEXT        PRIMARY KEY,
  data        JSONB       NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_person_cache_expires
  ON public.person_cache (expires_at);

ALTER TABLE public.person_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_person_cache"
  ON public.person_cache FOR SELECT USING (true);
