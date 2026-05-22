import { useState, useEffect } from "react";

export interface AutocompleteSuggestion {
  id: number;
  title: string;
  cover: string;
  status: string;
}

const QUERY = `
query($search: String!) {
  Page(page: 1, perPage: 7) {
    media(search: $search, countryOfOrigin: KR, type: MANGA, isAdult: false, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
      id
      title { native romaji }
      coverImage { medium }
      status
    }
  }
}`;

export function useWebtoonAutocomplete(input: string) {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (input.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: QUERY, variables: { search: input.trim() } }),
        });
        const json = await res.json();
        const media: { id: number; title: { native?: string; romaji?: string }; coverImage?: { medium?: string }; status?: string }[] =
          json.data?.Page?.media ?? [];
        setSuggestions(media.map((m) => ({
          id: m.id,
          title: m.title?.native || m.title?.romaji || "",
          cover: m.coverImage?.medium || "",
          status: m.status || "",
        })));
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
