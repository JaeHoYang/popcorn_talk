import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Movie } from "@/types/movie";
import MovieCard from "@/components/movie/MovieCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

export default function PopularMovies() {
  const { uiLanguage, t } = useLanguage();

  const { data, isLoading, isError } = useQuery<Movie[]>({
    queryKey: ["popular-movies", uiLanguage],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("popular-movies", {
        body: { language: uiLanguage },
      });
      if (error) throw error;
      return (data.results as Movie[]) ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-bold text-slate-100">{t("인기 영화", "Popular Movies")}</h2>
        </div>
        <Link
          to="/movies/popular"
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
      {!isLoading && !isError && !data?.length && <EmptyState />}
      {!isLoading && !isError && data && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.slice(0, 20).map((movie) => <MovieCard key={movie.id} movie={movie} />)}
        </div>
      )}
    </section>
  );
}
