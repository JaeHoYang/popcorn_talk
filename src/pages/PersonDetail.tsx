import { useParams, Link } from "react-router-dom";
import { User, Calendar, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePersonDetail } from "@/hooks/usePersonDetail";
import { posterUrl, formatYear } from "@/lib/utils";
import EmptyState from "@/components/common/EmptyState";

function PersonSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-6">
      <div className="flex gap-6">
        <div className="w-32 h-32 rounded-full bg-slate-800 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-8 bg-slate-800 rounded w-1/2" />
          <div className="h-4 bg-slate-800 rounded w-1/3" />
          <div className="h-4 bg-slate-800 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const { uiLanguage, t } = useLanguage();
  const { data, isLoading, isError } = usePersonDetail(id!, uiLanguage);

  if (isLoading) return <PersonSkeleton />;
  if (isError || !data) return <EmptyState type="error" className="min-h-[50vh]" />;

  const profileImg = posterUrl(data.profile_path, "w342");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* 프로필 헤더 */}
      <section className="flex gap-6">
        <div className="shrink-0">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-slate-700">
            {profileImg ? (
              <img src={profileImg} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <User className="w-12 h-12" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">{data.name}</h1>
          <p className="text-sm text-blue-400">{t(
            data.known_for_department === "Acting" ? "배우" : "감독/스태프",
            data.known_for_department
          )}</p>

          <div className="space-y-1 text-sm text-slate-400">
            {data.birthday && (
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {data.birthday}
                {data.deathday && ` ~ ${data.deathday}`}
              </p>
            )}
            {data.place_of_birth && (
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {data.place_of_birth}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 소개 */}
      {data.biography && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("소개", "Biography")}</h2>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{data.biography}</p>
        </section>
      )}

      {/* 필모그래피 */}
      {data.filmography.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-4">
            {t("필모그래피", "Filmography")}
            <span className="text-sm text-slate-500 font-normal ml-2">({data.filmography.length})</span>
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {data.filmography.map((film) => (
              <Link key={`${film.id}-${film.role}`} to={`/movie/${film.id}`} className="group">
                <div className="aspect-[2/3] bg-slate-700 rounded-lg overflow-hidden mb-2">
                  {posterUrl(film.poster_path) ? (
                    <img
                      src={posterUrl(film.poster_path)!}
                      alt={film.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-tight">{film.title}</p>
                <p className="text-xs text-slate-500">{formatYear(film.release_date)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
