import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebtoonRanking } from "@/hooks/useWebtoonRanking";
import { Webtoon } from "@/types/webtoon";
import { cn } from "@/lib/utils";
import WebtoonCard from "@/components/webtoon/WebtoonCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

type RankFilter = "bypopularity" | "rating" | "ongoing" | "completed" | "new";

const FILTERS: { value: RankFilter; ko: string; en: string }[] = [
  { value: "bypopularity", ko: "인기순", en: "Most Popular" },
  { value: "rating",       ko: "평점순", en: "Top Rated" },
  { value: "ongoing",      ko: "연재중", en: "Ongoing" },
  { value: "completed",    ko: "완결",   en: "Completed" },
  { value: "new",          ko: "신작",   en: "New" },
];

const LIMIT = 25;

export default function WebtoonRanking() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlFilter = searchParams.get("filter") as RankFilter | null;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const filter: RankFilter = FILTERS.some((f) => f.value === urlFilter) ? urlFilter! : "bypopularity";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page, filter, order]);

  function handleFilter(f: RankFilter) {
    navigate(`/webtoon/ranking?filter=${f}&order=${order}&page=1`);
  }

  function toggleOrder() {
    const next = order === "desc" ? "asc" : "desc";
    navigate(`/webtoon/ranking?filter=${filter}&order=${next}&page=1`);
  }

  function goPage(p: number) {
    navigate(`/webtoon/ranking?filter=${filter}&order=${order}&page=${p}`);
  }

  const { data, isLoading, isError } = useWebtoonRanking(filter, page, order as "asc" | "desc");
  const totalPages = data?.pagination?.last_page ?? 1;
  const rankOffset = (page - 1) * LIMIT;

  function pageNumbers(): number[] {
    const range: number[] = [];
    const start = Math.max(1, page - 2);
    const end   = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">{t("웹툰 순위", "Webtoon Ranking")}</h1>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilter(f.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                filter === f.value
                  ? "bg-green-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              )}
            >
              {t(f.ko, f.en)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-full transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {order === "desc" ? t("내림차순", "Descending") : t("오름차순", "Ascending")}
          </button>
          {data && <p className="text-sm text-slate-400">{page} / {totalPages} 페이지</p>}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {isError && <EmptyState type="error" />}
      {!isLoading && !isError && data?.data?.length === 0 && <EmptyState type="empty" />}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.data.map((webtoon: Webtoon, idx: number) => (
              <WebtoonCard key={webtoon.id} webtoon={webtoon} rank={rankOffset + idx + 1} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 pt-4 flex-wrap">
              <button onClick={() => goPage(1)} disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">«</button>
              <button onClick={() => goPage(page - 1)} disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
              {pageNumbers().map((p) => (
                <button key={p} onClick={() => goPage(p)}
                  className={cn("px-3 py-1.5 text-sm rounded-md transition-colors",
                    p === page ? "bg-green-600 text-white font-medium" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  )}>
                  {p}
                </button>
              ))}
              <button onClick={() => goPage(page + 1)} disabled={!data.pagination.has_next_page}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">›</button>
              <button onClick={() => goPage(totalPages)} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
