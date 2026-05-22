import { Link } from "react-router-dom";
import { Drama, DRAMA_COUNTRIES } from "@/types/drama";
import { cn } from "@/lib/utils";

const TMDB_IMG = "https://image.tmdb.org/t/p/w300";

const COUNTRY_KO: Record<string, string> = Object.fromEntries(
  DRAMA_COUNTRIES.filter((c) => c.code !== "ALL").map((c) => [c.code, c.ko])
);

interface Props {
  drama: Drama;
  className?: string;
}

export default function DramaCard({ drama, className }: Props) {
  const poster = drama.poster_path ? `${TMDB_IMG}${drama.poster_path}` : null;
  const year = drama.first_air_date?.slice(0, 4);

  return (
    <Link to={`/drama/${drama.id}`} className={cn("group block", className)}>
      <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden relative">
        {poster ? (
          <img
            src={poster}
            alt={drama.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">📺</div>
        )}
        {drama.vote_average > 0 && (
          <div className="absolute top-1.5 right-1.5 bg-black/70 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded">
            ★ {drama.vote_average.toFixed(1)}
          </div>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-medium text-slate-100 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {drama.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {year && <span>{year}</span>}
          {drama.origin_country?.[0] && (
            <span>· {COUNTRY_KO[drama.origin_country[0]] ?? drama.origin_country[0]}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
