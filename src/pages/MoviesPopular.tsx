import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { Movie } from "@/types/movie";
import MovieCard from "@/components/movie/MovieCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

interface PopularResponse {
  results: Movie[];
  total_pages: number;
  page: number;
}

export default function MoviesPopular() {
  const { uiLanguage, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  const { data, isLoading, isError } = useQuery<PopularResponse>({
    queryKey: ["movies-popular-all", uiLanguage, page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("popular-movies", {
        body: { language: uiLanguage, page },
      });
      if (error) throw error;
      return data as PopularResponse;
    },
    staleTime: 60 * 60 * 1000,
  });

  const totalPages = Math.min(data?.total_pages ?? 1, 500); // TMDB 최대 500페이지

  function goPage(p: number) {
    navigate(`/movies/popular?page=${p}`);
  }

  function pageNumbers(): number[] {
    const range: number[] = [];
    const start = Math.max(1, page - 2);
    const end   = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">{t("인기 영화", "Popular Movies")}</h1>
        {data && (
          <p className="text-sm text-slate-400">{page} / {totalPages} 페이지</p>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {isError && <EmptyState type="error" />}
      {!isLoading && !isError && data?.results?.length === 0 && <EmptyState type="empty" />}

      {!isLoading && !isError && data && data.results.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 pt-4 flex-wrap">
              <button
                onClick={() => goPage(1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >«</button>
              <button
                onClick={() => goPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >‹</button>
              {pageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => goPage(p)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    p === page
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >{p}</button>
              ))}
              <button
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >›</button>
              <button
                onClick={() => goPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
