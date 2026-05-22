import { useLanguage } from "@/contexts/LanguageContext";
import { DramaDetail } from "@/types/drama";

const TMDB_IMG = "https://image.tmdb.org/t/p/w185";

interface Props {
  seasons: DramaDetail["seasons"];
}

export default function SeasonList({ seasons }: Props) {
  const { t } = useLanguage();
  const visible = seasons.filter((s) => s.season_number > 0);
  if (visible.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-100 mb-3">{t("시즌", "Seasons")}</h2>
      <div className="space-y-2">
        {visible.map((s) => (
          <div key={s.id} className="flex gap-3 bg-slate-800/50 rounded-lg p-3 items-start">
            {s.poster_path ? (
              <img
                src={`${TMDB_IMG}${s.poster_path}`}
                alt={s.name}
                className="w-12 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center text-xl flex-shrink-0">📺</div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-100">{s.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {s.episode_count}{t("화", " eps")}
                {s.air_date && <span> · {s.air_date.slice(0, 4)}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
