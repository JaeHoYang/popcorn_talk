import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Webtoon, PLATFORMS } from "@/types/webtoon";
import WebtoonCard from "./WebtoonCard";
import SkeletonCard from "@/components/common/SkeletonCard";
import EmptyState from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

export default function PlatformSection() {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { t } = useLanguage();

  const { data, isLoading, isError } = useQuery<Webtoon[]>({
    queryKey: ["webtoon-platform", selectedKey],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-platform-webtoons", {
        body: { platform: selectedKey },
      });
      if (error) throw error;
      return (data.data as Webtoon[]) ?? [];
    },
    enabled: !!selectedKey,
    staleTime: 6 * 60 * 60 * 1000,
  });

  const selectedPlatform = PLATFORMS.find((p) => p.key === selectedKey);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-1">
          {t("플랫폼별 웹툰", "Browse by Platform")}
        </h2>
        <p className="text-sm text-slate-400">
          {t("플랫폼을 선택해 웹툰을 탐색해보세요", "Select a platform to explore webtoons")}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.key}
            onClick={() => setSelectedKey(selectedKey === platform.key ? null : platform.key)}
            className={cn(
              "flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all",
              selectedKey === platform.key
                ? `${platform.color} ${platform.bg} ${platform.border} scale-105`
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
            )}
          >
            <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
              selectedKey === platform.key ? platform.bg : "bg-slate-700"
            )}>
              {platform.icon}
            </span>
            {platform.name}
          </button>
        ))}
      </div>

      {selectedKey && selectedPlatform && (
        <div className="space-y-4">
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}
          {isError && <EmptyState type="error" />}
          {!isLoading && !isError && data?.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              {t("등록된 웹툰이 없습니다", "No webtoons registered yet")}
            </div>
          )}
          {!isLoading && !isError && data && data.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.map((w) => <WebtoonCard key={w.id} webtoon={w} />)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
