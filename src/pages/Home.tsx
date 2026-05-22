import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Movie } from "@/types/movie";
import SearchBar from "@/components/home/SearchBar";
import AdvancedFilter, { FilterValues } from "@/components/home/AdvancedFilter";
import MoodSection from "@/components/home/MoodSection";
import PopularMovies from "@/components/home/PopularMovies";
import Wishlist from "@/components/home/Wishlist";
import MovieCard from "@/components/movie/MovieCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

const DEFAULT_FILTERS: FilterValues = {
  genres: [],
  yearFrom: "",
  yearTo: "",
  originalLanguage: "",
  minRating: 0,
  sortBy: "popularity.desc",
};

function isFilterActive(f: FilterValues) {
  return (
    f.genres.length > 0 ||
    !!f.yearFrom ||
    !!f.yearTo ||
    !!f.originalLanguage ||
    f.minRating > 0 ||
    f.sortBy !== "popularity.desc"
  );
}

export default function Home() {
  const { uiLanguage, t } = useLanguage();
  const [filterValues, setFilterValues] = useState<FilterValues>(DEFAULT_FILTERS);

  const { data: filterResults, isLoading: filterLoading, isError: filterError } = useQuery<Movie[]>({
    queryKey: ["discover-filter", filterValues, uiLanguage],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("discover-movies", {
        body: {
          genres: filterValues.genres.join(","),
          language: uiLanguage,
          original_language: filterValues.originalLanguage,
          sort_by: filterValues.sortBy,
          year_from: filterValues.yearFrom,
          year_to: filterValues.yearTo,
          min_vote_average: filterValues.minRating,
        },
      });
      if (error) throw error;
      return (data.results as Movie[]) ?? [];
    },
    enabled: isFilterActive(filterValues),
    staleTime: 5 * 60 * 1000,
  });

  const showFilterResults = isFilterActive(filterValues);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* 히어로 */}
      <section className="text-center py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent rounded-2xl" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-3">🎬 Popcorn Talk</h1>
          <p className="text-slate-400 mb-8 text-lg">
            {t("AI로 영화를 더 깊게 느껴보세요", "Feel movies deeper with AI")}
          </p>
          <div className="flex justify-center">
            <SearchBar />
          </div>
          <div className="mt-4 flex justify-center">
            <AdvancedFilter onApply={setFilterValues} />
          </div>
        </div>
      </section>

      {/* 필터 결과 */}
      {showFilterResults && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-100">{t("필터 결과", "Filter Results")}</h2>
          {filterLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {filterError && <EmptyState type="error" />}
          {!filterLoading && !filterError && filterResults?.length === 0 && <EmptyState type="search" />}
          {!filterLoading && !filterError && filterResults && filterResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filterResults.map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          )}
        </section>
      )}

      <MoodSection />
      <Wishlist />
      <PopularMovies />
    </div>
  );
}
