import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnimeDetail } from "@/hooks/useAnimeDetail";
import { useLogEvent } from "@/hooks/useLogEvent";
import { useAnimeWishlist } from "@/hooks/useAnimeWishlist";
import { cn } from "@/lib/utils";
import { Trailer } from "@/types/detail";
import TrailerPlayer from "@/components/detail/TrailerPlayer";
import WatchProviderSection from "@/components/detail/WatchProviderSection";
import SentimentPanel from "@/components/sentiment/SentimentPanel";
import SimilarAnime from "@/components/anime/SimilarAnime";
import EmptyState from "@/components/common/EmptyState";
import SkeletonCard from "@/components/common/SkeletonCard";
import ShareButton from "@/components/common/ShareButton";

const STATUS_LABEL: Record<string, { ko: string; color: string }> = {
  "Currently Airing": { ko: "방영중", color: "text-green-400 bg-green-400/10" },
  "Finished Airing":  { ko: "완결",   color: "text-slate-400 bg-slate-700" },
  "Not yet aired":    { ko: "미방영", color: "text-yellow-400 bg-yellow-400/10" },
};

const SEASON_KO: Record<string, string> = {
  spring: "봄", summer: "여름", fall: "가을", winter: "겨울",
};

const DAY_KO: Record<string, string> = {
  Mondays: "월요일", Tuesdays: "화요일", Wednesdays: "수요일",
  Thursdays: "목요일", Fridays: "금요일", Saturdays: "토요일", Sundays: "일요일",
};

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

export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { data, isLoading, isError } = useAnimeDetail(id!);
  const { logAnime } = useLogEvent();
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const { isWishlisted, toggle: toggleWishlist } = useAnimeWishlist(
    data ? { mal_id: data.mal_id, title: data.title, images: data.images } : undefined
  );

  useEffect(() => {
    if (data) logAnime(data.mal_id, data.title, data.images.jpg.large_image_url);
  }, [data?.mal_id]);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) return <EmptyState type="error" className="min-h-[50vh]" />;

  const poster = data.images.jpg.large_image_url || data.images.jpg.image_url;
  const status = STATUS_LABEL[data.status] ?? { ko: data.status, color: "text-slate-400 bg-slate-700" };
  const LONG_SYNOPSIS = (data.synopsis ?? "").length > 200;

  // TrailerPlayer 형식으로 변환
  const trailers: Trailer[] = data.trailer?.youtube_id
    ? [{ key: data.trailer.youtube_id, name: "Trailer", type: "Trailer", site: "YouTube" }]
    : [];

  // 주요 성우 (일본어)
  const voiceActors = data.characters
    .filter((c) => c.voice_actors.length > 0)
    .map((c) => ({
      id: c.character.mal_id,
      name: c.voice_actors[0].person.name,
      character: c.character.name,
      profile_path: null as null,
      image: c.voice_actors[0].person.images?.jpg?.image_url ?? null,
      charImage: c.character.images.jpg.image_url,
    }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* 1. 예고편 */}
      {trailers.length > 0 && <TrailerPlayer trailers={trailers} />}

      {/* 2. 포스터 + 기본 정보 */}
      <section className="flex gap-6">
        <div className="shrink-0 w-32 sm:w-44">
          <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden">
            {poster ? (
              <img src={poster} alt={data.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">✨</div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">{data.title}</h1>
              {data.title_japanese && (
                <p className="text-sm text-slate-400 mt-0.5">{data.title_japanese}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ShareButton
                title={data.title}
                description={data.synopsis?.slice(0, 80)}
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
              <span key={g.mal_id} className="px-2.5 py-1 text-xs bg-slate-700 text-slate-300 rounded-full">
                {g.name}
              </span>
            ))}
            {data.themes?.map((th) => (
              <span key={th.mal_id} className="px-2.5 py-1 text-xs bg-purple-900/40 text-purple-300 rounded-full">
                {th.name}
              </span>
            ))}
          </div>

          {/* 메타 정보 */}
          <div className="text-sm text-slate-400 space-y-1">
            <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>
              {status.ko}
            </span>
            {/* 방영 연도/시즌 */}
            {(data.year || data.season) && (
              <p>📅 {[data.year, data.season ? SEASON_KO[data.season] ?? data.season : null].filter(Boolean).join(" ")}</p>
            )}
            {/* 시작일 */}
            {data.aired.from && <p>🗓️ {data.aired.from.slice(0, 10)} 방영 시작</p>}
            {/* 에피소드 수 */}
            {data.status === "Currently Airing" ? (
              <p>🎬 {data.aired_episodes != null ? `${data.aired_episodes}화까지 방영중` : "방영중"}{data.episodes ? ` / 전 ${data.episodes}화 예정` : ""}</p>
            ) : (
              data.episodes && <p>🎬 전 {data.episodes}화</p>
            )}
            {/* 방송 요일/시간 */}
            {data.broadcast?.day && (
              <p>📺 매주 {DAY_KO[data.broadcast.day] ?? data.broadcast.day}{data.broadcast.time ? ` ${data.broadcast.time} (JST)` : ""}</p>
            )}
            {data.studios?.length > 0 && <p>🏢 {data.studios.map((s) => s.name).join(", ")}</p>}
          </div>
        </div>
      </section>

      {/* 3. 평점 */}
      {(data.score || data.rank) && (
        <section className="flex flex-wrap gap-4">
          {data.score && (
            <div className="bg-slate-800 rounded-xl px-5 py-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">MAL 평점</p>
              <p className="text-2xl font-bold text-yellow-400">★ {data.score.toFixed(2)}</p>
            </div>
          )}
          {data.rank && (
            <div className="bg-slate-800 rounded-xl px-5 py-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">전체 순위</p>
              <p className="text-2xl font-bold text-blue-400">#{data.rank.toLocaleString()}</p>
            </div>
          )}
        </section>
      )}

      {/* 4. 시놉시스 */}
      {data.synopsis && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("시놉시스", "Synopsis")}</h2>
          <p className={cn("text-sm text-slate-300 leading-relaxed", !synopsisExpanded && LONG_SYNOPSIS && "line-clamp-4")}>
            {data.synopsis}
          </p>
          {LONG_SYNOPSIS && (
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

      {/* 5. 주요 성우 */}
      {voiceActors.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-3">{t("주요 성우", "Voice Cast")}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {voiceActors.slice(0, 10).map((va) => (
              <a
                key={va.id}
                href={`https://myanimelist.net/character/${va.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 w-20 group"
              >
                <div className="w-20 h-20 rounded-full bg-slate-800 overflow-hidden">
                  {va.charImage ? (
                    <img src={va.charImage} alt={va.character} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">✨</div>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-center text-slate-300 line-clamp-1">{va.character}</p>
                <p className="text-xs text-center text-slate-500 line-clamp-1">{va.name}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 6. OTT 정보 */}
      <WatchProviderSection
        providers={data.watch_providers}
        isNowPlaying={false}
        movieTitle={data.title}
      />

      {/* 스트리밍 직접 링크 (Jikan) */}
      {data.streaming && data.streaming.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-3">{t("공식 스트리밍", "Official Streaming")}</h2>
          <div className="flex flex-wrap gap-2">
            {data.streaming.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm bg-slate-800 text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {s.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 7. 유사 애니 */}
      <SimilarAnime recommendations={data.recommendations} />

      {/* 8. AI 리뷰 분석 */}
      <SentimentPanel key={data.mal_id} movieId={data.mal_id} movieTitle={data.title} type="anime" />

      {/* 9. OST 링크 */}
      <section>
        <h2 className="text-lg font-bold text-slate-100 mb-3">{t("OST 듣기", "Listen to OST")}</h2>
        <div className="flex gap-3">
          <a
            href={`https://music.youtube.com/search?q=${encodeURIComponent(data.title + " OST")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
          >
            ▶ YouTube Music
          </a>
          <a
            href={`https://open.spotify.com/search/${encodeURIComponent(data.title + " OST")}`}
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
