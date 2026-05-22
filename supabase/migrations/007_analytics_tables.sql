-- 방문 로그
CREATE TABLE page_views (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  path       text        NOT NULL,
  ip         text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- 영화 조회 로그
CREATE TABLE movie_views (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id    text        NOT NULL,
  movie_title text        NOT NULL,
  poster_path text,
  created_at  timestamptz DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_page_views_created_at  ON page_views  (created_at DESC);
CREATE INDEX idx_movie_views_movie_id   ON movie_views (movie_id);
CREATE INDEX idx_movie_views_created_at ON movie_views (created_at DESC);

-- RLS (Edge Function이 service_role로 삽입하므로 anon 접근 차단)
ALTER TABLE page_views  ENABLE ROW LEVEL SECURITY;
ALTER TABLE movie_views ENABLE ROW LEVEL SECURITY;
