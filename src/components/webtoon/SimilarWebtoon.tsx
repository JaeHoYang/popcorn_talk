import { Link } from "react-router-dom";
import { Webtoon } from "@/types/webtoon";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  similar: Webtoon[];
  title?: string;
}

export default function SimilarWebtoon({ similar, title }: Props) {
  const { t } = useLanguage();
  if (similar.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-100 mb-3">
        {title ?? t("이런 웹툰은 어떠세요?", "You Might Also Like")}
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {similar.slice(0, 6).map((w) => (
          <Link key={w.id} to={`/webtoon/${w.id}`} className="group block">
            <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden">
              {w.cover_url ? (
                <img
                  src={w.cover_url}
                  alt={w.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 group-hover:text-green-400 transition-colors">
              {w.title}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
