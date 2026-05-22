import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { DramaDetail } from "@/types/drama";

export function useDramaDetail(id: string) {
  return useQuery<DramaDetail>({
    queryKey: ["drama-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-drama-detail", {
        body: { id: Number(id) },
      });
      if (error) throw error;
      return data as DramaDetail;
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!id,
  });
}
