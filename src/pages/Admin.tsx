import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, LogOut, Bell, MessageSquare, Database, X, Check, Loader2, BarChart2, Bot, TrendingUp, BookOpen, Search, Pin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import { PLATFORMS, Webtoon } from "@/types/webtoon";
import { cn } from "@/lib/utils";

type Tab = "notices" | "feedbacks" | "cache" | "usage" | "analytics" | "webtoon";

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Feedback {
  id: string;
  content: string;
  email: string | null;
  created_at: string;
}

interface NoticeForm {
  title: string;
  content: string;
}

const CACHE_TARGETS = [
  { key: "popular",   ko: "인기영화 캐시",    en: "Popular Movies" },
  { key: "movie",     ko: "영화상세 캐시",    en: "Movie Detail" },
  { key: "person",    ko: "인물 캐시",        en: "Person" },
  { key: "boxoffice", ko: "박스오피스 캐시",  en: "Box Office" },
  { key: "sentiment", ko: "감성분석 캐시",    en: "Sentiment" },
  { key: "anime",     ko: "애니 캐시",        en: "Anime Caches" },
  { key: "webtoon",   ko: "웹툰 캐시",        en: "Webtoon Caches" },
  { key: "drama",     ko: "드라마 캐시",      en: "Drama Caches" },
  { key: "all",       ko: "전체 캐시",        en: "All Caches" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Admin() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("notices");
  const [noticeForm, setNoticeForm] = useState<NoticeForm | null>(null);
  const [cacheStatus, setCacheStatus] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [noticeResult, setNoticeResult] = useState<"success" | "error" | null>(null);
  const [noticeError, setNoticeError] = useState("");

  // ── 공지사항 조회 (board_posts에서) ──────────────────────────────────────
  const { data: notices = [], isLoading: noticesLoading, refetch: refetchNotices } = useQuery<Notice[]>({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("board_posts")
        .select("id,title,content,created_at")
        .eq("is_notice", true)
        .eq("category", "movie")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: tab === "notices",
  });

  // ── 피드백 조회 ───────────────────────────────────────────────────────────
  const { data: feedbacks = [], isLoading: feedbacksLoading } = useQuery<Feedback[]>({
    queryKey: ["admin-feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: tab === "feedbacks",
  });

  // ── 공지사항 저장 (board-api → 3개 게시판 동시 등록) ──────────────────────
  async function handleSaveNotice(form: NoticeForm) {
    if (!form.title.trim() || !form.content.trim()) {
      setNoticeResult("error");
      setNoticeError(t("모든 항목을 입력해주세요", "Please fill in all fields"));
      return;
    }
    setNoticeResult(null);
    const { data, error: fnErr } = await supabase.functions.invoke("board-api", {
      body: {
        action: "create-post",
        category: "movie",
        title: form.title,
        content: form.content,
        author: t("관리자", "Admin"),
        password: "admin-notice",
        isNotice: true,
      },
    });
    if (fnErr || data?.error) {
      setNoticeResult("error");
      setNoticeError(data?.error ?? t("오류가 발생했습니다", "An error occurred"));
    } else {
      setNoticeResult("success");
      setNoticeForm(null);
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
    }
  }

  // ── 공지사항 삭제 (board-api → 3개 게시판 동시 삭제) ─────────────────────
  const deleteNotice = useMutation({
    mutationFn: async (id: string) => {
      const { data, error: fnErr } = await supabase.functions.invoke("board-api", {
        body: { action: "delete-notice", id },
      });
      if (fnErr || data?.error) throw new Error(data?.error ?? "삭제 실패");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
      setDeleteConfirm(null);
    },
  });

  // ── 피드백 삭제 ───────────────────────────────────────────────────────────
  const deleteFeedback = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedbacks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedbacks"] });
      setDeleteConfirm(null);
    },
  });

  // ── 캐시 삭제 ─────────────────────────────────────────────────────────────
  async function handleClearCache(target: string) {
    setCacheStatus((s) => ({ ...s, [target]: "loading" }));
    const { error } = await supabase.functions.invoke("clear-cache", { body: { target } });
    setCacheStatus((s) => ({ ...s, [target]: error ? "error" : "done" }));
    setTimeout(() => setCacheStatus((s) => ({ ...s, [target]: "idle" })), 3000);
  }

  // ── 로그아웃 ──────────────────────────────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">{t("관리자 페이지", "Admin Dashboard")}</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t("로그아웃", "Sign Out")}
        </button>
      </div>

      {/* 탭 */}
      <div className="flex flex-wrap bg-slate-800 rounded-lg p-1 gap-1 w-fit">
        {([
          { key: "notices",   icon: Bell,         ko: "공지사항",  en: "Notices" },
          { key: "feedbacks", icon: MessageSquare, ko: "피드백",    en: "Feedbacks" },
          { key: "cache",     icon: Database,      ko: "캐시 관리", en: "Cache" },
          { key: "usage",     icon: BarChart2,     ko: "AI 사용량", en: "AI Usage" },
          { key: "analytics", icon: TrendingUp,    ko: "방문 통계", en: "Analytics" },
          { key: "webtoon",   icon: BookOpen,      ko: "웹툰 관리", en: "Webtoon" },
        ] as const).map(({ key, icon: Icon, ko, en }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
              tab === key ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Icon className="w-4 h-4" />
            {t(ko, en)}
          </button>
        ))}
      </div>

      {/* ── 공지사항 탭 ──────────────────────────────────────────────────────── */}
      {tab === "notices" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">{t(`총 ${notices.length}건`, `${notices.length} notice(s)`)}</p>
            <button
              onClick={() => { setNoticeForm({ title: "", content: "" }); setNoticeResult(null); }}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("새 공지 작성", "New Notice")}
            </button>
          </div>

          {/* 공지 작성 폼 */}
          {noticeForm !== null && (
            <div className="bg-slate-800 border border-blue-500/50 rounded-xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-200">{t("새 공지 작성 (3개 게시판 동시 등록)", "New Notice (posted to all 3 boards)")}</h2>
              <input
                type="text"
                placeholder={t("제목", "Title")}
                value={noticeForm.title}
                onChange={(e) => setNoticeForm((f) => f && { ...f, title: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder={t("내용", "Content")}
                rows={5}
                value={noticeForm.content}
                onChange={(e) => setNoticeForm((f) => f && { ...f, content: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 resize-none focus:outline-none focus:border-blue-500"
              />
              {noticeResult === "success" && (
                <p className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" />{t("3개 게시판에 공지가 등록됐습니다.", "Posted to all 3 boards.")}</p>
              )}
              {noticeResult === "error" && (
                <p className="text-xs text-red-400 flex items-center gap-1"><X className="w-3.5 h-3.5" />{noticeError}</p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setNoticeForm(null); setNoticeResult(null); }}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  {t("취소", "Cancel")}
                </button>
                <button
                  onClick={() => noticeForm && handleSaveNotice(noticeForm)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  <Pin className="w-3.5 h-3.5" />
                  {t("전체 게시판에 등록", "Post to All Boards")}
                </button>
              </div>
            </div>
          )}

          {/* 공지 목록 */}
          {noticesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : notices.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">
              {t("등록된 공지사항이 없습니다.", "No notices yet.")}
            </p>
          ) : (
            <div className="space-y-2">
              {notices.map((notice) => (
                <div key={notice.id} className="bg-slate-800 rounded-xl p-4">
                  {deleteConfirm === notice.id ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-300">
                        {t("정말 삭제하시겠습니까?", "Delete this notice?")}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-xs text-slate-400 bg-slate-700 rounded-lg"
                        >
                          {t("취소", "Cancel")}
                        </button>
                        <button
                          onClick={() => deleteNotice.mutate(notice.id)}
                          className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                        >
                          {deleteNotice.isPending ? "..." : t("삭제", "Delete")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-100 truncate">{notice.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(notice.created_at)}</p>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{notice.content}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setDeleteConfirm(notice.id)}
                          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 피드백 탭 ────────────────────────────────────────────────────────── */}
      {tab === "feedbacks" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">{t(`총 ${feedbacks.length}건`, `${feedbacks.length} feedback(s)`)}</p>

          {feedbacksLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">
              {t("접수된 피드백이 없습니다.", "No feedbacks yet.")}
            </p>
          ) : (
            <div className="space-y-2">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="bg-slate-800 rounded-xl p-4">
                  {deleteConfirm === fb.id ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-300">{t("정말 삭제하시겠습니까?", "Delete this feedback?")}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 text-xs text-slate-400 bg-slate-700 rounded-lg"
                        >
                          {t("취소", "Cancel")}
                        </button>
                        <button
                          onClick={() => deleteFeedback.mutate(fb.id)}
                          className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                        >
                          {deleteFeedback.isPending ? "..." : t("삭제", "Delete")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-100 whitespace-pre-wrap">{fb.content}</p>
                        <div className="flex gap-3 mt-1.5">
                          {fb.email && (
                            <span className="text-xs text-blue-400">{fb.email}</span>
                          )}
                          <span className="text-xs text-slate-500">{formatDate(fb.created_at)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeleteConfirm(fb.id)}
                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 캐시 관리 탭 ──────────────────────────────────────────────────────── */}
      {tab === "cache" && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            {t("캐시를 삭제하면 다음 조회 시 외부 API에서 새로 데이터를 가져옵니다.", "Clearing cache forces fresh data from external APIs on next request.")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CACHE_TARGETS.map(({ key, ko, en }) => {
              const status = cacheStatus[key] ?? "idle";
              return (
                <button
                  key={key}
                  onClick={() => handleClearCache(key)}
                  disabled={status === "loading"}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors",
                    key === "all"
                      ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 col-span-full"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700",
                    status === "loading" && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span>{t(ko, en)}</span>
                  {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                  {status === "done" && <Check className="w-4 h-4 text-emerald-400" />}
                  {status === "error" && <X className="w-4 h-4 text-red-400" />}
                  {status === "idle" && <Trash2 className="w-4 h-4 opacity-50" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* ── AI 사용량 탭 ──────────────────────────────────────────────────────── */}
      {tab === "usage" && <UsageTab t={t} />}

      {/* ── 방문 통계 탭 ──────────────────────────────────────────────────────── */}
      {tab === "analytics" && <AnalyticsTab t={t} />}

      {/* ── 웹툰 플랫폼 관리 탭 ──────────────────────────────────────────────── */}
      {tab === "webtoon" && <WebtoonPlatformTab t={t} />}
    </div>
  );
}

// ── AI 사용량 통계 컴포넌트 ────────────────────────────────────────────────
interface UsageSummary {
  total: number;
  success: number;
  successRate: number;
  avgDuration: number;
  cachedMovies: number;
}
interface ProviderStat {
  name: string;
  model: string;
  total: number;
  success: number;
  successRate: number;
  avgMs: number;
}
interface DailyStat {
  day: string;
  total: number;
  success: number;
}
interface UsageData {
  summary: UsageSummary;
  providers: ProviderStat[];
  daily: DailyStat[];
}

function UsageTab({ t }: { t: (ko: string, en: string) => string }) {
  const { data, isLoading, isError, refetch } = useQuery<UsageData>({
    queryKey: ["admin-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-ai-usage");
      if (error) throw error;
      return data as UsageData;
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-slate-500 text-sm">{t("데이터를 불러오지 못했습니다.", "Failed to load usage data.")}</p>
        <button onClick={() => refetch()} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
          {t("다시 시도", "Retry")}
        </button>
      </div>
    );
  }

  const { summary, providers, daily } = data;

  const summaryCards = [
    { label: t("총 AI 호출 (30일)", "Total AI Calls (30d)"), value: summary.total.toLocaleString() },
    { label: t("성공률", "Success Rate"),                     value: `${summary.successRate}%` },
    { label: t("평균 응답시간", "Avg Duration"),               value: `${(summary.avgDuration / 1000).toFixed(1)}s` },
    { label: t("분석된 영화 수", "Analyzed Movies"),           value: summary.cachedMovies.toLocaleString() },
  ];

  const chartData = daily.map((d) => ({
    day: d.day.slice(5), // "MM-DD" 형식
    total: d.total,
    success: d.success,
  }));

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map(({ label, value }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* 일별 호출 차트 */}
      {chartData.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">{t("최근 7일 AI 호출 추이", "AI Calls — Last 7 Days")}</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={24}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#94a3b8" }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="total" name={t("전체", "Total")} radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="#3b82f6" />
                ))}
              </Bar>
              <Bar dataKey="success" name={t("성공", "Success")} radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="#22c55e" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 프로바이더별 통계 */}
      {providers.length > 0 && (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
            <Bot className="w-4 h-4 text-blue-400" />
            <p className="text-xs font-semibold text-slate-300">{t("AI 프로바이더별 통계", "Provider Statistics")}</p>
          </div>
          <div className="divide-y divide-slate-700">
            {providers.map((p) => (
              <div key={p.name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-200 capitalize">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.model}</p>
                </div>
                <div className="flex gap-6 text-right">
                  <div>
                    <p className="text-xs text-slate-500">{t("호출", "Calls")}</p>
                    <p className="text-sm font-medium text-slate-200">{p.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t("성공률", "Success")}</p>
                    <p className={cn("text-sm font-medium", p.successRate >= 80 ? "text-green-400" : p.successRate >= 50 ? "text-yellow-400" : "text-red-400")}>
                      {p.successRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t("평균시간", "Avg")}</p>
                    <p className="text-sm font-medium text-slate-200">{(p.avgMs / 1000).toFixed(1)}s</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {providers.length === 0 && (
        <p className="text-center py-8 text-slate-500 text-sm">
          {t("아직 AI 사용 기록이 없습니다.", "No AI usage records yet.")}
        </p>
      )}
    </div>
  );
}

// ── 방문 통계 컴포넌트 ─────────────────────────────────────────────────────
interface AnalyticsData {
  summary: { totalVisits: number; uniqueIPs: number; totalMovieViews: number; totalDramaViews: number; totalAnimeViews: number; totalWebtoonViews: number };
  dailyVisits: { day: string; count: number }[];
  topIPs: { ip: string; count: number }[];
  topMovies: { movie_id: string; movie_title: string; poster_path: string | null; count: number }[];
  topDramas: { drama_id: string; title: string; count: number }[];
  topAnime: { mal_id: number; title: string; count: number }[];
  topWebtoons: { webtoon_id: string; title: string; count: number }[];
}

function AnalyticsTab({ t }: { t: (ko: string, en: string) => string }) {
  const { data, isLoading, isError, refetch } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-analytics");
      if (error) throw error;
      return data as AnalyticsData;
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-800 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-slate-500 text-sm">{t("데이터를 불러오지 못했습니다.", "Failed to load analytics.")}</p>
        <button onClick={() => refetch()} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
          {t("다시 시도", "Retry")}
        </button>
      </div>
    );
  }

  const { summary, dailyVisits, topIPs, topMovies, topDramas, topAnime, topWebtoons } = data;
  const chartData = dailyVisits.map((d) => ({ day: d.day.slice(5), count: d.count }));

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("총 방문 수 (30일)", "Total Visits (30d)"),      value: summary.totalVisits.toLocaleString(),              color: "text-purple-400" },
          { label: t("고유 IP (30일)", "Unique IPs (30d)"),           value: summary.uniqueIPs.toLocaleString(),                color: "text-slate-100"  },
          { label: t("영화 조회 수 (30일)", "Movie Views (30d)"),     value: summary.totalMovieViews.toLocaleString(),             color: "text-blue-400"   },
          { label: t("드라마 조회 수 (30일)", "Drama Views (30d)"),   value: (summary.totalDramaViews ?? 0).toLocaleString(),      color: "text-indigo-400" },
          { label: t("애니 조회 수 (30일)", "Anime Views (30d)"),     value: summary.totalAnimeViews.toLocaleString(),             color: "text-pink-400"   },
          { label: t("웹툰 조회 수 (30일)", "Webtoon Views (30d)"),   value: (summary.totalWebtoonViews ?? 0).toLocaleString(),    color: "text-green-400"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* 일별 방문 차트 */}
      {chartData.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-3">{t("최근 7일 방문 추이", "Visits — Last 7 Days")}</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#94a3b8" }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="count" name={t("방문", "Visits")} radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill="#8b5cf6" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* IP별 방문 TOP 10 */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 px-4 py-3 border-b border-slate-700">
            {t("IP별 방문 TOP 10", "Top IPs")}
          </p>
          {topIPs.length === 0 ? (
            <p className="text-center py-6 text-slate-500 text-xs">{t("데이터 없음", "No data")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">
              <div className="divide-y divide-slate-700">
                {topIPs.slice(0, 5).map((item, i) => (
                  <div key={item.ip} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-slate-500 w-4 shrink-0">{i + 1}</span>
                      <span className="text-xs text-slate-300 font-mono truncate">{item.ip}</span>
                    </div>
                    <span className="text-xs font-medium text-purple-400 shrink-0 ml-2">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-slate-700">
                {topIPs.slice(5).map((item, i) => (
                  <div key={item.ip} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-slate-500 w-4 shrink-0">{i + 6}</span>
                      <span className="text-xs text-slate-300 font-mono truncate">{item.ip}</span>
                    </div>
                    <span className="text-xs font-medium text-purple-400 shrink-0 ml-2">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 영화 조회 TOP 10 */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <p className="text-xs font-semibold text-slate-400 px-4 py-3 border-b border-slate-700">
            {t("영화 조회 TOP 10 (30일)", "Top Movies (30d)")}
          </p>
          {topMovies.length === 0 ? (
            <p className="text-center py-6 text-slate-500 text-xs">{t("데이터 없음", "No data")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">
              <div className="divide-y divide-slate-700">
                {topMovies.slice(0, 5).map((item, i) => (
                  <div key={item.movie_id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-slate-500 w-4 shrink-0">{i + 1}</span>
                      <span className="text-xs text-slate-300 truncate">{item.movie_title}</span>
                    </div>
                    <span className="text-xs font-medium text-blue-400 shrink-0 ml-2">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="divide-y divide-slate-700">
                {topMovies.slice(5).map((item, i) => (
                  <div key={item.movie_id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-slate-500 w-4 shrink-0">{i + 6}</span>
                      <span className="text-xs text-slate-300 truncate">{item.movie_title}</span>
                    </div>
                    <span className="text-xs font-medium text-blue-400 shrink-0 ml-2">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 드라마 조회 TOP 10 */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <p className="text-xs font-semibold text-slate-400 px-4 py-3 border-b border-slate-700">
          {t("드라마 조회 TOP 10 (30일)", "Top Dramas (30d)")}
        </p>
        {topDramas.length === 0 ? (
          <p className="text-center py-6 text-slate-500 text-xs">{t("데이터 없음", "No data")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">
            <div className="divide-y divide-slate-700">
              {topDramas.slice(0, 5).map((item, i) => (
                <div key={item.drama_id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-slate-500 w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs text-slate-300 truncate">{item.title}</span>
                  </div>
                  <span className="text-xs font-medium text-indigo-400 shrink-0 ml-2">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-700">
              {topDramas.slice(5, 10).map((item, i) => (
                <div key={item.drama_id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-slate-500 w-4 shrink-0">{i + 6}</span>
                    <span className="text-xs text-slate-300 truncate">{item.title}</span>
                  </div>
                  <span className="text-xs font-medium text-indigo-400 shrink-0 ml-2">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 애니 조회 TOP 10 */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <p className="text-xs font-semibold text-slate-400 px-4 py-3 border-b border-slate-700">
          {t("애니 조회 TOP 10 (30일)", "Top Anime (30d)")}
        </p>
        {topAnime.length === 0 ? (
          <p className="text-center py-6 text-slate-500 text-xs">{t("데이터 없음", "No data")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">
            <div className="divide-y divide-slate-700">
              {topAnime.slice(0, 5).map((item, i) => (
                <div key={item.mal_id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-slate-500 w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs text-slate-300 truncate">{item.title}</span>
                  </div>
                  <span className="text-xs font-medium text-pink-400 shrink-0 ml-2">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-700">
              {topAnime.slice(5, 10).map((item, i) => (
                <div key={item.mal_id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-slate-500 w-4 shrink-0">{i + 6}</span>
                    <span className="text-xs text-slate-300 truncate">{item.title}</span>
                  </div>
                  <span className="text-xs font-medium text-pink-400 shrink-0 ml-2">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 웹툰 조회 TOP 10 */}
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <p className="text-xs font-semibold text-slate-400 px-4 py-3 border-b border-slate-700">
          {t("웹툰 조회 TOP 10 (30일)", "Top Webtoons (30d)")}
        </p>
        {topWebtoons.length === 0 ? (
          <p className="text-center py-6 text-slate-500 text-xs">{t("데이터 없음", "No data")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-700">
            <div className="divide-y divide-slate-700">
              {topWebtoons.slice(0, 5).map((item, i) => (
                <div key={item.webtoon_id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-slate-500 w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs text-slate-300 truncate">{item.title}</span>
                  </div>
                  <span className="text-xs font-medium text-green-400 shrink-0 ml-2">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="divide-y divide-slate-700">
              {topWebtoons.slice(5, 10).map((item, i) => (
                <div key={item.webtoon_id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-slate-500 w-4 shrink-0">{i + 6}</span>
                    <span className="text-xs text-slate-300 truncate">{item.title}</span>
                  </div>
                  <span className="text-xs font-medium text-green-400 shrink-0 ml-2">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 웹툰 플랫폼 관리 컴포넌트 ─────────────────────────────────────────────
interface PlatformEntry {
  id: string;
  platform: string;
  mangadex_id: string;
  platform_url: string | null;
  sort_order: number;
}

function WebtoonPlatformTab({ t }: { t: (ko: string, en: string) => string }) {
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<string>(PLATFORMS[0].key);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Webtoon[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [platformUrl, setPlatformUrl] = useState("");

  // 현재 플랫폼 등록 목록
  const { data: entries = [], isLoading } = useQuery<PlatformEntry[]>({
    queryKey: ["admin-webtoon-platform", selectedPlatform],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webtoon_platforms")
        .select("*")
        .eq("platform", selectedPlatform)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // 웹툰 검색
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("search-webtoon", {
        body: { query: searchQuery.trim() },
      });
      if (error) throw error;
      setSearchResults((data?.data as Webtoon[]) ?? []);
    } finally {
      setSearchLoading(false);
    }
  }

  // 플랫폼에 웹툰 추가
  const addEntry = useMutation({
    mutationFn: async (webtoon: Webtoon) => {
      const maxOrder = entries.length > 0 ? Math.max(...entries.map((e) => e.sort_order)) : 0;
      const { error } = await supabase.from("webtoon_platforms").insert({
        platform: selectedPlatform,
        mangadex_id: webtoon.id,
        platform_url: platformUrl.trim() || null,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-webtoon-platform", selectedPlatform] });
      queryClient.invalidateQueries({ queryKey: ["webtoon-platform", selectedPlatform] });
      setAddingId(null);
      setPlatformUrl("");
    },
  });

  // 삭제
  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webtoon_platforms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-webtoon-platform", selectedPlatform] });
      queryClient.invalidateQueries({ queryKey: ["webtoon-platform", selectedPlatform] });
      setDeleteConfirm(null);
    },
  });

  const platform = PLATFORMS.find((p) => p.key === selectedPlatform)!;

  return (
    <div className="space-y-6">
      {/* 플랫폼 선택 */}
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            onClick={() => { setSelectedPlatform(p.key); setSearchResults([]); }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
              selectedPlatform === p.key
                ? `${p.color} ${p.bg} ${p.border} scale-105`
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
            )}
          >
            <span className={cn("w-5 h-5 rounded flex items-center justify-center text-xs font-bold",
              selectedPlatform === p.key ? p.bg : "bg-slate-700"
            )}>{p.icon}</span>
            {p.name}
          </button>
        ))}
      </div>

      {/* 현재 등록 목록 */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-300">
          <span className={platform.color}>{platform.name}</span>{" "}
          {t(`등록 웹툰 (${entries.length}건)`, `Registered (${entries.length})`)}
        </p>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center py-6 text-slate-500 text-sm">{t("등록된 웹툰이 없습니다.", "No webtoons registered.")}</p>
        ) : (
          <div className="space-y-1.5">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-2.5">
                {deleteConfirm === entry.id ? (
                  <>
                    <p className="text-sm text-slate-300">{t("삭제하시겠습니까?", "Delete?")}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1 text-xs text-slate-400 bg-slate-700 rounded-lg">{t("취소", "Cancel")}</button>
                      <button onClick={() => deleteEntry.mutate(entry.id)}
                        className="px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors">
                        {deleteEntry.isPending ? "..." : t("삭제", "Delete")}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-slate-400 truncate">{entry.mangadex_id}</p>
                      {entry.platform_url && (
                        <p className="text-xs text-green-400 truncate">{entry.platform_url}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-xs text-slate-500">#{entry.sort_order}</span>
                      <button onClick={() => setDeleteConfirm(entry.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 웹툰 검색 & 추가 */}
      <div className="space-y-3 border-t border-slate-700 pt-4">
        <p className="text-sm font-semibold text-slate-300">{t("웹툰 검색 & 추가", "Search & Add Webtoon")}</p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("웹툰 제목 검색...", "Search webtoon title...")}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
          <button type="submit" disabled={searchLoading || !searchQuery.trim()}
            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5">
            {searchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {t("검색", "Search")}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {searchResults.map((w) => (
              <div key={w.id} className="bg-slate-800 rounded-xl p-3">
                {addingId === w.id ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-200">{w.title}</p>
                    <input
                      type="text"
                      value={platformUrl}
                      onChange={(e) => setPlatformUrl(e.target.value)}
                      placeholder={t("플랫폼 URL (선택)", "Platform URL (optional)")}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-green-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setAddingId(null); setPlatformUrl(""); }}
                        className="px-3 py-1.5 text-xs text-slate-400 bg-slate-700 rounded-lg">{t("취소", "Cancel")}</button>
                      <button onClick={() => addEntry.mutate(w)} disabled={addEntry.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors">
                        {addEntry.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        {t("추가", "Add")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {w.cover_url ? (
                        <img src={w.cover_url} alt={w.title} className="w-8 h-11 object-cover rounded shrink-0" />
                      ) : (
                        <div className="w-8 h-11 bg-slate-700 rounded shrink-0 flex items-center justify-center text-lg">📖</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{w.title}</p>
                        <p className="text-xs text-slate-500">{w.author} · {w.year ?? "-"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const alreadyAdded = entries.some((e) => e.mangadex_id === w.id);
                        if (alreadyAdded) return;
                        setAddingId(w.id);
                      }}
                      disabled={entries.some((e) => e.mangadex_id === w.id)}
                      className={cn(
                        "shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors",
                        entries.some((e) => e.mangadex_id === w.id)
                          ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-500 text-white"
                      )}
                    >
                      <Plus className="w-3 h-3" />
                      {entries.some((e) => e.mangadex_id === w.id) ? t("추가됨", "Added") : t("추가", "Add")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

