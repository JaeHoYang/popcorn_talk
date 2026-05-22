import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Platform {
  name: string;
  url: string;
}

interface Props {
  platforms: Platform[];
}

const PLATFORM_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  "네이버 웹툰": { color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30" },
  "카카오 웹툰": { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  "레진코믹스":  { color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
  "공식 영문판": { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
  "공식 원문":   { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  "AniList":     { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30" },
  "MyAnimeList": { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
  "MangaUpdates":{ color: "text-slate-300",  bg: "bg-slate-700",     border: "border-slate-600" },
  "MangaDex":    { color: "text-orange-300", bg: "bg-orange-500/10", border: "border-orange-500/30" },
};

export default function ReadingLinkSection({ platforms }: Props) {
  const { t } = useLanguage();
  if (platforms.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-100 mb-3">
        {t("어디서 볼 수 있나요?", "Where to Read")}
      </h2>
      <div className="flex flex-wrap gap-2">
        {platforms.map((p) => {
          const style = PLATFORM_STYLE[p.name] ?? {
            color: "text-slate-300",
            bg: "bg-slate-800",
            border: "border-slate-700",
          };
          return (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-opacity hover:opacity-80 ${style.color} ${style.bg} ${style.border}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {p.name}
            </a>
          );
        })}
      </div>
    </section>
  );
}
