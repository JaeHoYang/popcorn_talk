import { Film, SearchX, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateType = "search" | "error" | "empty";

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  className?: string;
}

const defaults = {
  search: { Icon: SearchX, title: "검색 결과가 없습니다", description: "다른 검색어로 다시 시도해 보세요." },
  error:  { Icon: AlertCircle, title: "오류가 발생했습니다", description: "잠시 후 다시 시도해 주세요." },
  empty:  { Icon: Film, title: "영화가 없습니다", description: "나중에 다시 확인해 보세요." },
};

export default function EmptyState({ type = "empty", title, description, className }: EmptyStateProps) {
  const { Icon, title: defaultTitle, description: defaultDesc } = defaults[type];

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-slate-400", className)}>
      <Icon className="w-12 h-12 mb-4 opacity-40" />
      <p className="text-base font-medium">{title ?? defaultTitle}</p>
      <p className="text-sm mt-1 text-slate-500">{description ?? defaultDesc}</p>
    </div>
  );
}
