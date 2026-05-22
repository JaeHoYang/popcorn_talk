import { Tv, Sparkles, Database, Bot } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AnimeAbout() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Tv className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-slate-100">Anime Talk</h1>
        </div>
        <p className="text-slate-400 text-lg">
          {t("AI로 애니메이션 탐색을 더 쉽게", "Discover anime smarter with AI")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-6">
          <Sparkles className="w-6 h-6 text-purple-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("핵심 기능", "Key Features")}</h2>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li>• {t("인기 · 방영중 · 즐겨찾기 순위", "Popular · Airing · Favorites Ranking")}</li>
            <li>• {t("AI 감성 리뷰 분석", "AI Sentiment Review Analysis")}</li>
            <li>• {t("트레일러 · 소개 영상 감상", "Trailer & Introduction Videos")}</li>
            <li>• {t("OTT 플랫폼 안내 (넷플릭스 등)", "OTT Platform Info (Netflix, etc.)")}</li>
            <li>• {t("주요 성우 · 캐릭터 정보", "Voice Actors & Character Info")}</li>
            <li>• {t("방영 시즌 · 회차 · 요일 정보", "Season, Episode & Broadcast Day Info")}</li>
            <li>• {t("위시리스트 저장", "Wishlist")}</li>
          </ul>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <Database className="w-6 h-6 text-green-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("데이터 출처", "Data Sources")}</h2>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li>• <span className="text-slate-300">Jikan API</span> — MyAnimeList {t("애니 정보", "Anime Info")}</li>
            <li>• <span className="text-slate-300">TMDB</span> — {t("한국어 제목 · OTT · 영상", "Korean Title · OTT · Videos")}</li>
            <li>• <span className="text-slate-300">YouTube Data API v3</span> — {t("트레일러 · 소개 영상", "Trailers & Videos")}</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <Bot className="w-6 h-6 text-purple-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-100 mb-2">{t("AI 분석 엔진", "AI Analysis Engine")}</h2>
        <p className="text-sm text-slate-400 mb-3">
          {t(
            "YouTube 댓글을 수집해 Gemini AI · Groq로 감성 분석 후 긍정/부정/중립 비율과 핵심 키워드를 추출합니다.",
            "Collects YouTube comments and uses Gemini AI · Groq to analyze sentiment and extract positive/negative/neutral ratios and key keywords."
          )}
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-3">{t("기술 스택", "Tech Stack")}</h2>
        <div className="flex flex-wrap gap-2">
          {["React", "TypeScript", "Supabase", "Gemini AI", "Groq", "TanStack Query", "Tailwind CSS"].map((tech) => (
            <span key={tech} className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
