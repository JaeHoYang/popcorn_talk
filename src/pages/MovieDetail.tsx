import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, Music, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMovieDetail } from "@/hooks/useMovieDetail";
import { useWishlist } from "@/hooks/useWishlist";
import { useFakeLoading } from "@/hooks/useFakeLoading";
import { posterUrl, formatYear } from "@/lib/utils";
import { cn } from "@/lib/utils";
import TrailerPlayer from "@/components/detail/TrailerPlayer";
import RatingBadge from "@/components/detail/RatingBadge";
import CastScroll from "@/components/detail/CastScroll";
import WatchProviderSection from "@/components/detail/WatchProviderSection";
import SimilarMovies from "@/components/detail/SimilarMovies";
import CollectionSection from "@/components/detail/CollectionSection";
import SentimentPanel from "@/components/sentiment/SentimentPanel";
import EmptyState from "@/components/common/EmptyState";
import SkeletonCard from "@/components/common/SkeletonCard";
import ShareButton from "@/components/common/ShareButton";
import { Movie } from "@/types/movie";
import { useLogEvent } from "@/hooks/useLogEvent";

const RUNTIME_MS = 30 * 24 * 60 * 60 * 1000; // 30일

function isNowPlaying(releaseDate: string): boolean {
  if (!releaseDate) return false;
  const diff = Date.now() - new Date(releaseDate).getTime();
  return diff >= 0 && diff <= RUNTIME_MS;
}

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

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const { uiLanguage, t } = useLanguage();
  const { data, isLoading, isFetching, isError } = useMovieDetail(id!, uiLanguage);
  const loading = useFakeLoading(isFetching) || isLoading;
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  // useWishlist 에 Movie 형태로 전달
  const movieForWishlist: Movie | undefined = data
    ? {
        id: data.id,
        title: data.title,
        original_title: data.original_title,
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        overview: data.overview,
        release_date: data.release_date,
        vote_average: data.vote_average,
        vote_count: data.vote_count,
        genre_ids: data.genres.map((g) => g.id),
        original_language: data.original_language,
        popularity: 0,
      }
    : undefined;

  const { isWishlisted, toggle } = useWishlist(movieForWishlist);
  const { logMovie } = useLogEvent();
  useEffect(() => {
    if (data) logMovie(data.id, data.title, data.poster_path);
  }, [data?.id]);

  if (loading) return <DetailSkeleton />;
  if (isError || !data) return <EmptyState type="error" className="min-h-[50vh]" />;

  const poster = posterUrl(data.poster_path, "w500");
  const backdrop = posterUrl(data.backdrop_path, "original");
  const nowPlaying = isNowPlaying(data.release_date);
  const LONG_OVERVIEW = data.overview.length > 200;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* 1. 예고편 */}
      {data.trailers.length > 0 && <TrailerPlayer trailers={data.trailers} />}

      {/* 2. 포스터 + 기본 정보 */}
      <section className="flex gap-6">
        <div className="shrink-0 w-32 sm:w-44">
          <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden">
            {poster ? (
              <img src={poster} alt={data.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">{data.title}</h1>
              {data.original_title !== data.title && (
                <p className="text-sm text-slate-400 mt-0.5">{data.original_title}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ShareButton
                title={data.title}
                description={data.overview?.slice(0, 80)}
                imageUrl={data.poster_path ? posterUrl(data.poster_path) ?? undefined : undefined}
              />
              <button
                onClick={toggle}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                aria-label={isWishlisted ? t("위시리스트에서 제거", "Remove from wishlist") : t("위시리스트에 추가", "Add to wishlist")}
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
            {data.release_date && <p>📅 {data.release_date}</p>}
            {data.runtime && (
              <p>⏱ {Math.floor(data.runtime / 60)}h {data.runtime % 60}m</p>
            )}
            <p>🌐 {data.original_language.toUpperCase()}</p>
          </div>
        </div>
      </section>

      {/* 3. 평점 */}
      <RatingBadge
        tmdbRating={data.vote_average}
        tmdbVoteCount={data.vote_count}
        imdbRating={data.imdb_rating}
      />

      {/* 4. 시놉시스 */}
      {data.overview && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("시놉시스", "Synopsis")}</h2>
          <p className={cn("text-sm text-slate-300 leading-relaxed", !overviewExpanded && LONG_OVERVIEW && "line-clamp-4")}>
            {data.overview}
          </p>
          {LONG_OVERVIEW && (
            <button
              onClick={() => setOverviewExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors"
            >
              {overviewExpanded ? (
                <><ChevronUp className="w-3 h-3" />{t("접기", "Show less")}</>
              ) : (
                <><ChevronDown className="w-3 h-3" />{t("더 보기", "Show more")}</>
              )}
            </button>
          )}
        </section>
      )}

      {/* 5. 감독/출연 */}
      <CastScroll director={data.director} cast={data.cast} />

      {/* 6. 제작사 */}
      {data.production_companies.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-3">{t("제작사", "Production")}</h2>
          <div className="flex flex-wrap gap-3">
            {data.production_companies.map((company) => (
              <div key={company.id} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                {company.logo_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${company.logo_path}`}
                    alt={company.name}
                    className="h-6 object-contain filter invert opacity-80"
                  />
                ) : (
                  <span className="text-xs text-slate-300">{company.name}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. 평론가 리뷰 */}
      {data.reviews.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-3">{t("평론가 리뷰", "Reviews")}</h2>
          <div className="space-y-3">
            {data.reviews.map((review) => (
              <div key={review.id} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-200">{review.author}</span>
                  {review.author_details?.rating && (
                    <span className="text-xs text-yellow-400">★ {review.author_details.rating}/10</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{review.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. 시리즈 */}
      {data.collection && (
        <CollectionSection collection={data.collection} currentMovieId={data.id} />
      )}

      {/* 9. OTT + 극장 */}
      <WatchProviderSection
        providers={data.watch_providers}
        isNowPlaying={nowPlaying}
        movieTitle={data.title}
      />

      {/* 10. OST 링크 */}
      <section>
        <h2 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
          <Music className="w-5 h-5 text-pink-400" />
          OST
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://music.youtube.com/search?q=${encodeURIComponent(data.title + " OST")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            YouTube Music
          </a>
          <a
            href={`https://open.spotify.com/search/${encodeURIComponent(data.title + " OST")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Spotify
          </a>
        </div>
      </section>

      {/* 11. AI 감성 분석 */}
      <SentimentPanel key={data.id} movieId={data.id} movieTitle={data.title} />

      {/* 12. 유사 영화 */}
      <SimilarMovies movies={data.similar} />
    </div>
  );
}
