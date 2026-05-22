import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { posterUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/common/EmptyState";
import { BoxofficeData } from "@/types/boxoffice";

type BoxType = "daily" | "weekly" | "monthly";

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function toYYYYMM(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getDefaultDate(type: BoxType): string {
  const d = new Date();
  if (type === "daily") {
    d.setDate(d.getDate() - 1);
    return toYYYYMMDD(d);
  } else if (type === "weekly") {
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff - 7);
    return toYYYYMMDD(d);
  } else {
    d.setMonth(d.getMonth() - 1);
    return toYYYYMM(d);
  }
}

function navigateDate(date: string, type: BoxType, dir: -1 | 1): string {
  if (type === "monthly") {
    const d = new Date(parseInt(date.slice(0, 4)), parseInt(date.slice(4, 6)) - 1 + dir);
    return toYYYYMM(d);
  }
  const d = new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`);
  d.setDate(d.getDate() + dir * (type === "weekly" ? 7 : 1));
  return toYYYYMMDD(d);
}

function isDateTooRecent(date: string, type: BoxType): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (type === "monthly") {
    const year = parseInt(date.slice(0, 4));
    const month = parseInt(date.slice(4, 6)) - 1;
    return year === today.getFullYear() && month === today.getMonth();
  }
  const d = new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`);
  d.setHours(0, 0, 0, 0);
  if (type === "daily") {
    return d >= today;
  }
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - diff);
  return d >= thisMonday;
}

function formatDisplay(date: string, type: BoxType): string {
  if (type === "monthly") {
    if (date.length !== 6) return date;
    return `${date.slice(0, 4)}.${date.slice(4, 6)}`;
  }
  if (!date || date.length !== 8) return date;
  return `${date.slice(0, 4)}.${date.slice(4, 6)}.${date.slice(6, 8)}`;
}

function RankBadge({ change, isNew }: { change: number; isNew: boolean }) {
  if (isNew) return <span className="text-[10px] font-bold text-yellow-400 leading-none">NEW</span>;
  if (change > 0)
    return (
      <span className="flex items-center gap-px text-[10px] text-emerald-400 leading-none font-medium">
        <TrendingUp className="w-2.5 h-2.5" />{change}
      </span>
    );
  if (change < 0)
    return (
      <span className="flex items-center gap-px text-[10px] text-red-400 leading-none font-medium">
        <TrendingDown className="w-2.5 h-2.5" />{Math.abs(change)}
      </span>
    );
  return <Minus className="w-3 h-3 text-slate-600" />;
}

const PAGE_SIZE = 25;

export default function Boxoffice() {
  const { t } = useLanguage();
  const [type, setType] = useState<BoxType>("daily");
  const [targetDt, setTargetDt] = useState<string>(() => getDefaultDate("daily"));
  const [listPage, setListPage] = useState(1);

  const { data, isLoading, isError } = useQuery<BoxofficeData>({
    queryKey: ["boxoffice", type, targetDt],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-boxoffice", {
        body: { type, targetDt },
      });
      if (error) throw error;
      return data as BoxofficeData;
    },
    staleTime: 0,
  });

  function handleTypeChange(next: BoxType) {
    setType(next);
    setTargetDt(getDefaultDate(next));
    setListPage(1);
  }

  const canGoForward = !isDateTooRecent(navigateDate(targetDt, type, 1), type);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-100">
          🎬 {t("박스오피스", "Box Office")}
        </h1>
        <p className="text-xs text-slate-500 pt-1.5 text-right">
          {t("출처: KOBIS 영화관입장권통합전산망", "Source: KOBIS")}
        </p>
      </div>

      {/* 탭 + 날짜 네비게이션 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
          {(["daily", "weekly", "monthly"] as BoxType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTypeChange(tab)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                type === tab
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {tab === "daily" ? t("일별", "Daily") : tab === "weekly" ? t("주간", "Weekly") : t("월간", "Monthly")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTargetDt((d) => navigateDate(d, type, -1))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label={t("이전", "Previous")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-300 min-w-[92px] text-center tabular-nums">
            {formatDisplay(targetDt, type)}
          </span>
          <button
            onClick={() => setTargetDt((d) => navigateDate(d, type, 1))}
            disabled={!canGoForward}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              canGoForward
                ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                : "bg-slate-800/40 text-slate-700 cursor-not-allowed"
            )}
            aria-label={t("다음", "Next")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 조회 기간 */}
      {data?.showRange && (
        <p className="text-xs text-slate-500">
          {t("조회 기간", "Period")}: {data.showRange}
        </p>
      )}

      {/* 로딩 */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-slate-800 rounded-xl" />
              <div className="mt-2 space-y-1.5">
                <div className="h-3.5 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 에러 */}
      {isError && <EmptyState type="error" />}

      {/* 결과 없음 */}
      {!isLoading && !isError && data?.list.length === 0 && (
        <EmptyState type="search" />
      )}

      {/* 순위 목록 */}
      {!isLoading && !isError && data && data.list.length > 0 && (() => {
        const totalPages = Math.ceil(data.list.length / PAGE_SIZE);
        const pageItems  = data.list.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);
        return (
        <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pageItems.map((entry) => {
            const poster = posterUrl(entry.poster_path, "w342");
            const card = (
              <div className="group">
                <div className="relative aspect-[2/3] bg-slate-800 rounded-xl overflow-hidden">
                  {poster ? (
                    <img
                      src={poster}
                      alt={entry.movieNm}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🎬</div>
                  )}
                  {/* 순위 오버레이 */}
                  <div className="absolute top-2 left-2 flex flex-col items-start gap-0.5">
                    <span className={cn(
                      "text-lg font-black leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]",
                      entry.rank === 1 ? "text-yellow-400" :
                      entry.rank === 2 ? "text-slate-200" :
                      entry.rank === 3 ? "text-amber-500" :
                      "text-white"
                    )}>
                      #{entry.rank}
                    </span>
                    <RankBadge change={entry.rankChange} isNew={entry.isNew} />
                  </div>
                </div>
                <div className="mt-2 px-0.5">
                  <p className="text-sm font-medium text-slate-100 truncate">{entry.movieNm}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {entry.audiCnt.toLocaleString()}{t("명", "")}
                  </p>
                </div>
              </div>
            );

            return entry.tmdbId ? (
              <Link key={entry.movieCd} to={`/movie/${entry.tmdbId}`}>{card}</Link>
            ) : (
              <div key={entry.movieCd}>{card}</div>
            );
          })}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 pt-4 flex-wrap">
            <button
              onClick={() => setListPage(1)} disabled={listPage === 1}
              className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >«</button>
            <button
              onClick={() => setListPage(p => Math.max(1, p - 1))} disabled={listPage === 1}
              className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p} onClick={() => setListPage(p)}
                className={cn("px-3 py-1.5 text-sm rounded-md transition-colors",
                  p === listPage ? "bg-blue-600 text-white font-medium" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >{p}</button>
            ))}
            <button
              onClick={() => setListPage(p => Math.min(totalPages, p + 1))} disabled={listPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >›</button>
            <button
              onClick={() => setListPage(totalPages)} disabled={listPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-md bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >»</button>
          </div>
        )}
        </>
        );
      })()}
    </div>
  );
}
