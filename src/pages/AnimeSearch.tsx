import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Anime } from "@/types/anime";
import AnimeCard from "@/components/anime/AnimeCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

export default function AnimeSearch() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const query    = params.get("q") ?? "";
  const genres   = params.get("genres") ?? "";
  const status   = params.get("status") ?? "";
  const yearFrom = params.get("year_from") ?? "";
  const yearTo   = params.get("year_to") ?? "";
  const minScore = params.get("min_score") ?? "";
  const orderBy  = params.get("order_by") ?? "";

  const hasFilter = !!(genres || status || yearFrom || yearTo || minScore || orderBy);
  const enabled = !!query || hasFilter;

  const { data, isLoading, isError } = useQuery<Anime[]>({
    queryKey: ["anime-search", query, genres, status, yearFrom, yearTo, minScore, orderBy],
    queryFn: async () => {
      const body: Record<string, string> = {};
      if (query)    body.query     = query;
      if (genres)   body.genres    = genres;
      if (status)   body.status    = status;
      if (yearFrom) body.year_from = yearFrom;
      if (yearTo)   body.year_to   = yearTo;
      if (minScore) body.min_score = minScore;
      if (orderBy)  body.order_by  = orderBy;
      const { data, error } = await supabase.functions.invoke("search-anime", { body });
      if (error) throw error;
      return (data.data as Anime[]) ?? [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const title = query
    ? t(`"${query}" 검색 결과`, `Search results for "${query}"`)
    : hasFilter
      ? t("필터 검색 결과", "Filtered Results")
      : t("애니 검색", "Anime Search");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold text-slate-100">{title}</h1>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {enabled && isError && <EmptyState type="error" />}
      {!enabled && <EmptyState type="search" />}
      {enabled && !isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState type="search" />
      )}
      {enabled && !isLoading && !isError && data && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.map((anime) => <AnimeCard key={anime.mal_id} anime={anime} />)}
        </div>
      )}
    </div>
  );
}
