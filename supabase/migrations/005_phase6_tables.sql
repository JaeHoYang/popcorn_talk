-- Phase 6: feedbacks, notices, admin_settings

-- 피드백: 누구나 INSERT, 인증 사용자만 SELECT/DELETE
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  content    TEXT        NOT NULL,
  email      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_feedbacks"
  ON public.feedbacks FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_feedbacks"
  ON public.feedbacks FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin_delete_feedbacks"
  ON public.feedbacks FOR DELETE USING (auth.role() = 'authenticated');

-- 공지사항: 누구나 SELECT, 인증 사용자만 INSERT/UPDATE/DELETE
CREATE TABLE IF NOT EXISTS public.notices (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_notices"
  ON public.notices FOR SELECT USING (true);

CREATE POLICY "admin_insert_notices"
  ON public.notices FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin_update_notices"
  ON public.notices FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "admin_delete_notices"
  ON public.notices FOR DELETE USING (auth.role() = 'authenticated');

-- 관리자 설정: 인증 사용자만 접근
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_admin_settings"
  ON public.admin_settings USING (auth.role() = 'authenticated');

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_notices_created    ON public.notices    (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_created  ON public.feedbacks  (created_at DESC);
