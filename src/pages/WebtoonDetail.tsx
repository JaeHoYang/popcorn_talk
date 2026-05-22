import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWebtoonDetail } from "@/hooks/useWebtoonDetail";
import { useWebtoonWishlist } from "@/hooks/useWebtoonWishlist";
import { useLogEvent } from "@/hooks/useLogEvent";
import { cn } from "@/lib/utils";
import ReadingLinkSection from "@/components/webtoon/ReadingLinkSection";
import SimilarWebtoon from "@/components/webtoon/SimilarWebtoon";
import SentimentPanel from "@/components/sentiment/SentimentPanel";
import ShareButton from "@/components/common/ShareButton";
import EmptyState from "@/components/common/EmptyState";

const STATUS_LABEL: Record<string, { ko: string; color: string }> = {
  ongoing:   { ko: "연재중", color: "text-green-400 bg-green-400/10" },
  completed: { ko: "완결",   color: "text-slate-400 bg-slate-700" },
  hiatus:    { ko: "휴재",   color: "text-yellow-400 bg-yellow-400/10" },
  cancelled: { ko: "중단",   color: "text-red-400 bg-red-400/10" },
};

const DEMOGRAPHIC_LABEL: Record<string, string> = {
  shounen: "소년",
  shoujo:  "소녀",
  josei:   "여성",
  seinen:  "청년",
};

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
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

export default function WebtoonDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { data, isLoading, isError } = useWebtoonDetail(id!);
  const { logWebtoon } = useLogEvent();
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  const { isWishlisted, toggle } = useWebtoonWishlist(
    data ? { id: data.id, title: data.title, cover_url: data.cover_url } : undefined
  );

  useEffect(() => {
    if (data) logWebtoon(data.id, data.title, data.cover_url);
  }, [data?.id]);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !data) return <EmptyState type="error" className="min-h-[50vh]" />;

  const status = STATUS_LABEL[data.status] ?? { ko: data.status, color: "text-slate-400 bg-slate-700" };
  const LONG_SYNOPSIS = (data.synopsis ?? "").length > 200;
  const demographicLabel = data.demographic ? DEMOGRAPHIC_LABEL[data.demographic] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* 1. 포스터 + 기본 정보 */}
      <section className="flex gap-6">
        <div className="shrink-0 w-32 sm:w-44">
          <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden">
            {data.cover_url ? (
              <img src={data.cover_url} alt={data.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">{data.title}</h1>
              {data.title_english && data.title_english !== data.title && (
                <p className="text-sm text-slate-400 mt-0.5">{data.title_english}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ShareButton
                title={data.title}
                description={data.synopsis?.slice(0, 80)}
                imageUrl={data.cover_url || undefined}
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

          {/* 장르 + 테마 배지 */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {data.genres.map((g) => (
                <span key={g.id} className="px-2.5 py-1 text-xs bg-slate-700 text-slate-300 rounded-full">
                  {g.name}
                </span>
              ))}
            </div>
            {data.themes && data.themes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.themes.map((th) => (
                  <span key={th.id} className="px-2.5 py-1 text-xs bg-indigo-900/50 text-indigo-300 rounded-full">
                    {th.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 메타 정보 */}
          <div className="text-sm text-slate-400 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>
                {status.ko}
              </span>
              {demographicLabel && (
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-violet-900/50 text-violet-300">
                  {demographicLabel}
                </span>
              )}
            </div>
            {data.author && <p>✍️ {data.author}</p>}
            {data.year && <p>📅 {data.year}</p>}
            {data.chapters && <p>📚 전 {data.chapters}화</p>}
          </div>
        </div>
      </section>

      {/* 2. 평점 / 팔로워 */}
      {(data.score || data.followed_count) && (
        <section className="flex flex-wrap gap-4">
          {data.score && (
            <div className="bg-slate-800 rounded-xl px-5 py-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">MAL 평점</p>
              <p className="text-2xl font-bold text-yellow-400">★ {data.score.toFixed(2)}</p>
            </div>
          )}
          {data.followed_count && (
            <div className="bg-slate-800 rounded-xl px-5 py-3 text-center">
              <p className="text-xs text-slate-400 mb-0.5">팔로워</p>
              <p className="text-2xl font-bold text-green-400">{data.followed_count.toLocaleString()}</p>
            </div>
          )}
        </section>
      )}

      {/* 3. 줄거리 */}
      {data.synopsis && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-2">{t("줄거리", "Synopsis")}</h2>
          <p className={cn("text-sm text-slate-300 leading-relaxed", !synopsisExpanded && LONG_SYNOPSIS && "line-clamp-4")}>
            {data.synopsis}
          </p>
          {LONG_SYNOPSIS && (
            <button
              onClick={() => setSynopsisExpanded((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {synopsisExpanded
                ? <><ChevronUp className="w-3.5 h-3.5" />{t("접기", "Show Less")}</>
                : <><ChevronDown className="w-3.5 h-3.5" />{t("더 보기", "Show More")}</>
              }
            </button>
          )}
        </section>
      )}

      {/* 4. 원작 정보 */}
      {data.adapted_from && data.adapted_from.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-3">{t("원작", "Source Material")}</h2>
          <div className="flex flex-col gap-2">
            {data.adapted_from.map((src) => (
              <a
                key={src.id}
                href={`https://mangadex.org/title/${src.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700 hover:border-slate-500 transition-colors"
              >
                <span className="text-xl">📖</span>
                <span className="text-sm text-slate-200">{src.title}</span>
                <span className="ml-auto text-xs text-slate-500">MangaDex →</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 5. 애니화 정보 */}
      {data.anime_adaptation && (
        <section>
          <h2 className="text-lg font-bold text-slate-100 mb-3">
            {t("애니화", "Anime Adaptation")}
          </h2>
          <div className="flex gap-4 bg-slate-800/60 rounded-xl p-4 border border-slate-700">
            {data.anime_adaptation.cover_url && (
              <img
                src={data.anime_adaptation.cover_url}
                alt={data.anime_adaptation.title}
                className="w-20 aspect-[2/3] object-cover rounded-lg shrink-0"
              />
            )}
            <div className="space-y-1.5 min-w-0">
              <p className="font-semibold text-slate-100 leading-snug">{data.anime_adaptation.title}</p>
              {data.anime_adaptation.title_en && data.anime_adaptation.title_en !== data.anime_adaptation.title && (
                <p className="text-sm text-slate-400">{data.anime_adaptation.title_en}</p>
              )}
              <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                {data.anime_adaptation.year && <span>📅 {data.anime_adaptation.year}</span>}
                {data.anime_adaptation.episodes && <span>🎬 {data.anime_adaptation.episodes}화</span>}
                {data.anime_adaptation.status && (
                  <span className={data.anime_adaptation.status === "FINISHED" ? "text-slate-400" : "text-green-400"}>
                    {data.anime_adaptation.status === "FINISHED" ? "완결" :
                     data.anime_adaptation.status === "RELEASING" ? "방영중" : data.anime_adaptation.status}
                  </span>
                )}
              </div>
              {data.anime_adaptation.anilist_url && (
                <a
                  href={data.anime_adaptation.anilist_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors mt-1"
                >
                  AniList에서 보기 →
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 6. 읽기 링크 */}
      <ReadingLinkSection platforms={data.platforms} />

      {/* 7. AI 감성 분석 */}
      <SentimentPanel key={data.id} movieId={data.id} movieTitle={data.title} type="webtoon" />

      {/* 8. 작가의 다른 작품 */}
      {data.author_other_works && data.author_other_works.length > 0 && (
        <SimilarWebtoon
          similar={data.author_other_works}
          title={`${data.author}의 다른 작품`}
        />
      )}

      {/* 9. 유사 웹툰 */}
      <SimilarWebtoon similar={data.similar} />
    </div>
  );
}
