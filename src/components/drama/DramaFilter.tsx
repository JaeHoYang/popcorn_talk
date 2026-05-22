import { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TV_GENRES } from "@/types/drama";
import { cn } from "@/lib/utils";

export interface DramaFilterValues {
  genres: number[];
  yearFrom: string;
  yearTo: string;
  minRating: number;
}

export const DEFAULT_DRAMA_FILTERS: DramaFilterValues = {
  genres: [],
  yearFrom: "",
  yearTo: "",
  minRating: 0,
};

export function isDramaFilterActive(f: DramaFilterValues) {
  return f.genres.length > 0 || !!f.yearFrom || !!f.yearTo || f.minRating > 0;
}

interface Props {
  onApply: (filters: DramaFilterValues) => void;
}

export default function DramaFilter({ onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<DramaFilterValues>(DEFAULT_DRAMA_FILTERS);
  const { language, t } = useLanguage();

  const toggleGenre = (id: number) =>
    setFilters((f) => ({
      ...f,
      genres: f.genres.includes(id) ? f.genres.filter((g) => g !== id) : [...f.genres, id],
    }));

  const activeCount = [
    filters.genres.length > 0,
    !!(filters.yearFrom || filters.yearTo),
    filters.minRating > 0,
  ].filter(Boolean).length;

  const apply = () => { onApply(filters); setOpen(false); };
  const reset  = () => { setFilters(DEFAULT_DRAMA_FILTERS); onApply(DEFAULT_DRAMA_FILTERS); setOpen(false); };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors",
          activeCount > 0
            ? "border-blue-500 bg-blue-500/10 text-blue-400"
            : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
        )}
      >
        <Filter className="w-4 h-4" />
        {t("필터", "Filter")}
        {activeCount > 0 && (
          <span className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {activeCount}
          </span>
        )}
        <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-5 space-y-5">

            {/* 장르 */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">{t("장르", "Genre")}</p>
              <div className="flex flex-wrap gap-1.5">
                {TV_GENRES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-full border transition-colors",
                      filters.genres.includes(g.id)
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-slate-600 text-slate-300 hover:border-blue-400"
                    )}
                  >
                    {language === "ko" ? g.ko : g.en}
                  </button>
                ))}
              </div>
            </div>

            {/* 방영연도 */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">{t("방영연도", "Air Year")}</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="1990"
                  value={filters.yearFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, yearFrom: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-500 shrink-0">~</span>
                <input
                  type="number"
                  placeholder="2026"
                  value={filters.yearTo}
                  onChange={(e) => setFilters((f) => ({ ...f, yearTo: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* 최소 평점 */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-2">
                {t("최소 평점", "Min Rating")}: {filters.minRating.toFixed(1)}
              </p>
              <input
                type="range"
                min="0"
                max="9"
                step="0.5"
                value={filters.minRating}
                onChange={(e) => setFilters((f) => ({ ...f, minRating: parseFloat(e.target.value) }))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0</span><span>9.0</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={reset} className="flex-1 py-2 text-sm text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                {t("초기화", "Reset")}
              </button>
              <button onClick={apply} className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">
                {t("적용", "Apply")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
