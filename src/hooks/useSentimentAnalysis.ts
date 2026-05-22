import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getFromCache, setToCache } from "@/lib/sentimentCache";
import { SentimentJob, SentimentResult } from "@/types/sentiment";

type AnalysisState = "idle" | "fake-loading" | "starting" | "polling" | "done" | "error";

const POLL_INTERVAL_MS = 2000;

const SENTIMENT_CONFIG: Record<string, { startFn: string; workerFn: string; idKey: string }> = {
  drama:   { startFn: "analyze-drama-start",  workerFn: "analyze-drama-worker",  idKey: "drama_id"  },
  anime:   { startFn: "analyze-anime-start",  workerFn: "analyze-anime-worker",  idKey: "mal_id"    },
  movie:   { startFn: "analyze-start",        workerFn: "analyze-worker",        idKey: "movie_id"  },
  webtoon: { startFn: "analyze-start",        workerFn: "analyze-worker",        idKey: "movie_id"  },
};
const MAX_POLL_MS = 180_000;
const FAKE_LOAD_MS = 800;

export function useSentimentAnalysis(
  movieId: number | string,
  movieTitle: string,
  uiLanguage: string,
  type: "movie" | "anime" | "webtoon" | "drama" = "movie"
) {
  const [state, setState] = useState<AnalysisState>("idle");
  const [progress, setProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState("");
  const [result, setResult] = useState<SentimentResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 컴포넌트 마운트 시 인메모리 캐시 확인
  useEffect(() => {
    const cached = getFromCache(movieId, uiLanguage);
    if (cached) {
      setState("fake-loading");
      const timer = setTimeout(() => {
        setResult(cached);
        setState("done");
      }, FAKE_LOAD_MS);
      return () => clearTimeout(timer);
    }
  }, [movieId, uiLanguage]);

  // 언어 변경 시 캐시 재확인
  useEffect(() => {
    const cached = getFromCache(movieId, uiLanguage);
    if (cached && state === "done") {
      setResult(cached);
    }
  }, [uiLanguage, movieId, state]);

  const start = useCallback(
    async (forceRefresh = false) => {
      // 진행 중인 폴링 취소
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!forceRefresh) {
        const cached = getFromCache(movieId, uiLanguage);
        if (cached) {
          setState("fake-loading");
          setTimeout(() => {
            if (!controller.signal.aborted) {
              setResult(cached);
              setState("done");
            }
          }, FAKE_LOAD_MS);
          return;
        }
      }

      setState("starting");
      setProgress(0);
      setStageMessage("분석을 시작합니다...");

      try {
        const cfg = SENTIMENT_CONFIG[type] ?? SENTIMENT_CONFIG.movie;
        const startBody = { [cfg.idKey]: movieId, title: movieTitle, ui_language: uiLanguage, force_refresh: forceRefresh };

        const { data, error } = await supabase.functions.invoke(cfg.startFn, { body: startBody });
        if (error || !data?.job_id) throw new Error(error?.message ?? "Failed to start analysis");

        const jobId: string = data.job_id;

        const workerBody = { job_id: jobId, [cfg.idKey]: movieId, title: movieTitle, ui_language: uiLanguage };
        supabase.functions.invoke(cfg.workerFn, { body: workerBody }).catch(() => {});

        setState("polling");

        // 폴링 루프
        let elapsed = 0;
        const intervalId = setInterval(async () => {
          if (controller.signal.aborted) {
            clearInterval(intervalId);
            return;
          }

          elapsed += POLL_INTERVAL_MS;
          if (elapsed >= MAX_POLL_MS) {
            clearInterval(intervalId);
            if (!controller.signal.aborted) setState("error");
            return;
          }

          try {
            const { data: status } = await supabase.functions.invoke<SentimentJob>("analyze-job-status", {
              body: { job_id: jobId },
            });
            if (!status) return;

            setProgress(status.progress ?? 0);
            setStageMessage(status.stage_message ?? "");

            if (status.status === "completed" && status.result) {
              clearInterval(intervalId);
              setToCache(movieId, uiLanguage, status.result);
              setResult(status.result);
              setState("done");
            } else if (status.status === "failed") {
              clearInterval(intervalId);
              setState("error");
            }
          } catch {
            // 폴링 오류는 무시하고 계속 재시도
          }
        }, POLL_INTERVAL_MS);

        controller.signal.addEventListener("abort", () => clearInterval(intervalId));
      } catch {
        if (!controller.signal.aborted) setState("error");
      }
    },
    [movieId, movieTitle, uiLanguage, type]
  );

  // 컴포넌트 언마운트 시 폴링 정리
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return {
    state,
    progress,
    stageMessage,
    result,
    start,
    isLoading: state === "starting" || state === "polling" || state === "fake-loading",
  };
}
