import { Link } from "react-router-dom";
import { Anime } from "@/types/anime";
import { cn } from "@/lib/utils";

interface Props {
  anime: Anime;
  className?: string;
}

const STATUS_LABEL: Record<string, { ko: string; color: string }> = {
  "Currently Airing": { ko: "방영중", color: "text-green-400" },
  "Finished Airing":  { ko: "완결",   color: "text-slate-400" },
  "Not yet aired":    { ko: "미방영", color: "text-yellow-400" },
};

export default function AnimeCard({ anime, className }: Props) {
  const poster = anime.images.jpg.large_image_url || anime.images.jpg.image_url;
  const status = STATUS_LABEL[anime.status] ?? { ko: anime.status, color: "text-slate-400" };

  return (
    <Link to={`/anime/${anime.mal_id}`} className={cn("group block", className)}>
      <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden relative">
        {poster ? (
          <img
            src={poster}
            alt={anime.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">✨</div>
        )}
        {anime.score && (
          <div className="absolute top-1.5 right-1.5 bg-black/70 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded">
            ★ {anime.score.toFixed(1)}
          </div>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-medium text-slate-100 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {anime.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={status.color}>{status.ko}</span>
          {anime.episodes && <span>· {anime.episodes}화</span>}
          {anime.year && <span>· {anime.year}</span>}
        </div>
      </div>
    </Link>
  );
}
