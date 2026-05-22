import { useState } from "react";
import { Play } from "lucide-react";
import { Trailer } from "@/types/detail";

interface Props {
  trailers: Trailer[];
}

export default function TrailerPlayer({ trailers }: Props) {
  const [playing, setPlaying] = useState(false);

  if (trailers.length === 0) return null;

  const current = trailers[0];
  const thumbnail = `https://img.youtube.com/vi/${current.key}/maxresdefault.jpg`;
  const watchUrl  = `https://www.youtube.com/watch?v=${current.key}`;

  return (
    <section>
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${current.key}?autoplay=1&rel=0`}
            title={current.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 w-full h-full"
          >
            <img
              src={thumbnail}
              alt={current.name}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black/70 flex items-center justify-center group-hover:bg-red-600 transition-colors duration-300">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </div>
          </button>
        )}
      </div>

      {/* 임베드 제한 영상 대비 직접 링크 */}
      <div className="mt-2 text-right">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          YouTube에서 보기 ↗
        </a>
      </div>
    </section>
  );
}
