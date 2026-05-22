import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { Anime } from "@/types/anime";
import { cn } from "@/lib/utils";
import AnimeCard from "@/components/anime/AnimeCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

type RankFilter = "bypopularity" | "airing" | "upcoming" | "byfavorites";

interface RankingResponse {
  data: Anime[];
  pagination: {
    current_page: number;
    last_visible_page: number;
    has_next_page: boolean;
  };
}

const FILTERS: { value: RankFilter; ko: string; en: string }[] = [
  { value: "bypopularity", ko: "인기순",   en: "Most Popular" },
  { value: "airing",       ko: "방영중",   en: "Currently Airing" },
  { value: "upcoming",     ko: "방영예정", en: "Upcoming" },
  { value: "byfavorites",  ko: "즐겨찾기", en: "Most Favorited" },
];

export default function AnimeRanking() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlFilter = searchParams.get("filter") as RankFilter | null;
  const urlPage   = Math.max(1, Number(searchParams.get("page")) || 1);

  const validFilter = FILTERS.some((f) => f.value === urlFilter) ? urlFilter! : "bypopularity";
  const [filter, setFilter] = useState<RankFilter>(validFilter);

  // 필터 버튼 클릭 시 page=1로 초기화
  function handleFilter(f: RankFilter) {
    setFilter(f);
    navigate(`/anime/ranking?filter=${f}&page=1`);
  }

  function goPage(p: number) {
    navigate(`/anime/ranking?filter=${filter}&page=${p}`);
  }

  // URL page 파라미터로 실제 사용할 페이지 결정
  const page = urlPage;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page, filter]);

  const { data, isLoading, isError } = useQuery<RankingResponse>({
    queryKey: ["anime-ranking", filter, page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-anime-ranking", {
        body: { filter, page },
      });
      if (error) throw error;
      return data as RankingResponse;
    },
    staleTime: 60 * 60 * 1000,
  });

  const totalPages = data?.pagination?.last_visible_page ?? 1;
  const rankOffset = (page - 1) * 25;

  function pageNumbers(): number[] {
    const range: number[] = [];
    const start = Math.max(1, page - 2);
    const end   = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-100">{t("애니 순위", "Anime Ranking")}</h1>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilter(f.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                filter === f.value
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              )}
            >
              {t(f.ko, f.en)}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <p className="text-sm text-slate-400">{page} / {totalPages} 페이지</p>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 25 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {isError && <EmptyState type="error" />}
      {!isLoading && !isError && data?.data?.length === 0 && <EmptyState type="empty" />}
      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.data.map((anime, idx) => (
              <div key={anime.mal_id} className="relative">
                <span className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  #{rankOffset + idx + 1}
                </span>
                <AnimeCard anime={anime} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 pt-4 flex-wrap">
              <button
                onClick={() => goPage(1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                «
              </button>
              <button
                onClick={() => goPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {pageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => goPage(p)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    p === page
                      ? "bg-purple-600 text-white font-medium"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goPage(page + 1)}
                disabled={!data.pagination.has_next_page}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ›
              </button>
              <button
                onClick={() => goPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                »
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
