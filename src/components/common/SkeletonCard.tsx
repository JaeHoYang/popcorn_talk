import { cn } from "@/lib/utils";

export default function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg overflow-hidden bg-slate-800 animate-pulse", className)}>
      <div className="aspect-[2/3] bg-slate-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
}
