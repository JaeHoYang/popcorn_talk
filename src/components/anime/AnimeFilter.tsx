import { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ANIME_GENRES } from "@/types/anime";
import { cn } from "@/lib/utils";

export interface AnimeFilterValues {
  genres: number[];
  yearFrom: string;
  yearTo: string;
  status: string;
  minScore: number;
  orderBy: string;
}

const DEFAULT_FILTERS: AnimeFilterValues = {
  genres: [],
  yearFrom: "",
  yearTo: "",
  status: "",
  minScore: 0,
  orderBy: "popularity",
};

const ORDER_OPTIONS = [
  { value: "popularity",  ko: "인기순",  en: "Most Popular" },
  { value: "score",       ko: "평점순",  en: "Highest Rated" },
  { value: "start_date",  ko: "최신순",  en: "Newest" },
  { value: "episodes",    ko: "에피소드순", en: "By Episodes" },
];

const STATUS_OPTIONS = [
  { value: "",           ko: "전체",   en: "All" },
  { value: "airing",     ko: "방영중", en: "Airing" },
  { value: "complete",   ko: "완결",   en: "Finished" },
  { value: "upcoming",   ko: "미방영", en: "Upcoming" },
];

interface Props {
  onApply: (values: AnimeFilterValues) => void;
}

export default function AnimeFilter({ onApply }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<AnimeFilterValues>(DEFAULT_FILTERS);

  function toggle(genreId: number) {
    setValues((v) => ({
      ...v,
      genres: v.genres.includes(genreId) ? v.genres.filter((g) => g !== genreId) : [...v.genres, genreId],
    }));
  }

  function handleReset() {
    setValues(DEFAULT_FILTERS);
    onApply(DEFAULT_FILTERS);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
      >
        <Filter className="w-4 h-4" />
        {t("필터", "Filter")}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 bg-slate-800 border border-slate-700 rounded-xl p-4 z-50 space-y-4 shadow-xl">
          {/* 장르 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">{t("장르", "Genre")}</p>
            <div className="flex flex-wrap gap-1.5">
              {ANIME_GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggle(g.id)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-full transition-colors",
                    values.genres.includes(g.id)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* 방영 상태 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">{t("방영 상태", "Status")}</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setValues((v) => ({ ...v, status: s.value }))}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-full transition-colors",
                    values.status === s.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  {t(s.ko, s.en)}
                </button>
              ))}
            </div>
          </div>

          {/* 연도 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">{t("방영 연도", "Year")}</p>
            <div className="flex gap-2">
              <input
                type="number" placeholder="From" min="1960" max="2030"
                value={values.yearFrom}
                onChange={(e) => setValues((v) => ({ ...v, yearFrom: e.target.value }))}
                className="w-full bg-slate-700 text-slate-100 text-xs rounded-lg px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
              />
              <input
                type="number" placeholder="To" min="1960" max="2030"
                value={values.yearTo}
                onChange={(e) => setValues((v) => ({ ...v, yearTo: e.target.value }))}
                className="w-full bg-slate-700 text-slate-100 text-xs rounded-lg px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 최소 평점 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">
              {t(`최소 평점: ${values.minScore}`, `Min Score: ${values.minScore}`)}
            </p>
            <input
              type="range" min="0" max="9" step="1"
              value={values.minScore}
              onChange={(e) => setValues((v) => ({ ...v, minScore: Number(e.target.value) }))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* 정렬 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">{t("정렬", "Sort By")}</p>
            <div className="flex flex-wrap gap-1.5">
              {ORDER_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setValues((v) => ({ ...v, orderBy: o.value }))}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-full transition-colors",
                    values.orderBy === o.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  {t(o.ko, o.en)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleReset}
              className="flex-1 py-2 text-xs text-slate-400 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              {t("초기화", "Reset")}
            </button>
            <button
              onClick={() => { onApply(values); setOpen(false); }}
              className="flex-1 py-2 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              {t("적용", "Apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
