-- drama_views
CREATE TABLE IF NOT EXISTS drama_views (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  drama_id   TEXT        NOT NULL,
  title      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- drama_sentiment_cache
CREATE TABLE IF NOT EXISTS drama_sentiment_cache (
  id         TEXT        PRIMARY KEY,
  drama_id   TEXT        NOT NULL,
  language   TEXT        NOT NULL,
  data       JSONB       NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- RLS
ALTER TABLE drama_views           ENABLE ROW LEVEL SECURITY;
ALTER TABLE drama_sentiment_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_drama_views"     ON drama_views           FOR SELECT TO anon         USING (true);
CREATE POLICY "auth_read_drama_views"     ON drama_views           FOR SELECT TO authenticated USING (true);
CREATE POLICY "anon_read_drama_sentiment" ON drama_sentiment_cache FOR SELECT TO anon         USING (true);
CREATE POLICY "auth_read_drama_sentiment" ON drama_sentiment_cache FOR SELECT TO authenticated USING (true);

-- index
CREATE INDEX IF NOT EXISTS idx_drama_views_drama_id ON drama_views (drama_id, created_at DESC);
