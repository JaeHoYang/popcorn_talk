import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Pin, Eye, MessageSquare, PenLine, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Category = "movie" | "anime" | "webtoon";

interface Post {
  id: string;
  is_notice: boolean;
  title: string;
  author: string;
  view_count: number;
  comment_count: number;
  created_at: string;
}

const PAGE_SIZE = 20;

const THEME = {
  movie:   { accent: "text-blue-400",   border: "border-blue-500",   bg: "bg-blue-500/10",   label: "🎬 영화 게시판",   en: "Movie Board" },
  anime:   { accent: "text-purple-400", border: "border-purple-500", bg: "bg-purple-500/10", label: "✨ 애니 게시판",   en: "Anime Board" },
  webtoon: { accent: "text-green-400",  border: "border-green-500",  bg: "bg-green-500/10",  label: "📖 웹툰 게시판",  en: "Webtoon Board" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
}

// ── Write Modal ─────────────────────────────────────────────────────────────
function WriteModal({ category, theme, onClose, onSuccess }: {
  category: Category;
  theme: typeof THEME.movie;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useLanguage();
  const [title, setTitle]           = useState("");
  const [content, setContent]       = useState("");
  const [author, setAuthor]         = useState("");
  const [password, setPassword]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !author.trim() || !password) {
      setError(t("모든 항목을 입력해주세요", "Please fill in all fields"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("board-api", {
        body: { action: "create-post", category, title, content, author, password, isNotice: false },
      });
      if (fnErr || data?.error) { setError(data?.error ?? t("오류가 발생했습니다", "An error occurred")); return; }
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className={cn("font-bold text-lg", theme.accent)}>{t("글쓰기", "Write Post")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input
            value={title} onChange={e => setTitle(e.target.value)}
            placeholder={t("제목", "Title")}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <textarea
            value={content} onChange={e => setContent(e.target.value)}
            placeholder={t("내용을 입력하세요", "Enter content")}
            rows={6}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={author} onChange={e => setAuthor(e.target.value)}
              placeholder={t("닉네임", "Nickname")}
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={t("비밀번호 (삭제용)", "Password (for deletion)")}
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors">
              {t("취소", "Cancel")}
            </button>
            <button type="submit" disabled={loading} className={cn("flex-1 py-2.5 rounded-lg font-medium text-white transition-colors", theme.border.replace("border","bg"), "hover:opacity-90 disabled:opacity-50")}>
              {loading ? t("등록 중...", "Posting...") : t("등록", "Post")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Board() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { t }     = useLanguage();

  const category: Category = location.pathname.startsWith("/anime")
    ? "anime" : location.pathname.startsWith("/webtoon") ? "webtoon" : "movie";
  const theme = THEME[category];

  const [posts, setPosts]       = useState<Post[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [showWrite, setShowWrite] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath   = category === "movie" ? "/board" : `/${category}/board`;

  async function fetchPosts(p = 1) {
    setLoading(true);
    const from = (p - 1) * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;
    const { data, count } = await supabase
      .from("board_posts")
      .select("id,is_notice,title,author,view_count,comment_count,created_at", { count: "exact" })
      .eq("category", category)
      .order("is_notice", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    setPosts(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }

  useEffect(() => { fetchPosts(page); }, [page, category]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className={cn("text-2xl font-bold", theme.accent)}>{t(theme.label, theme.en)}</h1>
        <button
          onClick={() => setShowWrite(true)}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors", theme.bg, `hover:${theme.bg}`)}
          style={{ background: category === "movie" ? "rgb(59 130 246 / 0.2)" : category === "anime" ? "rgb(168 85 247 / 0.2)" : "rgb(34 197 94 / 0.2)" }}
        >
          <PenLine className="w-4 h-4" />
          {t("글쓰기", "Write")}
        </button>
      </div>

      {/* Post List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[1fr_100px_90px_50px_50px] gap-4 px-4 py-2.5 text-xs text-slate-500 border-b border-slate-700">
          <span>{t("제목", "Title")}</span>
          <span className="text-center">{t("작성자", "Author")}</span>
          <span className="text-center">{t("날짜", "Date")}</span>
          <span className="text-center">{t("조회", "Views")}</span>
          <span className="text-center">{t("댓글", "Reply")}</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">{t("불러오는 중...", "Loading...")}</div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-slate-500">{t("게시글이 없습니다", "No posts yet")}</div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              to={`${basePath}/${post.id}`}
              className={cn(
                "grid grid-cols-1 md:grid-cols-[1fr_100px_90px_50px_50px] gap-1 md:gap-4 px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors",
                post.is_notice && "bg-slate-700/20"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {post.is_notice && (
                  <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium shrink-0", theme.accent, theme.bg)}>
                    <Pin className="w-3 h-3" /> {t("공지", "Notice")}
                  </span>
                )}
                <span className="text-sm text-slate-100 truncate">{post.title}</span>
                {post.comment_count > 0 && (
                  <span className="text-xs text-blue-400 shrink-0">[{post.comment_count}]</span>
                )}
              </div>
              <span className="hidden md:block text-xs text-slate-400 text-center self-center truncate">{post.author}</span>
              <span className="hidden md:block text-xs text-slate-500 text-center self-center">{formatDate(post.created_at)}</span>
              <span className="hidden md:flex items-center justify-center gap-1 text-xs text-slate-500">
                <Eye className="w-3 h-3" />{post.view_count}
              </span>
              <span className="hidden md:flex items-center justify-center gap-1 text-xs text-slate-500">
                <MessageSquare className="w-3 h-3" />{post.comment_count}
              </span>
              {/* Mobile meta */}
              <div className="flex md:hidden items-center gap-2 text-xs text-slate-500">
                <span>{post.author}</span>
                <span>·</span>
                <span>{formatDate(post.created_at)}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.view_count}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p} onClick={() => setPage(p)}
              className={cn("w-9 h-9 rounded-lg text-sm transition-colors", p === page ? cn(theme.accent, "bg-slate-700 font-bold") : "text-slate-400 hover:text-white hover:bg-slate-700")}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showWrite && (
        <WriteModal
          category={category} theme={theme}
          onClose={() => setShowWrite(false)}
          onSuccess={() => fetchPosts(1)}
        />
      )}
    </div>
  );
}
