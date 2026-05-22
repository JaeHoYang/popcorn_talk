import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PersonDetail } from "@/types/detail";

export function usePersonDetail(personId: string, uiLanguage: string) {
  return useQuery<PersonDetail>({
    queryKey: ["person-detail", personId, uiLanguage],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-person-detail", {
        body: { person_id: Number(personId), language: uiLanguage },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as PersonDetail;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!personId,
  });
}
