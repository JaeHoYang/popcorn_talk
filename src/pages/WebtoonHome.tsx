import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import PopularWebtoon from "@/components/webtoon/PopularWebtoon";
import GenreSectionWebtoon from "@/components/webtoon/GenreSectionWebtoon";
import WebtoonFilter, { WebtoonFilterValues } from "@/components/webtoon/WebtoonFilter";
import { useWebtoonAutocomplete } from "@/hooks/useWebtoonAutocomplete";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, { ko: string; color: string }> = {
  RELEASING: { ko: "연재중", color: "text-green-400" },
  FINISHED:  { ko: "완결",   color: "text-slate-400" },
  HIATUS:    { ko: "휴재",   color: "text-yellow-400" },
};

export default function WebtoonHome() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [filterValues, setFilterValues] = useState<WebtoonFilterValues>({ genre: "", status: "" });
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, isLoading } = useWebtoonAutocomplete(query);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowDrop(false);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (filterValues.genre) params.set("genre", filterValues.genre);
    if (filterValues.status) params.set("status", filterValues.status);
    if (params.toString()) navigate(`/webtoon/search?${params.toString()}`);
  }

  function handleSelect(id: number) {
    setShowDrop(false);
    setQuery("");
    navigate(`/webtoon/${id}`);
  }

  function handleFilter(values: WebtoonFilterValues) {
    setFilterValues(values);
    if (!query.trim() && (values.genre || values.status)) {
      const params = new URLSearchParams();
      if (values.genre) params.set("genre", values.genre);
      if (values.status) params.set("status", values.status);
      navigate(`/webtoon/search?${params.toString()}`);
    }
  }

  const dropVisible = showDrop && query.trim().length >= 2 && (isLoading || suggestions.length > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* 히어로 */}
      <section className="text-center py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-emerald-500/5 to-transparent rounded-2xl" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-3">📖 Toon Talk</h1>
          <p className="text-slate-400 mb-8 text-lg">
            {t("AI로 웹툰을 더 깊게 느껴보세요", "Feel webtoons deeper with AI")}
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
                placeholder={t("웹툰 제목을 검색하세요", "Search webtoon title...")}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-green-500 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-400 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* 자동완성 드롭다운 */}
              {dropVisible && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {isLoading && (
                    <div className="px-4 py-3 text-sm text-slate-400">{t("검색 중...", "Searching...")}</div>
                  )}
                  {!isLoading && suggestions.map((s) => {
                    const status = STATUS_LABEL[s.status];
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={() => handleSelect(s.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 transition-colors text-left"
                      >
                        {s.cover ? (
                          <img
                            src={s.cover}
                            alt={s.title}
                            className="w-8 h-12 object-cover rounded shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-8 h-12 bg-slate-700 rounded shrink-0 flex items-center justify-center text-xs">📖</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm text-slate-100 truncate">{s.title}</p>
                          {status && (
                            <p className={cn("text-xs mt-0.5", status.color)}>{status.ko}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </form>

          <div className="mt-4 flex justify-center">
            <WebtoonFilter onApply={handleFilter} />
          </div>
        </div>
      </section>

      <GenreSectionWebtoon />
      <PopularWebtoon />
    </div>
  );
}
