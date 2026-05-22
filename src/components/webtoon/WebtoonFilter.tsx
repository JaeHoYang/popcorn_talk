import { useState } from "react";
import { Filter, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { WEBTOON_TAGS } from "@/types/webtoon";
import { cn } from "@/lib/utils";

export interface WebtoonFilterValues {
  genre: string;
  status: string;
}

const DEFAULT_FILTERS: WebtoonFilterValues = { genre: "", status: "" };

const STATUS_OPTIONS = [
  { value: "",          ko: "전체",   en: "All" },
  { value: "ongoing",   ko: "연재중", en: "Ongoing" },
  { value: "completed", ko: "완결",   en: "Completed" },
  { value: "hiatus",    ko: "휴재",   en: "Hiatus" },
];

interface Props {
  onApply: (values: WebtoonFilterValues) => void;
}

export default function WebtoonFilter({ onApply }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<WebtoonFilterValues>(DEFAULT_FILTERS);

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
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-slate-800 border border-slate-700 rounded-xl p-4 z-50 space-y-4 shadow-xl">
          {/* 장르 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">{t("장르", "Genre")}</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setValues((v) => ({ ...v, genre: "" }))}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full transition-colors",
                  values.genre === "" ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                )}
              >
                {t("전체", "All")}
              </button>
              {WEBTOON_TAGS.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setValues((v) => ({ ...v, genre: v.genre === tag.id ? "" : tag.id }))}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-full transition-colors",
                    values.genre === tag.id ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  {tag.emoji} {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* 연재 상태 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2">{t("연재 상태", "Status")}</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setValues((v) => ({ ...v, status: s.value }))}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-full transition-colors",
                    values.status === s.value ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  )}
                >
                  {t(s.ko, s.en)}
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
              className="flex-1 py-2 text-xs text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors"
            >
              {t("적용", "Apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
