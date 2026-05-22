import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Pin, Trash2, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Category = "movie" | "anime" | "webtoon";

interface Post {
  id: string; category: string; is_notice: boolean;
  title: string; content: string; author: string;
  view_count: number; comment_count: number; created_at: string;
}
interface Comment {
  id: string; author: string; content: string; created_at: string;
}

const THEME = {
  movie:   { accent: "text-blue-400",   bg: "bg-blue-500/10" },
  anime:   { accent: "text-purple-400", bg: "bg-purple-500/10" },
  webtoon: { accent: "text-green-400",  bg: "bg-green-500/10" },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ label, onConfirm, onClose }: {
  label: string; onConfirm: (pw: string) => void; onClose: () => void;
}) {
  const { t } = useLanguage();
  const [pw, setPw] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
        <h3 className="font-bold text-slate-100">{label}</h3>
        <input
          type="password" value={pw} onChange={e => setPw(e.target.value)}
          placeholder={t("비밀번호를 입력하세요", "Enter password")}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors">{t("취소","Cancel")}</button>
          <button onClick={() => onConfirm(pw)} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors">{t("삭제","Delete")}</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BoardPostDetail() {
  const { id }      = useParams<{ id: string }>();
  const location    = useLocation();
  const navigate    = useNavigate();
  const { t }       = useLanguage();

  const category: Category = location.pathname.startsWith("/anime")
    ? "anime" : location.pathname.startsWith("/webtoon") ? "webtoon" : "movie";
  const theme    = THEME[category];
  const basePath = category === "movie" ? "/board" : `/${category}/board`;

  const [post, setPost]           = useState<Post | null>(null);
  const [comments, setComments]   = useState<Comment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "post" | "comment"; id: string } | null>(null);
  const [deleteError, setDeleteError]   = useState("");

  // Write comment form
  const [cAuthor, setCAuthor]   = useState("");
  const [cContent, setCContent] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cLoading, setCLoading] = useState(false);
  const [cError, setCError]     = useState("");

  async function loadPost() {
    if (!id) return;
    const { data } = await supabase.from("board_posts").select("*").eq("id", id).single();
    setPost(data);
    setLoading(false);
    // increment view
    supabase.functions.invoke("board-api", { body: { action: "increment-view", id } });
  }

  async function loadComments() {
    if (!id) return;
    const { data } = await supabase.from("board_comments")
      .select("id,author,content,created_at").eq("post_id", id).order("created_at");
    setComments(data ?? []);
  }

  useEffect(() => { loadPost(); loadComments(); }, [id]);

  async function handleDelete(password: string) {
    if (!deleteTarget) return;
    setDeleteError("");
    const action = deleteTarget.type === "post" ? "delete-post" : "delete-comment";
    const { data } = await supabase.functions.invoke("board-api", {
      body: { action, id: deleteTarget.id, password },
    });
    if (data?.error) { setDeleteError(data.error); return; }
    setDeleteTarget(null);
    if (deleteTarget.type === "post") navigate(basePath);
    else loadComments();
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cAuthor.trim() || !cContent.trim() || !cPassword) {
      setCError(t("모든 항목을 입력해주세요", "Please fill in all fields")); return;
    }
    setCLoading(true); setCError("");
    const { data } = await supabase.functions.invoke("board-api", {
      body: { action: "create-comment", postId: id, content: cContent, author: cAuthor, password: cPassword },
    });
    setCLoading(false);
    if (data?.error) { setCError(data.error); return; }
    setCContent(""); setCPassword("");
    loadComments();
    // refresh comment_count on post
    const { data: updated } = await supabase.from("board_posts").select("comment_count").eq("id", id).single();
    if (updated) setPost(p => p ? { ...p, comment_count: updated.comment_count } : p);
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500">{t("불러오는 중...", "Loading...")}</div>;
  if (!post)   return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-slate-500">{t("글을 찾을 수 없습니다", "Post not found")}</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button onClick={() => navigate(basePath)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> {t("목록으로", "Back to list")}
      </button>

      {/* Post */}
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-700">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 min-w-0">
              {post.is_notice && (
                <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", theme.accent, theme.bg)}>
                  <Pin className="w-3 h-3" /> {t("공지", "Notice")}
                </span>
              )}
              <h1 className="text-xl font-bold text-slate-100">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="text-slate-300 font-medium">{post.author}</span>
                <span>{formatDate(post.created_at)}</span>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.view_count}</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comment_count}</span>
              </div>
            </div>
            <button
              onClick={() => { setDeleteError(""); setDeleteTarget({ type: "post", id: post.id }); }}
              className="shrink-0 p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
              title={t("삭제", "Delete")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="px-6 py-5 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-slate-800/40 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700 text-sm font-medium text-slate-300">
          {t("댓글", "Comments")} {comments.length > 0 && <span className={cn("ml-1", theme.accent)}>{comments.length}</span>}
        </div>

        {comments.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-slate-500">{t("아직 댓글이 없습니다", "No comments yet")}</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {comments.map(c => (
              <div key={c.id} className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-slate-200 font-medium">{c.author}</span>
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{c.content}</p>
                </div>
                <button
                  onClick={() => { setDeleteError(""); setDeleteTarget({ type: "comment", id: c.id }); }}
                  className="shrink-0 p-1.5 rounded text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Comment form */}
        <form onSubmit={handleCommentSubmit} className="px-5 py-4 border-t border-slate-700 space-y-3">
          <textarea
            value={cContent} onChange={e => setCContent(e.target.value)}
            placeholder={t("댓글을 입력하세요", "Write a comment")}
            rows={3}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="flex gap-2">
            <input
              value={cAuthor} onChange={e => setCAuthor(e.target.value)}
              placeholder={t("닉네임", "Nickname")}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="password" value={cPassword} onChange={e => setCPassword(e.target.value)}
              placeholder={t("비밀번호", "Password")}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit" disabled={cLoading}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50", theme.bg, "hover:opacity-80")}
              style={{ background: "rgb(59 130 246 / 0.3)" }}
            >
              {t("등록", "Post")}
            </button>
          </div>
          {cError && <p className="text-red-400 text-xs">{cError}</p>}
        </form>
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          label={deleteTarget.type === "post" ? t("게시글을 삭제하시겠습니까?", "Delete this post?") : t("댓글을 삭제하시겠습니까?", "Delete this comment?")}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {deleteError && (
        <div className="fixed bottom-4 right-4 bg-red-900/80 border border-red-700 text-red-200 px-4 py-3 rounded-xl text-sm z-50">
          {deleteError}
        </div>
      )}
    </div>
  );
}
