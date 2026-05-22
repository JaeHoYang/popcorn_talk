import { useCallback, useEffect, useState } from "react";
import { Movie } from "@/types/movie";

const STORAGE_KEY = "wishlist";
export const WISHLIST_EVENT = "wishlist-change";

function readStorage(): Movie[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useWishlist(movie?: Movie) {
  const [wishlist, setWishlist] = useState<Movie[]>(readStorage);

  useEffect(() => {
    const handler = () => setWishlist(readStorage());
    window.addEventListener(WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WISHLIST_EVENT, handler);
  }, []);

  const isWishlisted = movie ? wishlist.some((m) => m.id === movie.id) : false;

  const toggle = useCallback(() => {
    if (!movie) return;
    const current = readStorage();
    const next = current.some((m) => m.id === movie.id)
      ? current.filter((m) => m.id !== movie.id)
      : [...current, movie];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  }, [movie]);

  return { isWishlisted, toggle, wishlist };
}
