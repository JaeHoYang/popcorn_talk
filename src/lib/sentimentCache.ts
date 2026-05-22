import { SentimentResult } from "@/types/sentiment";

// 세션 단위 인메모리 캐시 (페이지 새로고침 시 초기화)
const cache = new Map<string, SentimentResult>();

export function makeCacheKey(movieId: number | string, uiLanguage: string) {
  return `${movieId}:${uiLanguage}`;
}

export function getFromCache(movieId: number | string, uiLanguage: string): SentimentResult | null {
  return cache.get(makeCacheKey(movieId, uiLanguage)) ?? null;
}

export function setToCache(movieId: number | string, uiLanguage: string, result: SentimentResult) {
  cache.set(makeCacheKey(movieId, uiLanguage), result);
}
