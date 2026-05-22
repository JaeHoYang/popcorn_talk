import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AnimeDetail } from "@/types/anime";

export function useAnimeDetail(malId: string) {
  return useQuery<AnimeDetail>({
    queryKey: ["anime-detail", malId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-anime-detail", {
        body: { mal_id: Number(malId) },
      });
      if (error) throw error;
      return data as AnimeDetail;
    },
    staleTime: 24 * 60 * 60 * 1000,
    enabled: !!malId,
  });
}
