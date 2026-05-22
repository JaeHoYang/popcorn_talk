import { Link } from "react-router-dom";
import { AnimeRecommendation } from "@/types/anime";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  recommendations: AnimeRecommendation[];
}

export default function SimilarAnime({ recommendations }: Props) {
  const { t } = useLanguage();
  if (recommendations.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-100 mb-3">
        {t("이런 애니는 어떠세요?", "You Might Also Like")}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {recommendations.slice(0, 6).map((rec) => (
          <Link key={rec.entry.mal_id} to={`/anime/${rec.entry.mal_id}`} className="group block">
            <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden">
              <img
                src={rec.entry.images.jpg.large_image_url}
                alt={rec.entry.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 group-hover:text-blue-400 transition-colors">
              {rec.entry.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
