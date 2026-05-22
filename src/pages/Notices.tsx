import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import EmptyState from "@/components/common/EmptyState";

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function Notices() {
  const { t } = useLanguage();

  const { data: notices = [], isLoading, isError } = useQuery<Notice[]>({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("id, title, content, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-6 h-6 text-slate-400" />
        <h1 className="text-2xl font-bold text-slate-100">{t("공지사항", "Notices")}</h1>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-5 animate-pulse space-y-2">
              <div className="h-4 bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-700 rounded w-full" />
              <div className="h-3 bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {isError && <EmptyState type="error" />}

      {!isLoading && !isError && notices.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <p>{t("등록된 공지사항이 없습니다.", "No notices available.")}</p>
        </div>
      )}

      {!isLoading && !isError && notices.length > 0 && (
        <div className="space-y-3">
          {notices.map((notice) => (
            <article key={notice.id} className="bg-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-slate-100">{notice.title}</h2>
                <time className="text-xs text-slate-500 shrink-0 mt-0.5">
                  {new Date(notice.created_at).toLocaleDateString("ko-KR")}
                </time>
              </div>
              <div className="text-sm text-slate-300 leading-relaxed [&_a]:text-blue-400 [&_a:hover]:underline [&_strong]:text-slate-100 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-1">
                <ReactMarkdown>{notice.content}</ReactMarkdown>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
