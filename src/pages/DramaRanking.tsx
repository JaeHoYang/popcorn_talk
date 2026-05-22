import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { Drama, DramaCountry, DRAMA_COUNTRIES, DramaRankingFilter } from "@/types/drama";
import { cn } from "@/lib/utils";
import DramaCard from "@/components/drama/DramaCard";
import CountryTabs from "@/components/drama/CountryTabs";
import DramaFilter, { DramaFilterValues, DEFAULT_DRAMA_FILTERS } from "@/components/drama/DramaFilter";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

interface RankingResponse {
  results: Drama[];
  total_pages: number;
  page: number;
  total_results: number;
}

const FILTERS: { value: DramaRankingFilter; ko: string; en: string }[] = [
  { value: "popularity", ko: "인기순",   en: "Most Popular" },
  { value: "rating",     ko: "평점순",   en: "Highest Rated" },
  { value: "newest",     ko: "최신순",   en: "Newest" },
  { value: "airing",     ko: "방영중",   en: "Airing" },
  { value: "upcoming",   ko: "방영예정", en: "Upcoming" },
  { value: "ended",      ko: "종료",     en: "Ended" },
];

export default function DramaRanking() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [advFilter, setAdvFilter] = useState<DramaFilterValues>(DEFAULT_DRAMA_FILTERS);

  const urlFilter = searchParams.get("filter") as DramaRankingFilter | null;
  const urlCountry = searchParams.get("country") as DramaCountry | null;
  const urlPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const filter: DramaRankingFilter = FILTERS.some((f) => f.value === urlFilter) ? urlFilter! : "popularity";
  const country: DramaCountry = DRAMA_COUNTRIES.some((c) => c.code === urlCountry) ? urlCountry! : "ALL";

  function nav(f: DramaRankingFilter, c: DramaCountry, p: number) {
    navigate(`/drama/ranking?filter=${f}&country=${c}&page=${p}`);
  }

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [urlPage, filter, country]);

  const { data, isLoading, isError } = useQuery<RankingResponse>({
    queryKey: ["drama-ranking", filter, country, urlPage, advFilter],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-drama-ranking", {
        body: {
          filter,
          country,
          page: urlPage,
          genres: advFilter.genres.join(","),
          yearFrom: advFilter.yearFrom,
          yearTo: advFilter.yearTo,
          minRating: advFilter.minRating,
        },
      });
      if (error) throw error;
      return data as RankingResponse;
    },
    staleTime: 60 * 60 * 1000,
  });

  const totalPages = Math.min(data?.total_pages ?? 1, 10);
  const rankOffset = (urlPage - 1) * 20;

  function pageNumbers(): number[] {
    const range: number[] = [];
    const start = Math.max(1, urlPage - 2);
    const end   = Math.min(totalPages, urlPage + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-100">{t("드라마 순위", "Drama Ranking")}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => nav(f.value, country, 1)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              )}
            >
              {t(f.ko, f.en)}
            </button>
          ))}
          <DramaFilter onApply={(v) => { setAdvFilter(v); nav(filter, country, 1); }} />
        </div>
      </div>

      <CountryTabs value={country} onChange={(c) => nav(filter, c, 1)} />

      {data && (
        <p className="text-sm text-slate-400">{urlPage} / {totalPages} 페이지</p>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {isError && <EmptyState type="error" />}
      {!isLoading && !isError && (!data?.results || data.results.length === 0) && <EmptyState type="empty" />}
      {!isLoading && !isError && data && data.results.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.results.map((drama, idx) => (
              <div key={drama.id} className="relative">
                <span className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  #{rankOffset + idx + 1}
                </span>
                <DramaCard drama={drama} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 pt-4 flex-wrap">
              <button onClick={() => nav(filter, country, 1)} disabled={urlPage === 1}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">«</button>
              <button onClick={() => nav(filter, country, urlPage - 1)} disabled={urlPage === 1}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
              {pageNumbers().map((p) => (
                <button key={p} onClick={() => nav(filter, country, p)}
                  className={cn("px-3 py-1.5 text-sm rounded-md transition-colors",
                    p === urlPage ? "bg-blue-600 text-white font-medium" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}>
                  {p}
                </button>
              ))}
              <button onClick={() => nav(filter, country, urlPage + 1)} disabled={urlPage >= totalPages}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">›</button>
              <button onClick={() => nav(filter, country, totalPages)} disabled={urlPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
