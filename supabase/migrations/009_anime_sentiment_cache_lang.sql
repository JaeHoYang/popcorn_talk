-- anime_sentiment_cache에 ui_language 컬럼 추가 및 복합 PK로 변경
ALTER TABLE anime_sentiment_cache DROP CONSTRAINT anime_sentiment_cache_pkey;
ALTER TABLE anime_sentiment_cache ADD COLUMN ui_language text NOT NULL DEFAULT 'ko-KR';
ALTER TABLE anime_sentiment_cache ADD PRIMARY KEY (mal_id, ui_language);
