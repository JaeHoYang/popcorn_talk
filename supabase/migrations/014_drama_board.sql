-- board_posts category 체크 제약에 drama 추가
ALTER TABLE board_posts DROP CONSTRAINT IF EXISTS board_posts_category_check;
ALTER TABLE board_posts ADD CONSTRAINT board_posts_category_check
  CHECK (category IN ('movie', 'drama', 'anime', 'webtoon'));
