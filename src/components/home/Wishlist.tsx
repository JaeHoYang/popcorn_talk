import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Movie } from "@/types/movie";
import MovieCard from "@/components/movie/MovieCard";
import { WISHLIST_EVENT } from "@/hooks/useWishlist";

function readWishlist(): Movie[] {
  try { return JSON.parse(localStorage.getItem("wishlist") ?? "[]"); }
  catch { return []; }
}

export default function Wishlist() {
  const [wishlist, setWishlist] = useState<Movie[]>(readWishlist);
  const { t } = useLanguage();

  useEffect(() => {
    const handler = () => setWishlist(readWishlist());
    window.addEventListener(WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WISHLIST_EVENT, handler);
  }, []);

  if (wishlist.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-red-400 fill-red-400" />
        <h2 className="text-xl font-bold text-slate-100">{t("위시리스트", "Wishlist")}</h2>
        <span className="text-sm text-slate-400">({wishlist.length})</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {wishlist.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      </div>
    </section>
  );
}
