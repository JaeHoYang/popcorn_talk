import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MovieDetail } from "@/types/detail";

export function useMovieDetail(movieId: string, uiLanguage: string) {
  return useQuery<MovieDetail>({
    queryKey: ["movie-detail", movieId, uiLanguage],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-movie-detail", {
        body: { movie_id: Number(movieId), language: uiLanguage },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as MovieDetail;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!movieId,
  });
}
