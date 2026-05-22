import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDramaDetail } from "@/hooks/useDramaDetail";
import { useLogEvent } from "@/hooks/useLogEvent";
import { useDramaWishlist } from "@/hooks/useDramaWishlist";
import { cn } from "@/lib/utils";
import { Trailer } from "@/types/detail";
import { DRAMA_STATUS_MAP } from "@/types/drama";
import TrailerPlayer from "@/components/detail/TrailerPlayer";
import WatchProviderSection from "@/components/detail/WatchProviderSection";
import SentimentPanel from "@/components/sentiment/SentimentPanel";
import SimilarDramas from "@/components/drama/SimilarDramas";
import SeasonList from "@/components/drama/SeasonList";
import EmptyState from "@/components/common/EmptyState";
import ShareButton from "@/components/common/ShareButton";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";
const PROFILE_IMG = "https://image.tmdb.org/t/p/w185";

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="aspect-video bg-slate-800 rounded-xl" />
      <div className="flex gap-6">
        <div className="w-40 aspect-[2/3] bg-slate-800 rounded-lg shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-8 bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
          <div className="h-4 bg-slate-800 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

export default function DramaDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { data, isLoading, isError } = useDramaDetail(id!);
  const { logDrama } = useLogEvent();
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const { isWishlisted, toggle: toggleWishlist } = useDramaWishlist(
    data ? { id: data.id, name: data.name, poster_path: data.poster_path } : undefined
  );

  useEffect(() => {
    if (data) {
      const poster = data.poster_path ? `${TMDB_IMG}${data.poster_path}` : null;
      logDrama(data.id, data.name, poster);
    }
  }, [data?.id]);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) return <EmptyState type="error" className="min-h-[50vh]" />;

  const poster = data.poster_path ? `${TMDB_IMG}${data.poster_path}` : null;
  const backdrop = data.backdrop_path ? `${TMDB_BACKDROP}${data.backdrop_path}` : null;
  const statusInfo = DRAMA_STATUS_MAP[data.status];
  const LONG_OVERVIEW = (data.overview ?? "").length > 200;

  const trailers: Trailer[] = data.trailer_key
    ? [{ key: data.trailer_key, name: "Trailer", type: "Trailer", site: "YouTube" }]
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* 1. 트레일러 */}
      {trailers.length > 0 && <TrailerPlayer trailers={trailers} />}

      {/* 2. 포스터 + 기본 정보 */}
      <section className="flex gap-6">
        <div className="shrink-0 w-32 sm:w-44">
          <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden">
            {poster ? (
              <img src={poster} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">📺</div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">{data.name}</h1>
              {data.original_name !== data.name && (
                <p className="text-sm text-slate-400 mt-0.5">{data.original_name}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ShareButton
                title={data.name}
                description={data.overview?.slice(0, 80)}
                imageUrl={poster ?? undefined}
              />
              <button
                onClick={toggleWishlist}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Heart className={cn("w-5 h-5", isWishlisted ? "fill-red-500 text-red-500" : "text-slate-400")} />
              </button>
            </div>
          </div>

          {/* 장르 배지 */}
          <div className="flex flex-wrap gap-1.5">
            {data.genres.map((g) => (
              <span key={g.id} className="px-2.5 py-1 text-xs bg-slate-700 text-slate-300 rounded-full">
                {g.name}
              </span>
            ))}
          </div>

          {/* 메타 정보 */}
          <div className="text-sm text-slate-400 space-y-1">
            {statusInfo && (
              <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700", statusInfo.color)}>
                {t(statusInfo.ko, data.status)}
              </span>
            )}
            {data.first_air_date && <p>📅 {data.first_air_date.slice(0, 4)} {t("첫 방영", "First aired")}</p>}
            {data.number_of_seasons > 0 && (
              <p>📺 {data.number_of_seasons}{t("시즌", " seasons")} · {data.number_of_episodes}{t("화", " eps")}</p>
            )}
            {data.episode_run_time?.length > 0 && (
              <p>⏱️ {data.episode_run_time[0]}{t("분", " min")}</p>
            )}
            {data.networks?.length > 0 && (
              <p>📡 {data.networks.map((n) => n.name).join(", ")}</p>
            )}
            {data.origin_country?.length > 0 && (
              <p>🌍 {data.origin_country.join(", ")}</p>
            )}
          </div>
        </div>
      </section>

      {/* 3. 평점 */}
      {data.vote_average > 0 && (
        <section className="flex flex-wrap gap-4">
          <div className="bg-slate-800 rounded-xl px-5 py-3 text-center">
            <p className="text-xs text-slate-400 mb-0.5">TMDB 평점</p>
            <p className="text-2xl font-bold text-yellow-400">★ {data.vote_average.toFixed(2)}</p>
          </div>
          {data.vote_count > 0 && (
            <div className="bg-slate-800 rounded-xl px-5 py-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">{t("평가 수", "Votes")}</p>
              <p className="text-2xl font-bold text-slate-300">{data.vote_count.toLocaleString()}</p>
            </div>
          )}
        </section>
      )}

      {/* 4. 줄거리 */}
      {data.overview && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("줄거리", "Overview")}</h2>
          <p className={cn("text-sm text-slate-300 leading-relaxed", !synopsisExpanded && LONG_OVERVIEW && "line-clamp-4")}>
            {data.overview}
          </p>
          {LONG_OVERVIEW && (
            <button
              onClick={() => setSynopsisExpanded((e) => !e)}
              className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              {synopsisExpanded ? (
                <><ChevronUp className="w-3.5 h-3.5" />{t("접기", "Show Less")}</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" />{t("더 보기", "Show More")}</>
              )}
            </button>
          )}
        </section>
      )}

      {/* 5. 출연진 */}
      {data.credits.cast.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-3">{t("출연진", "Cast")}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.credits.cast.slice(0, 10).map((c) => (
              <div key={c.id} className="shrink-0 w-20">
                <div className="w-20 h-20 rounded-full bg-slate-800 overflow-hidden">
                  {c.profile_path ? (
                    <img src={`${PROFILE_IMG}${c.profile_path}`} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-center text-slate-300 line-clamp-1">{c.name}</p>
                <p className="text-xs text-center text-slate-500 line-clamp-1">{c.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. OTT 정보 */}
      <WatchProviderSection
        providers={data.watch_providers ?? null}
        isNowPlaying={false}
        movieTitle={data.name}
      />

      {/* 7. 시즌 목록 */}
      {data.seasons?.length > 0 && <SeasonList seasons={data.seasons} />}

      {/* 8. 유사 드라마 */}
      {data.similar?.length > 0 && <SimilarDramas dramas={data.similar} />}

      {/* 9. AI 리뷰 분석 */}
      <SentimentPanel key={data.id} movieId={data.id} movieTitle={data.name} type="drama" />

      {/* 10. OST 링크 */}
      <section>
        <h2 className="text-lg font-bold text-slate-100 mb-3">{t("OST 듣기", "Listen to OST")}</h2>
        <div className="flex gap-3">
          <a
            href={`https://music.youtube.com/search?q=${encodeURIComponent(data.name + " OST")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
          >
            ▶ YouTube Music
          </a>
          <a
            href={`https://open.spotify.com/search/${encodeURIComponent(data.name + " OST")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors"
          >
            ♪ Spotify
          </a>
        </div>
      </section>
    </div>
  );
}
