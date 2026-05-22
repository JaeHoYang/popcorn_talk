import { useCallback, useEffect, useState } from "react";
import { Webtoon } from "@/types/webtoon";

const STORAGE_KEY = "wishlist-webtoon";
export const WEBTOON_WISHLIST_EVENT = "webtoon-wishlist-change";

function readStorage(): Webtoon[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function useWebtoonWishlist(webtoon?: Pick<Webtoon, "id" | "title" | "cover_url">) {
  const [wishlist, setWishlist] = useState<Webtoon[]>(readStorage);

  useEffect(() => {
    const handler = () => setWishlist(readStorage());
    window.addEventListener(WEBTOON_WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WEBTOON_WISHLIST_EVENT, handler);
  }, []);

  const isWishlisted = webtoon ? wishlist.some((w) => w.id === webtoon.id) : false;

  const toggle = useCallback(() => {
    if (!webtoon) return;
    const current = readStorage();
    const next = current.some((w) => w.id === webtoon.id)
      ? current.filter((w) => w.id !== webtoon.id)
      : [...current, webtoon as Webtoon];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(WEBTOON_WISHLIST_EVENT));
  }, [webtoon]);

  return { isWishlisted, toggle, wishlist };
}
