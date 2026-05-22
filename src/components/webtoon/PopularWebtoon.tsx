import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Webtoon, PLATFORMS } from "@/types/webtoon";
import WebtoonCard from "./WebtoonCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

export default function PopularWebtoon() {
  const { t } = useLanguage();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const { data: popularData, isLoading: popularLoading, isError: popularError } = useQuery<Webtoon[]>({
    queryKey: ["popular-webtoons"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("popular-webtoons", {});
      if (error) throw error;
      return (data.data as Webtoon[]) ?? [];
    },
    staleTime: 6 * 60 * 60 * 1000,
  });

  const { data: platformData, isLoading: platformLoading, isError: platformError } = useQuery<Webtoon[]>({
    queryKey: ["webtoon-platform", selectedPlatform],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-platform-webtoons", {
        body: { platform: selectedPlatform },
      });
      if (error) throw error;
      return (data.data as Webtoon[]) ?? [];
    },
    enabled: !!selectedPlatform,
    staleTime: 6 * 60 * 60 * 1000,
  });

  const activePlatform = PLATFORMS.find((p) => p.key === selectedPlatform);
  const isLoading = selectedPlatform ? platformLoading : popularLoading;
  const isError   = selectedPlatform ? platformError  : popularError;
  const data      = selectedPlatform ? platformData   : popularData;

  const sectionTitle = activePlatform
    ? t(`${activePlatform.name} 웹툰`, `${activePlatform.name} Webtoons`)
    : t("인기 웹툰", "Popular Webtoons");

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-100">{sectionTitle}</h2>
        {!selectedPlatform && (
          <Link to="/webtoon/ranking?filter=bypopularity" className="text-sm text-green-400 hover:text-green-300 transition-colors">
            {t("전체 보기 →", "See All →")}
          </Link>
        )}
      </div>

      {/* 플랫폼 탭 */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.key}
            onClick={() => setSelectedPlatform(selectedPlatform === platform.key ? null : platform.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
              selectedPlatform === platform.key
                ? `${platform.color} ${platform.bg} ${platform.border} scale-105`
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
            )}
          >
            <span className={cn(
              "w-5 h-5 rounded flex items-center justify-center text-xs font-bold",
              selectedPlatform === platform.key ? platform.bg : "bg-slate-700"
            )}>
              {platform.icon}
            </span>
            {platform.name}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}
      {isError && <EmptyState type="error" />}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <div className="text-center py-8 text-slate-400 text-sm">
          {t("등록된 웹툰이 없습니다", "No webtoons registered yet")}
        </div>
      )}
      {!isLoading && !isError && data && data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.map((w) => <WebtoonCard key={w.id} webtoon={w} />)}
        </div>
      )}
    </section>
  );
}
