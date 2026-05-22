import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Anime, MOOD_MAP_ANIME } from "@/types/anime";
import AnimeCard from "./AnimeCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

export default function MoodSectionAnime() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const { t } = useLanguage();

  const selectedMood = selectedIdx !== null ? MOOD_MAP_ANIME[selectedIdx] : null;

  const { data, isLoading, isError } = useQuery<Anime[]>({
    queryKey: ["anime-mood", selectedMood?.genres],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("search-anime", {
        body: { genres: selectedMood!.genres.join(","), order_by: "popularity" },
      });
      if (error) throw error;
      return (data.data as Anime[]) ?? [];
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
          {t("기분에 맞는 애니를 추천해드릴게요", "We'll recommend anime that matches your mood")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MOOD_MAP_ANIME.map((mood, idx) => (
          <button
            key={mood.emoji}
            onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              selectedIdx === idx
                ? "bg-blue-600 text-white scale-105"
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
              {t(`${selectedMood.label} 추천`, `${selectedMood.labelEn} picks`)}
            </p>
            <Link
              to={`/anime/genre?genres=${selectedMood.genres.join(",")}&label=${encodeURIComponent(selectedMood.label)}`}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
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
          {!isLoading && !isError && data && data.length === 0 && <EmptyState type="search" />}
          {!isLoading && !isError && data && data.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.slice(0, 10).map((anime) => <AnimeCard key={anime.mal_id} anime={anime} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
