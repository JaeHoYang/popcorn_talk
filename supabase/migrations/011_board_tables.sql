-- board_posts
CREATE TABLE IF NOT EXISTS board_posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT        NOT NULL CHECK (category IN ('movie','anime','webtoon')),
  is_notice     BOOLEAN     NOT NULL DEFAULT FALSE,
  title         TEXT        NOT NULL,
  content       TEXT        NOT NULL,
  author        TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  view_count    INTEGER     NOT NULL DEFAULT 0,
  comment_count INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- board_comments
CREATE TABLE IF NOT EXISTS board_comments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID        NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  content       TEXT        NOT NULL,
  author        TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: anon read only
ALTER TABLE board_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_posts"    ON board_posts    FOR SELECT TO anon USING (true);
CREATE POLICY "public_read_comments" ON board_comments FOR SELECT TO anon USING (true);

-- index for fast category queries
CREATE INDEX IF NOT EXISTS idx_board_posts_category_created
  ON board_posts (category, is_notice DESC, created_at DESC);
