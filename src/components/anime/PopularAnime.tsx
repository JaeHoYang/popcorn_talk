import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Anime } from "@/types/anime";
import AnimeCard from "./AnimeCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

export default function PopularAnime() {
  const { t } = useLanguage();

  const { data, isLoading, isError } = useQuery<Anime[]>({
    queryKey: ["popular-anime"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("popular-anime", {
        body: { filter: "bypopularity" },
      });
      if (error) throw error;
      return (data.data as Anime[]) ?? [];
    },
    staleTime: 6 * 60 * 60 * 1000,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">
          {t("인기 애니메이션", "Popular Anime")}
        </h2>
        <Link
          to="/anime/ranking?filter=bypopularity"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
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
      {!isLoading && !isError && data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.map((anime) => <AnimeCard key={anime.mal_id} anime={anime} />)}
        </div>
      )}
    </section>
  );
}
