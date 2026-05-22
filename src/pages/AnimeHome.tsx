import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import MoodSectionAnime from "@/components/anime/MoodSectionAnime";
import CurrentlyAiring from "@/components/anime/CurrentlyAiring";
import PopularAnime from "@/components/anime/PopularAnime";
import AnimeFilter, { AnimeFilterValues } from "@/components/anime/AnimeFilter";
import { useAnimeAutocomplete, ANIME_STATUS_LABEL } from "@/hooks/useAnimeAutocomplete";
import { cn } from "@/lib/utils";

export default function AnimeHome() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, isLoading } = useAnimeAutocomplete(query);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowDrop(false);
    if (query.trim()) navigate(`/anime/search?q=${encodeURIComponent(query.trim())}`);
  }

  function handleSelect(id: number) {
    setShowDrop(false);
    setQuery("");
    navigate(`/anime/${id}`);
  }

  function handleFilter(values: AnimeFilterValues) {
    const params = new URLSearchParams();
    if (values.genres.length)  params.set("genres", values.genres.join(","));
    if (values.status)         params.set("status", values.status);
    if (values.yearFrom)       params.set("year_from", values.yearFrom);
    if (values.yearTo)         params.set("year_to", values.yearTo);
    if (values.minScore > 0)   params.set("min_score", String(values.minScore));
    if (values.orderBy)        params.set("order_by", values.orderBy);
    navigate(`/anime/search?${params.toString()}`);
  }

  const dropVisible = showDrop && query.trim().length >= 2 && (isLoading || suggestions.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* 히어로 */}
      <section className="text-center py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-pink-500/5 to-transparent rounded-2xl" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-3">✨ Anime Talk</h1>
          <p className="text-slate-400 mb-8 text-lg">
            {t("AI로 애니메이션을 더 깊게 느껴보세요", "Feel anime deeper with AI")}
          </p>
          <form onSubmit={handleSearch} className="flex justify-center">
            <div className="relative w-full max-w-lg">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                placeholder={t("애니 제목을 검색하세요", "Search anime title...")}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors">
                <Search className="w-5 h-5" />
              </button>

              {/* 자동완성 드롭다운 */}
              {dropVisible && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {isLoading && (
                    <div className="px-4 py-3 text-sm text-slate-400">{t("검색 중...", "Searching...")}</div>
                  )}
                  {!isLoading && suggestions.map((s) => {
                    const status = ANIME_STATUS_LABEL[s.status];
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={() => handleSelect(s.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 transition-colors text-left"
                      >
                        {s.cover ? (
                          <img src={s.cover} alt={s.title} className="w-8 h-12 object-cover rounded shrink-0" />
                        ) : (
                          <div className="w-8 h-12 bg-slate-700 rounded shrink-0 flex items-center justify-center text-xs">✨</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-slate-100 truncate">{s.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {status && <span className={cn("text-xs", status.color)}>{status.ko}</span>}
                            {s.episodes && <span className="text-xs text-slate-500">{s.episodes}화</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </form>
          <div className="mt-4 flex justify-center">
            <AnimeFilter onApply={handleFilter} />
          </div>
        </div>
      </section>

      <MoodSectionAnime />
      <CurrentlyAiring />
      <PopularAnime />
    </div>
  );
}
