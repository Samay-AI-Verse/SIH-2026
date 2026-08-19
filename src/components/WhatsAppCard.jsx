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
      className={`relative overflow-hidden rounded-2xl border-4 border-[#071433] bg-gradient-to-br from-[#0c8a44] via-[#128c7e] to-[#075e54] p-6 text-white shadow-[8px_8px_0_#071433] ${className}`}
    >
      {/* Decorative background circle */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3 py-1 text-xs font-black tracking-widest text-white uppercase backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
            </span>
            Official SIH Communication
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-200">
            <Sparkles size={14} /> Mandatory for Leaders
          </span>
        </div>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/15 text-white backdrop-blur-sm shadow-inner">
            <MessageCircle size={32} className="fill-white/20 stroke-white stroke-2" />
          </div>
          <div>
            <h3 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
              Join Official WhatsApp Group
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-white/85 leading-relaxed">
              Stay updated on problem statement locking, live slot updates, mentor allocations, and hackathon schedules.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shine inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#071433] bg-[#25D366] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#071433] shadow-[4px_4px_0_#071433] transition hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0"
          >
            <MessageCircle size={18} /> Join WhatsApp Group <ExternalLink size={14} />
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 bg-white/15 px-4 py-3 text-xs font-black uppercase tracking-wider text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-300" /> Copied Link!
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
