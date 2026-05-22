import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Webtoon } from "@/types/webtoon";
import { cn } from "@/lib/utils";
import WebtoonCard from "@/components/webtoon/WebtoonCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";

interface GenreResponse {
  data: Webtoon[];
  pagination: {
    current_page: number;
    last_page: number;
    has_next_page: boolean;
  };
}

export default function WebtoonGenre() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tagId = searchParams.get("tagId") ?? "";
  const label = searchParams.get("label") ?? "장르";
  const page  = Math.max(1, Number(searchParams.get("page")) || 1);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [page]);

  const { data, isLoading, isError } = useQuery<GenreResponse>({
    queryKey: ["webtoon-genre", tagId, page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("search-webtoon", {
        body: { tagId, page },
      });
      if (error) throw error;
      return data as GenreResponse;
    },
    enabled: !!tagId,
    staleTime: 10 * 60 * 1000,
  });

  const totalPages = data?.pagination?.last_page ?? 1;

  function goPage(p: number) {
    navigate(`/webtoon/genre?tagId=${tagId}&label=${encodeURIComponent(label)}&page=${p}`);
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
        <h1 className="text-2xl font-bold text-slate-100">{label}</h1>
        {data && (
          <p className="text-sm text-slate-400">{page} / {totalPages} 페이지</p>
        )}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {isError && <EmptyState type="error" />}
      {!isLoading && !isError && data?.data?.length === 0 && <EmptyState type="search" />}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.data.map((w) => <WebtoonCard key={w.id} webtoon={w} />)}
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
