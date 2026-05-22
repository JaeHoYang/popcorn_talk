import { useCallback, useEffect, useState } from "react";
import { Anime } from "@/types/anime";

const STORAGE_KEY = "wishlist-anime";
export const ANIME_WISHLIST_EVENT = "anime-wishlist-change";

function readStorage(): Anime[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useAnimeWishlist(anime?: Pick<Anime, "mal_id" | "title" | "images">) {
  const [wishlist, setWishlist] = useState<Anime[]>(readStorage);

  useEffect(() => {
    const handler = () => setWishlist(readStorage());
    window.addEventListener(ANIME_WISHLIST_EVENT, handler);
    return () => window.removeEventListener(ANIME_WISHLIST_EVENT, handler);
  }, []);

  const isWishlisted = anime ? wishlist.some((a) => a.mal_id === anime.mal_id) : false;

  const toggle = useCallback(() => {
    if (!anime) return;
    const current = readStorage();
    const next = current.some((a) => a.mal_id === anime.mal_id)
      ? current.filter((a) => a.mal_id !== anime.mal_id)
      : [...current, anime as Anime];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(ANIME_WISHLIST_EVENT));
  }, [anime]);

  return { isWishlisted, toggle, wishlist };
}
