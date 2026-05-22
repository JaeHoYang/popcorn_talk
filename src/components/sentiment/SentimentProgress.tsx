import { Loader2 } from "lucide-react";
import SkeletonCard from "@/components/common/SkeletonCard";

interface Props {
  progress: number;
  stageMessage: string;
}

export default function SentimentProgress({ progress, stageMessage }: Props) {
  return (
    <div className="space-y-4">
      {/* 스켈레톤 */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonCard className="aspect-auto h-32" />
        <div className="space-y-2">
          <SkeletonCard className="aspect-auto h-6" />
          <SkeletonCard className="aspect-auto h-6" />
          <SkeletonCard className="aspect-auto h-6" />
        </div>
      </div>

      {/* 진행 상태 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            {stageMessage || "분석 중..."}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
