import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Drama } from "@/types/drama";
import DramaCard from "@/components/drama/DramaCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

export default function DramaSearch() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const query = params.get("q") ?? "";

  const { data, isLoading, isError } = useQuery<{ results: Drama[] }>({
    queryKey: ["drama-search", query],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("search-drama", {
        body: { query },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!query.trim(),
    staleTime: 5 * 60 * 1000,
  });

  const title = query
    ? t(`"${query}" 검색 결과`, `Search results for "${query}"`)
    : t("드라마 검색", "Drama Search");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-xl font-bold text-slate-100">{title}</h1>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {!!query && isError && <EmptyState type="error" />}
      {!query && <EmptyState type="search" />}
      {!!query && !isLoading && !isError && (!data?.results || data.results.length === 0) && (
        <EmptyState type="search" />
      )}
      {!!query && !isLoading && !isError && data?.results && data.results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.results.map((d) => <DramaCard key={d.id} drama={d} />)}
        </div>
      )}
    </div>
  );
}
