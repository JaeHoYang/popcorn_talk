import { Tv, Sparkles, Database, Bot } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DramaAbout() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Tv className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-slate-100">SeriesTalk</h1>
        </div>
        <p className="text-slate-400 text-lg">
          {t("AI로 드라마를 더 깊게 느껴보세요", "Feel dramas deeper with AI")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-6">
          <Sparkles className="w-6 h-6 text-blue-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("핵심 기능", "Key Features")}</h2>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li>• {t("6개국 드라마 탐색 (한/미/일/영/중/태)", "6-Country Drama (KR/US/JP/GB/CN/TH)")}</li>
            <li>• {t("인기 · 평점 · 최신 순위", "Popularity · Rating · Newest Ranking")}</li>
            <li>• {t("AI 감성 리뷰 분석", "AI Sentiment Review Analysis")}</li>
            <li>• {t("유튜브 트레일러 감상", "YouTube Trailer")}</li>
            <li>• {t("OTT 플랫폼 안내 (넷플릭스 등)", "OTT Platform Info (Netflix, etc.)")}</li>
            <li>• {t("시즌 · 에피소드 정보", "Season & Episode Info")}</li>
            <li>• {t("출연진 · 제작진 정보", "Cast & Crew Info")}</li>
            <li>• {t("유사 드라마 추천", "Similar Drama Recommendations")}</li>
            <li>• {t("위시리스트 저장", "Wishlist")}</li>
          </ul>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <Database className="w-6 h-6 text-green-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("데이터 출처", "Data Sources")}</h2>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li>• <span className="text-slate-300">TMDB</span> — {t("드라마 정보 · OTT · 출연진", "Drama Info · OTT · Cast")}</li>
            <li>• <span className="text-slate-300">YouTube Data API v3</span> — {t("트레일러 · 리뷰 댓글", "Trailers & Review Comments")}</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <Bot className="w-6 h-6 text-blue-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-100 mb-2">{t("AI 분석 엔진", "AI Analysis Engine")}</h2>
        <p className="text-sm text-slate-400 mb-3">
          {t(
            "YouTube 드라마 리뷰 댓글을 수집해 Gemini AI · Groq로 감성 분석 후 긍정/부정/중립 비율과 핵심 키워드를 추출합니다.",
            "Collects YouTube drama review comments and uses Gemini AI · Groq to analyze sentiment and extract positive/negative/neutral ratios and key keywords."
          )}
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-3">{t("기술 스택", "Tech Stack")}</h2>
        <div className="flex flex-wrap gap-2">
          {["React", "TypeScript", "Supabase", "TMDB API", "Gemini AI", "Groq", "TanStack Query", "Tailwind CSS"].map((tech) => (
            <span key={tech} className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
