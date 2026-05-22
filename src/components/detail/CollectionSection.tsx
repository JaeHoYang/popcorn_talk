import { Link } from "react-router-dom";
import { Library } from "lucide-react";
import { Collection } from "@/types/detail";
import { posterUrl, formatYear } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  collection: Collection;
  currentMovieId: number;
}

export default function CollectionSection({ collection, currentMovieId }: Props) {
  const { t } = useLanguage();
  const others = collection.parts.filter((p) => p.id !== currentMovieId);
  if (others.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
        <Library className="w-5 h-5 text-purple-400" />
        {t("시리즈", "Series")}: {collection.name}
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {others.map((part) => (
          <Link
            key={part.id}
            to={`/movie/${part.id}`}
            className="shrink-0 w-28 group"
          >
            <div className="aspect-[2/3] bg-slate-700 rounded-lg overflow-hidden mb-2">
              {posterUrl(part.poster_path) ? (
                <img
                  src={posterUrl(part.poster_path)!}
                  alt={part.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
              )}
            </div>
            <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-tight">{part.title}</p>
            <p className="text-xs text-slate-500">{formatYear(part.release_date)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
