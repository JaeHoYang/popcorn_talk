import { useEffect, useState } from "react";

/**
 * 캐시 히트 시 즉시 데이터가 오더라도 2초간 로딩 상태를 유지해 UX 개선.
 * isFetching이 false로 바뀌는 시점부터 delayMs 후 완료 처리.
 */
export function useFakeLoading(isFetching: boolean, delayMs = 2000) {
  const [fakeLoading, setFakeLoading] = useState(true);

  useEffect(() => {
    if (isFetching) {
      setFakeLoading(true);
      return;
    }
    const timer = setTimeout(() => setFakeLoading(false), delayMs);
    return () => clearTimeout(timer);
  }, [isFetching, delayMs]);

  return fakeLoading;
}
