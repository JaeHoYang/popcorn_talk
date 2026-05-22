import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Anime } from "@/types/anime";
import AnimeCard from "./AnimeCard";
import SkeletonCard from "@/components/common/SkeletonCard";

export default function CurrentlyAiring() {
  const { t } = useLanguage();

  const { data, isLoading } = useQuery<Anime[]>({
    queryKey: ["airing-anime"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("popular-anime", {
        body: { filter: "airing" },
      });
      if (error) throw error;
      return (data.data as Anime[]) ?? [];
    },
    staleTime: 6 * 60 * 60 * 1000,
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">
          {t("지금 방영 중", "Currently Airing")}
        </h2>
        <Link
          to="/anime/ranking?filter=airing"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          {t("전체 보기 →", "See All →")}
        </Link>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data!.slice(0, 10).map((anime) => <AnimeCard key={anime.mal_id} anime={anime} />)}
        </div>
      )}
    </section>
  );
}
