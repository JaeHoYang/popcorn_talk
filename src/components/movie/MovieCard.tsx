import { Link } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { cn, posterUrl, formatYear } from "@/lib/utils";
import { Movie } from "@/types/movie";
import { useWishlist } from "@/hooks/useWishlist";

interface MovieCardProps {
  movie: Movie;
  className?: string;
}

export default function MovieCard({ movie, className }: MovieCardProps) {
  const { isWishlisted, toggle } = useWishlist(movie);
  const poster = posterUrl(movie.poster_path, "w300");

  return (
    <div className={cn("group relative rounded-lg overflow-hidden bg-slate-800 transition-transform hover:-translate-y-1", className)}>
      <Link to={`/movie/${movie.id}`}>
        <div className="aspect-[2/3] bg-slate-700 overflow-hidden">
          {poster ? (
            <img
              src={poster}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-4xl">
              🎬
            </div>
          )}
        </div>
      </Link>

      <button
        onClick={toggle}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
        aria-label={isWishlisted ? "위시리스트에서 제거" : "위시리스트에 추가"}
      >
        <Heart className={cn("w-4 h-4 transition-colors", isWishlisted ? "fill-red-500 text-red-500" : "text-white")} />
      </button>

      <Link to={`/movie/${movie.id}`}>
        <div className="p-3">
          <h3 className="text-sm font-medium text-slate-100 line-clamp-2 leading-tight">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-400">{formatYear(movie.release_date)}</span>
            {movie.vote_average > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                <Star className="w-3 h-3 fill-yellow-400" />
                {movie.vote_average.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
