import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import FeedbackModal from "./FeedbackModal";

export default function Footer() {
  const { t } = useLanguage();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-slate-800 bg-slate-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm text-slate-400">© 2026 Popcorn Talk. All rights reserved.</p>
            <p className="text-xs text-slate-500 mt-1">
              {t(
                "AI는 실수할 수 있습니다. 중요한 정보는 반드시 직접 확인하세요.",
                "AI can make mistakes. Always verify important information yourself."
              )}
            </p>
          </div>
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {t("피드백 보내기", "Send Feedback")}
          </button>
        </div>
      </footer>
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
