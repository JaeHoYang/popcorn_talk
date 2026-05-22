import { Link } from "react-router-dom";
import { Drama } from "@/types/drama";
import { useLanguage } from "@/contexts/LanguageContext";

const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

interface Props {
  dramas: Drama[];
}

export default function SimilarDramas({ dramas }: Props) {
  const { t } = useLanguage();
  const visible = dramas.filter((d) => d.poster_path);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-100 mb-3">
        {t("이런 드라마는 어떠세요?", "You Might Also Like")}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {visible.slice(0, 6).map((d) => (
          <Link key={d.id} to={`/drama/${d.id}`} className="group block">
            <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden">
              <img
                src={`${TMDB_IMG}${d.poster_path}`}
                alt={d.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 group-hover:text-blue-400 transition-colors">
              {d.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
