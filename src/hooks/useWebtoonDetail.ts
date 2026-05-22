import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { WebtoonDetail } from "@/types/webtoon";

export function useWebtoonDetail(id: string) {
  return useQuery<WebtoonDetail>({
    queryKey: ["webtoon-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-webtoon-detail", {
        body: { id },
      });
      if (error) throw error;
      return data as WebtoonDetail;
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!id,
  });
}
