import { useEffect } from "react";
import { Bot, PlayCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSentimentAnalysis } from "@/hooks/useSentimentAnalysis";
import SentimentProgress from "./SentimentProgress";
import SentimentResultView from "./SentimentResult";
import EmptyState from "@/components/common/EmptyState";

interface Props {
  movieId: number | string;
  movieTitle: string;
  type?: "movie" | "anime" | "webtoon" | "drama";
}

export default function SentimentAnalysis({ movieId, movieTitle, type = "movie" }: Props) {
  const { uiLanguage, t } = useLanguage();
  const { state, progress, stageMessage, result, start } = useSentimentAnalysis(
    movieId,
    movieTitle,
    uiLanguage,
    type
  );

  // 마운트 시 자동으로 분석 시작 (idle 상태인 경우에만)
  // key={movieId}로 영화 변경 시 remount되므로 [] 의도적 사용
  useEffect(() => {
    if (state === "idle") start(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-bold text-slate-100">{t("AI 리뷰 분석", "AI Review Analysis")}</h2>
      </div>

      {/* 시작 대기 */}
      {state === "idle" && (
        <div className="text-center py-8">
          <button
            onClick={() => start(false)}
            className="flex items-center gap-2 mx-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            {t("AI 리뷰 분석 시작", "Start AI Review Analysis")}
          </button>
        </div>
      )}

      {/* 로딩 / 폴링 */}
      {(state === "starting" || state === "polling" || state === "fake-loading") && (
        <SentimentProgress progress={progress} stageMessage={stageMessage} />
      )}

      {/* 완료 */}
      {state === "done" && result && (
        <SentimentResultView result={result} onReanalyze={() => start(true)} />
      )}

      {/* 오류 */}
      {state === "error" && (
        <div className="space-y-3">
          <EmptyState
            type="error"
            title={t("분석 결과를 불러올 수 없습니다.", "Analysis failed.")}
            description={stageMessage || t("재시도해 주세요.", "Please try again.")}
          />
          <div className="flex justify-center">
            <button
              onClick={() => start(false)}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              {t("다시 시도", "Retry")}
            </button>
          </div>
        </div>
      )}

      {/* 면책 문구 */}
      <p className="text-xs text-slate-500 text-center">
        {t(
          "AI는 실수할 수 있습니다. 분석 결과는 참고용입니다.",
          "AI can make mistakes. Analysis results are for reference only."
        )}
      </p>
    </div>
  );
}
