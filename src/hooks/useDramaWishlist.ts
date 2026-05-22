import { useCallback, useEffect, useState } from "react";
import { Drama } from "@/types/drama";

const STORAGE_KEY = "wishlist-drama";
export const DRAMA_WISHLIST_EVENT = "drama-wishlist-change";

function readStorage(): Drama[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useDramaWishlist(drama?: Pick<Drama, "id" | "name" | "poster_path">) {
  const [wishlist, setWishlist] = useState<Drama[]>(readStorage);

  useEffect(() => {
    const handler = () => setWishlist(readStorage());
    window.addEventListener(DRAMA_WISHLIST_EVENT, handler);
    return () => window.removeEventListener(DRAMA_WISHLIST_EVENT, handler);
  }, []);

  const isWishlisted = drama ? wishlist.some((d) => d.id === drama.id) : false;

  const toggle = useCallback(() => {
    if (!drama) return;
    const current = readStorage();
    const next = current.some((d) => d.id === drama.id)
      ? current.filter((d) => d.id !== drama.id)
      : [...current, drama as Drama];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(DRAMA_WISHLIST_EVENT));
  }, [drama]);

  return { isWishlisted, toggle, wishlist };
}
