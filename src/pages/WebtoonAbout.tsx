import { BookOpen, Sparkles, Database, Bot } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WebtoonAbout() {
  const { t } = useLanguage();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="w-8 h-8 text-green-400" />
          <h1 className="text-3xl font-bold text-slate-100">Toon Talk</h1>
        </div>
        <p className="text-slate-400 text-lg">
          {t("AI로 한국 웹툰을 더 깊게 느껴보세요", "Discover Korean webtoons deeper with AI")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-6">
          <Sparkles className="w-6 h-6 text-green-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("핵심 기능", "Key Features")}</h2>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li>• {t("인기순·평점순·연재중·완결·신작 순위", "Popular · Rated · Ongoing · Completed · New")}</li>
            <li>• {t("장르별 탐색 (로맨스, 액션, 판타지 등)", "Browse by Genre (Romance, Action, Fantasy...)")}</li>
            <li>• {t("플랫폼별 큐레이션 (네이버, 카카오 등)", "Platform Curation (Naver, Kakao...)")}</li>
            <li>• {t("AI 감성 리뷰 분석", "AI Sentiment Review Analysis")}</li>
            <li>• {t("플랫폼 직접 연결 링크", "Direct Platform Reading Links")}</li>
            <li>• {t("유사 웹툰 추천", "Similar Webtoon Recommendations")}</li>
            <li>• {t("위시리스트 저장", "Wishlist")}</li>
          </ul>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <Database className="w-6 h-6 text-blue-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("데이터 출처", "Data Sources")}</h2>
          <ul className="text-sm text-slate-400 space-y-1.5">
            <li>• <span className="text-slate-300">MangaDex API</span> — {t("웹툰 정보·커버·장르", "Webtoon Info, Cover, Genre")}</li>
            <li>• <span className="text-slate-300">Jikan API (MAL)</span> — {t("평점·순위 보강", "Rating & Ranking")}</li>
            <li>• <span className="text-slate-300">네이버 검색 API</span> — {t("블로그·카페 리뷰 수집", "Blog & Cafe Review Collection")}</li>
          </ul>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <Bot className="w-6 h-6 text-green-400 mb-3" />
        <h2 className="text-lg font-bold text-slate-100 mb-2">{t("AI 분석 엔진", "AI Analysis Engine")}</h2>
        <p className="text-sm text-slate-400 mb-3">
          {t(
            "네이버 블로그·카페 리뷰를 수집해 Gemini AI · Groq로 감성 분석 후 긍정/부정/중립 비율과 핵심 키워드를 추출합니다.",
            "Collects Naver blog and cafe reviews, then uses Gemini AI & Groq to analyze sentiment and extract positive/negative/neutral ratios and key keywords."
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {["Gemini AI", "Groq", "Supabase Edge Functions"].map((tech) => (
            <span key={tech} className="px-2.5 py-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-slate-100 mb-3">{t("플랫폼 안내", "Platform Guide")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "네이버 웹툰", color: "text-green-400", icon: "N" },
            { name: "카카오 웹툰", color: "text-yellow-400", icon: "K" },
            { name: "레진코믹스", color: "text-red-400", icon: "L" },
            { name: "봄툰", color: "text-pink-400", icon: "B" },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <span className={`text-sm font-bold ${p.color}`}>{p.icon}</span>
              <span className="text-xs text-slate-300">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
