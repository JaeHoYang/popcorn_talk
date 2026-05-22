import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw, Youtube, BookOpen, ThumbsUp, ThumbsDown } from "lucide-react";
import { SentimentResult } from "@/types/sentiment";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  result: SentimentResult;
  onReanalyze: () => void;
}

const SCORE_LEVELS = [
  { min: 80, color: "text-green-400",  ko: "매우 긍정적", en: "Very Positive" },
  { min: 60, color: "text-blue-400",   ko: "긍정적",      en: "Positive" },
  { min: 40, color: "text-yellow-400", ko: "혼합",        en: "Mixed" },
  { min: 20, color: "text-orange-400", ko: "부정적",      en: "Negative" },
  { min: 0,  color: "text-red-400",    ko: "매우 부정적", en: "Very Negative" },
] as const;

function ScoreLabel({ score }: { score: number }) {
  const { t } = useLanguage();
  const level = SCORE_LEVELS.find((l) => score >= l.min) ?? SCORE_LEVELS[SCORE_LEVELS.length - 1];
  return <span className={level.color}>{t(level.ko, level.en)}</span>;
}

const CHART_COLORS = ["#22c55e", "#ef4444"];

export default function SentimentResultView({ result, onReanalyze }: Props) {
  const { t } = useLanguage();

  const chartData = useMemo(() => [
    { name: t("긍정", "Positive"), value: result.sentiment_score },
    { name: t("부정", "Negative"), value: 100 - result.sentiment_score },
  ], [result.sentiment_score, t]);

  return (
    <div className="space-y-6">
      {/* 종합 점수 */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`]}
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#94a3b8" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-100">{result.sentiment_score}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">{t("관객 반응", "Audience Sentiment")}</p>
            <p className="text-lg font-bold"><ScoreLabel score={result.sentiment_score} /></p>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
          <p className="text-xs text-slate-500">
            {t("YouTube 댓글", "YouTube comments")} {result.data_sources.youtube_comments}
            {result.data_sources.naver_reviews > 0 &&
              ` + ${t("네이버 후기", "Naver reviews")} ${result.data_sources.naver_reviews}`}
            {t("개 분석", " analyzed")}
          </p>
        </div>
      </div>

      {/* 관람 포인트 / 아쉬운 점 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {result.viewing_point && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
              <p className="text-xs font-semibold text-green-400">{t("관람 포인트", "Why Watch")}</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{result.viewing_point}</p>
          </div>
        )}
        {result.downside && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
              <p className="text-xs font-semibold text-red-400">{t("아쉬운 점", "Downsides")}</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{result.downside}</p>
          </div>
        )}
      </div>

      {/* 키워드 */}
      <div className="space-y-3">
        {result.positive_keywords.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">{t("긍정 키워드", "Positive Keywords")}</p>
            <div className="flex flex-wrap gap-2">
              {result.positive_keywords.map((kw) => (
                <span key={kw} className="px-3 py-1 text-xs bg-green-500/15 border border-green-500/30 text-green-400 rounded-full">
                  👍 {kw}
                </span>
              ))}
            </div>
          </div>
        )}
        {result.negative_keywords.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">{t("부정 키워드", "Negative Keywords")}</p>
            <div className="flex flex-wrap gap-2">
              {result.negative_keywords.map((kw) => (
                <span key={kw} className="px-3 py-1 text-xs bg-red-500/15 border border-red-500/30 text-red-400 rounded-full">
                  👎 {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* YouTube 댓글 샘플 */}
      {result.youtube_samples && result.youtube_samples.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Youtube className="w-3.5 h-3.5 text-red-400" />
            <p className="text-xs font-semibold text-slate-400">{t("YouTube 반응", "YouTube Reactions")}</p>
          </div>
          <div className="space-y-2">
            {result.youtube_samples.map((comment, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-300 leading-relaxed">{comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 네이버 후기 샘플 */}
      {result.naver_samples && result.naver_samples.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-green-400" />
            <p className="text-xs font-semibold text-slate-400">{t("네이버 관람 후기", "Naver Reviews")}</p>
          </div>
          <div className="space-y-2">
            {result.naver_samples.map((review, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                <p className="text-xs text-slate-300 leading-relaxed">{review}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 재분석 버튼 */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-slate-500">
          {t("분석일", "Analyzed")}:{" "}
          {new Date(result.analyzed_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </p>
        <button
          onClick={onReanalyze}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          {t("재분석", "Re-analyze")}
        </button>
      </div>
    </div>
  );
}
