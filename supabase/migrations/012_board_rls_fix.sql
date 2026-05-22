-- authenticated 역할도 게시판 읽기 허용 (이미 적용된 경우 무시)
DO $$ BEGIN
  CREATE POLICY "auth_read_posts" ON board_posts FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "auth_read_comments" ON board_comments FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
