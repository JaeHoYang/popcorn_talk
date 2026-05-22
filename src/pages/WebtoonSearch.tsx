import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Webtoon } from "@/types/webtoon";
import WebtoonCard from "@/components/webtoon/WebtoonCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

export default function WebtoonSearch() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const query  = params.get("q") ?? "";
  const genre  = params.get("genre") ?? "";
  const status = params.get("status") ?? "";

  const enabled = !!(query || genre || status);

  const { data, isLoading, isError } = useQuery<Webtoon[]>({
    queryKey: ["webtoon-search", query, genre, status],
    queryFn: async () => {
      const body: Record<string, string> = {};
      if (query)  body.query  = query;
      if (genre)  body.genre  = genre;
      if (status) body.status = status;
      const { data, error } = await supabase.functions.invoke("search-webtoon", { body });
      if (error) throw error;
      return (data.data as Webtoon[]) ?? [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const title = query
    ? t(`"${query}" 검색 결과`, `Search results for "${query}"`)
    : t("웹툰 검색", "Webtoon Search");

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
      {enabled && !isLoading && !isError && (!data || data.length === 0) && <EmptyState type="search" />}
      {enabled && !isLoading && !isError && data && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.map((w) => <WebtoonCard key={w.id} webtoon={w} />)}
        </div>
      )}
    </div>
  );
}
