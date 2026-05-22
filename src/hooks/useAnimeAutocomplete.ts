import { useState, useEffect } from "react";

export interface AnimeAutocompleteSuggestion {
  id: number;
  title: string;
  titleJp: string;
  cover: string;
  status: string;
  episodes: number | null;
}

const STATUS_MAP: Record<string, { ko: string; color: string }> = {
  "Currently Airing": { ko: "방영중", color: "text-blue-400" },
  "Finished Airing":  { ko: "완결",   color: "text-slate-400" },
  "Not yet aired":    { ko: "방영예정", color: "text-yellow-400" },
};

export { STATUS_MAP as ANIME_STATUS_LABEL };

export function useAnimeAutocomplete(input: string) {
  const [suggestions, setSuggestions] = useState<AnimeAutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (input.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(input.trim())}&limit=7&sfw=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Jikan error");
        const json = await res.json();
        setSuggestions(
          (json.data ?? []).map((a: {
            mal_id: number;
            title: string;
            title_japanese?: string;
            images?: { jpg?: { image_url?: string } };
            status?: string;
            episodes?: number | null;
          }) => ({
            id: a.mal_id,
            title: a.title,
            titleJp: a.title_japanese || "",
            cover: a.images?.jpg?.image_url || "",
            status: a.status || "",
            episodes: a.episodes ?? null,
          }))
        );
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [input]);

  return { suggestions, isLoading };
}
