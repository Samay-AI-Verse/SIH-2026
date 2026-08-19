import { useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle, Sparkles } from "lucide-react";
import { WHATSAPP_GROUP_URL } from "../utils/constants";

export function WhatsAppCard({ className = "" }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(WHATSAPP_GROUP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-4 border-[#071433] bg-gradient-to-br from-[#0b6632] via-[#128c7e] to-[#075e54] p-5 sm:p-7 text-white shadow-[8px_8px_0_#071433] ${className}`}
    >
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/25 px-3 py-1 text-[11px] sm:text-xs font-black tracking-widest text-white uppercase backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            </span>
            Official SIH 2026 Channel
          </div>
          <span className="flex items-center gap-1 text-xs font-black text-amber-200">
            <Sparkles size={14} className="text-amber-300" /> Mandatory for Leaders
          </span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-start gap-3.5">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/20 text-white backdrop-blur-md shadow-inner">
            <MessageCircle size={28} className="fill-white/30 stroke-white stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-white tracking-wide leading-tight">
              Join Official WhatsApp Group
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-white/90 leading-relaxed">
              Stay updated on problem statement locking, live slot updates, mentor allocations, and hackathon schedules.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shine inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border-3 border-[#071433] bg-[#25D366] px-5 py-3.5 text-sm sm:text-base font-black uppercase tracking-wider text-[#071433] shadow-[4px_4px_0_#071433] transition hover:brightness-110 active:scale-95"
          >
            <MessageCircle size={20} className="fill-[#071433]/20" />
            <span>Join Official WhatsApp Group</span>
            <ExternalLink size={15} />
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 bg-white/20 px-4 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-white/30 active:scale-95"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-300" /> Copied Group Link!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
