import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Movie, MOOD_MAP } from "@/types/movie";
import MovieCard from "@/components/movie/MovieCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

export default function MoodSection() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const { uiLanguage, t } = useLanguage();

  const selectedMood = selectedIdx !== null ? MOOD_MAP[selectedIdx] : null;

  const { data, isLoading, isError } = useQuery<Movie[]>({
    queryKey: ["mood", selectedMood?.genres, uiLanguage],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("discover-movies", {
        body: {
          genres: selectedMood!.genres.join(","),
          language: uiLanguage,
          sort_by: "popularity.desc",
          min_vote_count: 100,
        },
      });
      if (error) throw error;
      return (data.results as Movie[]) ?? [];
    },
    enabled: selectedIdx !== null,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-1">
          {t("지금 기분이 어때요?", "How are you feeling?")}
        </h2>
        <p className="text-sm text-slate-400">
          {t("기분에 맞는 영화를 추천해 드릴게요", "We'll recommend movies that match your mood")}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {MOOD_MAP.map((mood, idx) => (
          <button
            key={mood.emoji}
            onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all",
              selectedIdx === idx
                ? "border-blue-500 bg-blue-500/20 text-blue-300 scale-105"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
            )}
          >
            <span className="text-lg">{mood.emoji}</span>
            <span>{t(mood.label, mood.labelEn)}</span>
          </button>
        ))}
      </div>

      {selectedIdx !== null && selectedMood && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {t(`${selectedMood.label} 추천`, `${selectedMood.labelEn} picks`)}
            </p>
            <Link
              to={`/movies/genre?genres=${selectedMood.genres.join(",")}&label=${encodeURIComponent(selectedMood.label)}`}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t("전체 보기 →", "See All →")}
            </Link>
          </div>
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {isError && <EmptyState type="error" />}
          {!isLoading && !isError && data?.length === 0 && <EmptyState type="search" />}
          {!isLoading && !isError && data && data.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.slice(0, 10).map((movie) => <MovieCard key={movie.id} movie={movie} />)}
            </div>
          )}
        </>
      )}
    </section>
  );
}
