-- drama_sentiment_cache: id는 "{drama_id}:{language}" 형식의 복합키 역할
-- 이미 PRIMARY KEY이므로 별도 unique 제약 불필요
-- drama_views에 poster_path 컬럼 추가 (관리자 통계 포스터 표시용)
ALTER TABLE drama_views ADD COLUMN IF NOT EXISTS poster_path TEXT;
