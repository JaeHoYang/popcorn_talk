import { useState } from "react";
import { Link } from "react-router-dom";
import { Webtoon } from "@/types/webtoon";
import { cn } from "@/lib/utils";

interface Props {
  webtoon: Webtoon;
  rank?: number;
  className?: string;
}

const STATUS_LABEL: Record<string, { ko: string; color: string }> = {
  ongoing:   { ko: "연재중", color: "text-green-400" },
  completed: { ko: "완결",   color: "text-slate-400" },
  hiatus:    { ko: "휴재",   color: "text-yellow-400" },
  cancelled: { ko: "중단",   color: "text-red-400" },
};

export default function WebtoonCard({ webtoon, rank, className }: Props) {
  const status = STATUS_LABEL[webtoon.status] ?? { ko: webtoon.status, color: "text-slate-400" };
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Link to={`/webtoon/${webtoon.id}`} className={cn("group block", className)}>
      <div className="aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden relative">
        {webtoon.cover_url && !imgFailed ? (
          <img
            src={webtoon.cover_url}
            alt={webtoon.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
        )}
        {rank && (
          <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded">
            #{rank}
          </div>
        )}
        {webtoon.score && (
          <div className="absolute top-1.5 right-1.5 bg-black/70 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded">
            ★ {webtoon.score.toFixed(1)}
          </div>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-medium text-slate-100 line-clamp-2 group-hover:text-green-400 transition-colors">
          {webtoon.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={status.color}>{status.ko}</span>
          {webtoon.author && <span>· {webtoon.author}</span>}
          {webtoon.year && <span>· {webtoon.year}</span>}
        </div>
      </div>
    </Link>
  );
}
