import { Star } from "lucide-react";

interface Props {
  tmdbRating: number;
  tmdbVoteCount: number;
  imdbRating: string | null;
}

export default function RatingBadge({ tmdbRating, tmdbVoteCount, imdbRating }: Props) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center bg-slate-800 rounded-xl px-4 py-3 min-w-[80px]">
        <span className="text-xs text-slate-400 mb-1">TMDB</span>
        <div className="flex items-center gap-1 text-yellow-400">
          <Star className="w-4 h-4 fill-yellow-400" />
          <span className="text-lg font-bold">{tmdbRating.toFixed(1)}</span>
        </div>
        <span className="text-xs text-slate-500 mt-0.5">{tmdbVoteCount.toLocaleString()}명</span>
      </div>

      {imdbRating && (
        <div className="flex flex-col items-center bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 min-w-[80px]">
          <span className="text-xs text-yellow-400 mb-1 font-bold">IMDb</span>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-yellow-400" />
            <span className="text-lg font-bold">{imdbRating}</span>
          </div>
        </div>
      )}
    </div>
  );
}
