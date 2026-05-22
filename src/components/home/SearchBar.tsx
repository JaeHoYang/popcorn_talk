import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Movie } from "@/types/movie";
import { posterUrl, formatYear } from "@/lib/utils";
import { cn } from "@/lib/utils";

type SearchType = "title" | "actor" | "director";

const SEARCH_TYPES: { value: SearchType; ko: string; en: string }[] = [
  { value: "title",    ko: "제목",  en: "Title" },
  { value: "actor",    ko: "배우",  en: "Actor" },
  { value: "director", ko: "감독",  en: "Director" },
];

export default function SearchBar() {
  const [query, setQuery]           = useState("");
  const [searchType, setSearchType] = useState<SearchType>("title");
  const [typeOpen, setTypeOpen]     = useState(false);
  const [results, setResults]       = useState<Movie[]>([]);
  const [personName, setPersonName] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { uiLanguage, t } = useLanguage();
  const navigate    = useNavigate();
  const inputRef    = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const typeRef     = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentType = SEARCH_TYPES.find((s) => s.value === searchType)!;

  const doSearch = useCallback(
    async (q: string, type: SearchType) => {
      if (!q.trim()) { setResults([]); setOpen(false); return; }
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("search-movie", {
          body: { query: q.trim(), language: uiLanguage, searchType: type },
        });
        if (!error && data?.results) {
          setResults(data.results.slice(0, 8));
          setPersonName(data.person?.name ?? null);
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [uiLanguage]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query, searchType), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, searchType, doSearch]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!inputRef.current?.contains(target) && !dropdownRef.current?.contains(target)) setOpen(false);
      if (!typeRef.current?.contains(target)) setTypeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (movie: Movie) => {
    setOpen(false);
    setQuery("");
    navigate(`/movie/${movie.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIndex >= 0) { e.preventDefault(); handleSelect(results[activeIndex]); }
    else if (e.key === "Escape") { setOpen(false); setActiveIndex(-1); }
  };

  const placeholder = searchType === "title"
    ? t("영화 제목을 입력하세요", "Enter a movie title")
    : searchType === "actor"
    ? t("배우 이름을 입력하세요", "Enter actor name")
    : t("감독 이름을 입력하세요", "Enter director name");

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative flex items-center">
        {/* 검색 타입 셀렉터 */}
        <div ref={typeRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setTypeOpen((o) => !o)}
            className="flex items-center gap-1.5 h-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-l-xl text-sm text-slate-200 hover:bg-slate-600 transition-colors whitespace-nowrap"
          >
            {t(currentType.ko, currentType.en)}
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", typeOpen && "rotate-180")} />
          </button>
          {typeOpen && (
            <div className="absolute top-full mt-1 left-0 w-28 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {SEARCH_TYPES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => { setSearchType(s.value); setTypeOpen(false); setResults([]); setOpen(false); inputRef.current?.focus(); }}
                  className={cn(
                    "w-full px-4 py-2.5 text-sm text-left transition-colors",
                    s.value === searchType ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
                  )}
                >
                  {t(s.ko, s.en)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 검색 입력 */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={placeholder}
            className="w-full bg-slate-800 border border-l-0 border-slate-700 rounded-r-xl pl-4 pr-12 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-base"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin pointer-events-none" />
          )}
          {!loading && query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {!loading && !query && (
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
          )}
        </div>
      </div>

      {/* 드롭다운 결과 */}
      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
        >
          {personName && (
            <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-700">
              {searchType === "actor" ? t("배우", "Actor") : t("감독", "Director")}: <span className="text-slate-200">{personName}</span>
            </div>
          )}
          {results.map((movie, idx) => (
            <button
              key={movie.id}
              onClick={() => handleSelect(movie)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                idx === activeIndex ? "bg-slate-700" : "hover:bg-slate-700"
              )}
            >
              <div className="w-8 h-12 bg-slate-600 rounded overflow-hidden shrink-0">
                {posterUrl(movie.poster_path, "w92") && (
                  <img src={posterUrl(movie.poster_path, "w92")!} alt={movie.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{movie.title}</p>
                <p className="text-xs text-slate-400">{formatYear(movie.release_date)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-slate-500 text-center">
        {t("예: 파묘, 범죄도시 4 등 정확한 제목으로 검색하세요", "Try: Interstellar, Parasite, etc.")}
      </p>
    </div>
  );
}
