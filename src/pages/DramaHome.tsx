import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Drama, DramaCountry } from "@/types/drama";
import DramaCard from "@/components/drama/DramaCard";
import CountryTabs from "@/components/drama/CountryTabs";
import DramaFilter, { DramaFilterValues, DEFAULT_DRAMA_FILTERS, isDramaFilterActive } from "@/components/drama/DramaFilter";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

const TMDB_IMG = "https://image.tmdb.org/t/p/w92";

function usePopularDramas(country: DramaCountry) {
  return useQuery<{ results: Drama[] }>({
    queryKey: ["popular-drama", country],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("popular-drama", {
        body: { country, page: 1 },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 6 * 60 * 60 * 1000,
  });
}

function useDramaAutocomplete(query: string) {
  return useQuery<{ results: Drama[] }>({
    queryKey: ["drama-autocomplete", query],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("search-drama", {
        body: { query },
      });
      if (error) throw error;
      return data;
    },
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export default function DramaHome() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [country, setCountry] = useState<DramaCountry>("KR");
  const [advFilter, setAdvFilter] = useState<DramaFilterValues>(DEFAULT_DRAMA_FILTERS);

  const filterActive = isDramaFilterActive(advFilter);

  const { data: autocomplete, isLoading: acLoading } = useDramaAutocomplete(query);
  const { data: popular, isLoading: popLoading } = usePopularDramas(country);

  const { data: filterData, isLoading: filterLoading } = useQuery<{ results: Drama[] }>({
    queryKey: ["drama-filter", advFilter, country],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-drama-ranking", {
        body: {
          filter: "popularity",
          country,
          page: 1,
          genres: advFilter.genres.join(","),
          yearFrom: advFilter.yearFrom,
          yearTo: advFilter.yearTo,
          minRating: advFilter.minRating,
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: filterActive,
    staleTime: 10 * 60 * 1000,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setShowDrop(false);
    if (query.trim()) navigate(`/drama/search?q=${encodeURIComponent(query.trim())}`);
  }

  const dropVisible = showDrop && query.trim().length >= 2 && (acLoading || (autocomplete?.results?.length ?? 0) > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* 히어로 */}
      <section className="text-center py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-indigo-500/5 to-transparent rounded-2xl" />
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100">📺 SeriesTalk</h1>
          <p className="text-slate-400 text-lg">
            {t("AI로 드라마를 더 깊게 느껴보세요", "Feel dramas deeper with AI")}
          </p>

          {/* 검색창 */}
          <form onSubmit={handleSearch} className="flex justify-center">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                placeholder={t("드라마 제목을 검색하세요", "Search drama title...")}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 transition-colors">
                <Search className="w-5 h-5" />
              </button>

              {dropVisible && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {acLoading && (
                    <div className="px-4 py-3 text-sm text-slate-400">{t("검색 중...", "Searching...")}</div>
                  )}
                  {!acLoading && autocomplete?.results?.slice(0, 6).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onMouseDown={() => { navigate(`/drama/${d.id}`); setShowDrop(false); setQuery(""); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 transition-colors text-left"
                    >
                      {d.poster_path ? (
                        <img src={`${TMDB_IMG}${d.poster_path}`} alt={d.name} className="w-8 h-12 object-cover rounded shrink-0" />
                      ) : (
                        <div className="w-8 h-12 bg-slate-700 rounded shrink-0 flex items-center justify-center text-xs">📺</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-slate-100 truncate">{d.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{d.first_air_date?.slice(0, 4)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* 검색 아래 필터 */}
          <div className="flex justify-center pt-1">
            <DramaFilter onApply={setAdvFilter} />
          </div>
        </div>
      </section>

      {/* 인기 드라마 / 필터 결과 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-xl font-bold text-slate-100">
              {filterActive ? t("필터 결과", "Filter Results") : t("인기 드라마", "Popular Dramas")}
            </h2>
            {!filterActive && <CountryTabs value={country} onChange={setCountry} />}
          </div>
          {!filterActive && (
            <Link
              to={`/drama/ranking?filter=popularity&country=${country}&page=1`}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t("전체 보기 →", "View All →")}
            </Link>
          )}
        </div>

        {(filterActive ? filterLoading : popLoading) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {filterActive && !filterLoading && (
          filterData?.results?.length === 0
            ? <EmptyState type="search" />
            : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filterData?.results?.slice(0, 20).map((d) => <DramaCard key={d.id} drama={d} />)}
              </div>
            )
        )}

        {!filterActive && !popLoading && popular?.results && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {popular.results.slice(0, 20).map((d) => <DramaCard key={d.id} drama={d} />)}
          </div>
        )}
      </section>
    </div>
  );
}
