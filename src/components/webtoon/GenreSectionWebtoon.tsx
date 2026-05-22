import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Webtoon, WEBTOON_MOOD_MAP } from "@/types/webtoon";
import WebtoonCard from "./WebtoonCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

export default function GenreSectionWebtoon() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const { t } = useLanguage();

  const selectedMood = selectedIdx !== null ? WEBTOON_MOOD_MAP[selectedIdx] : null;

  const { data, isLoading, isError } = useQuery<Webtoon[]>({
    queryKey: ["webtoon-genre", selectedMood?.genres],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("search-webtoon", {
        body: { genre: selectedMood!.genres[0] },
      });
      if (error) throw error;
      return (data.data as Webtoon[]) ?? [];
    },
    enabled: selectedIdx !== null,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-1">
          {t("장르별 탐색", "Browse by Genre")}
        </h2>
        <p className="text-sm text-slate-400">
          {t("좋아하는 장르의 웹툰을 찾아보세요", "Find webtoons in your favorite genre")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {WEBTOON_MOOD_MAP.map((mood, idx) => (
          <button
            key={mood.emoji}
            onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              selectedIdx === idx
                ? "bg-green-600 text-white scale-105"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            )}
          >
            <span>{mood.emoji}</span>
            <span>{t(mood.label, mood.labelEn)}</span>
          </button>
        ))}
      </div>

      {selectedIdx !== null && selectedMood && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {t(`${selectedMood.label} 웹툰`, `${selectedMood.labelEn} webtoons`)}
            </p>
            <Link
              to={`/webtoon/search?genre=${encodeURIComponent(selectedMood.genres[0])}`}
              className="text-sm text-green-400 hover:text-green-300 transition-colors"
            >
              {t("전체 보기 →", "See All →")}
            </Link>
          </div>
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {isError && <EmptyState type="error" />}
          {!isLoading && !isError && data?.length === 0 && <EmptyState type="search" />}
          {!isLoading && !isError && data && data.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.map((w) => <WebtoonCard key={w.id} webtoon={w} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
