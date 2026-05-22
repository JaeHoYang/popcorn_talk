import { useState, useRef, useEffect } from "react";
import { Share2, Link, Check, X, Twitter, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  imageUrl?: string;
}

export default function ShareButton({ title, description, imageUrl }: Props) {
  const [open, setOpen]       = useState(false);
  const [copied, setCopied]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const url = window.location.href;
  const text = description ? `${title} — ${description}` : title;

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleNativeShare() {
    try {
      await navigator.share({ title, text: description ?? title, url });
      setOpen(false);
    } catch { /* 취소 시 무시 */ }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
  }

  function shareTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank", "noopener,noreferrer,width=600,height=400"
    );
    setOpen(false);
  }

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank", "noopener,noreferrer,width=600,height=400"
    );
    setOpen(false);
  }

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        title="공유"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700">
            <span className="text-xs font-semibold text-slate-300">공유하기</span>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="py-1">
            {/* 네이티브 공유 (모바일) */}
            {hasNativeShare && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <Share2 className="w-4 h-4 text-purple-400" />
                기기 공유 시트
              </button>
            )}

            {/* 링크 복사 */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              {copied
                ? <Check className="w-4 h-4 text-green-400" />
                : <Link  className="w-4 h-4 text-blue-400"  />
              }
              <span className={cn(copied && "text-green-400")}>
                {copied ? "복사 완료!" : "링크 복사"}
              </span>
            </button>

            {/* X (Twitter) */}
            <button
              onClick={shareTwitter}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Twitter className="w-4 h-4 text-sky-400" />
              X (Twitter)
            </button>

            {/* Facebook */}
            <button
              onClick={shareFacebook}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Facebook className="w-4 h-4 text-blue-500" />
              Facebook
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
