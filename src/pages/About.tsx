import { Film, Sparkles, Database, Bot } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Film className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-slate-100">Popcorn Talk — {t("영화", "Movies")}</h1>
        </div>
        <p className="text-slate-400 text-lg">
          {t("AI로 영화 선택을 더 쉽게", "Making movie selection easier with AI")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-6">
          <Sparkles className="w-6 h-6 text-blue-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("핵심 기능", "Key Features")}</h2>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li>• {t("실시간 박스오피스 순위", "Real-time Box Office")}</li>
            <li>• {t("AI 감성 리뷰 분석", "AI Sentiment Review Analysis")}</li>
            <li>• {t("트레일러 · 예고편 감상", "Trailer Viewing")}</li>
            <li>• {t("OTT 플랫폼 안내 (넷플릭스 등)", "OTT Platform Info (Netflix, etc.)")}</li>
            <li>• {t("배우 · 감독 상세 정보", "Actor & Director Details")}</li>
            <li>• {t("위시리스트 저장", "Wishlist")}</li>
          </ul>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <Database className="w-6 h-6 text-green-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("데이터 출처", "Data Sources")}</h2>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li>• <span className="text-slate-300">TMDB</span> — {t("영화 · 인물 정보", "Movie & Person Info")}</li>
            <li>• <span className="text-slate-300">OMDB</span> — IMDb {t("평점", "Ratings")}</li>
            <li>• <span className="text-slate-300">KOBIS</span> — {t("국내 박스오피스", "Korean Box Office")}</li>
            <li>• <span className="text-slate-300">네이버 영화 API</span> — {t("한국어 리뷰", "Korean Reviews")}</li>
            <li>• <span className="text-slate-300">YouTube Data API v3</span> — {t("트레일러", "Trailers")}</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <Bot className="w-6 h-6 text-purple-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-100 mb-2">{t("AI 분석 엔진", "AI Analysis Engine")}</h2>
        <p className="text-sm text-slate-400 mb-3">
          {t(
            "YouTube 댓글과 네이버 리뷰를 수집해 Gemini AI · Groq · Cerebras로 감성 분석 후 긍정/부정/중립 비율과 핵심 키워드를 추출합니다.",
            "Collects YouTube comments and Naver reviews, then uses Gemini AI · Groq · Cerebras to analyze sentiment and extract positive/negative/neutral ratios and key keywords."
          )}
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-3">{t("기술 스택", "Tech Stack")}</h2>
        <div className="flex flex-wrap gap-2">
          {["React", "TypeScript", "Supabase", "Gemini AI", "Groq", "Cerebras", "TanStack Query", "Tailwind CSS"].map((tech) => (
            <span key={tech} className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
