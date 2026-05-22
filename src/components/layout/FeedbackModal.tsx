import { useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: Props) {
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  if (!isOpen) return null;

  function handleClose() {
    setContent("");
    setEmail("");
    setStatus("idle");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const { error } = await supabase
      .from("feedbacks")
      .insert({ content: content.trim(), email: email.trim() || null });
    if (error) {
      setStatus("error");
    } else {
      setStatus("done");
      setContent("");
      setEmail("");
      setTimeout(handleClose, 1500);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-100">{t("피드백 보내기", "Send Feedback")}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === "done" ? (
          <div className="py-8 text-center">
            <p className="text-2xl mb-2">😊</p>
            <p className="text-emerald-400 font-medium">
              {t("피드백이 전송되었습니다! 감사합니다.", "Feedback sent! Thank you.")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                {t("내용", "Message")} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={4}
                placeholder={t(
                  "서비스 개선 의견, 버그 제보 등을 자유롭게 남겨주세요.",
                  "Share suggestions, bug reports, or any feedback."
                )}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 resize-none focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                {t("이메일 (선택)", "Email (optional)")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>
            {status === "error" && (
              <p className="text-xs text-red-400">
                {t("전송에 실패했습니다. 다시 시도해 주세요.", "Failed to send. Please try again.")}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 text-sm text-slate-400 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {t("취소", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={status === "loading" || !content.trim()}
                className="flex-1 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors"
              >
                {status === "loading" ? t("전송 중...", "Sending...") : t("전송", "Send")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
