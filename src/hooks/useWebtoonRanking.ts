import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Webtoon } from "@/types/webtoon";

interface RankingResponse {
  data: Webtoon[];
  pagination: {
    current_page: number;
    last_page: number;
    has_next_page: boolean;
    total: number;
  };
}

export function useWebtoonRanking(filter: string, page: number, order: "asc" | "desc" = "desc") {
  return useQuery<RankingResponse>({
    queryKey: ["webtoon-ranking", filter, page, order],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-webtoon-ranking", {
        body: { filter, page, order },
      });
      if (error) throw error;
      return data as RankingResponse;
    },
    staleTime: 60 * 60 * 1000,
  });
}
