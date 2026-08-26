import { cn } from "../../utils/cn";
import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";

export function StatusBadge({ status, tone, children, className }) {
  // If tone is provided with children (legacy pattern)
  if (tone && children) {
    const toneMap = {
      green: "bg-emerald-100/90 text-emerald-800 border-emerald-300",
      yellow: "bg-amber-100/90 text-amber-900 border-amber-300",
      red: "bg-rose-100/90 text-rose-800 border-rose-300",
      blue: "bg-blue-100/90 text-blue-800 border-blue-300",
      slate: "bg-slate-100 text-slate-700 border-slate-300",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-black tracking-wide uppercase shadow-2xs whitespace-nowrap",
          toneMap[tone] || toneMap.slate,
          className
        )}
      >
        {children}
      </span>
    );
  }

  // Determine status details
  const rawStatus = (status || children || "").toString().toUpperCase().trim();

  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-300";
  let label = rawStatus || "PENDING";
  let Icon = Clock;

  if (rawStatus === "SUCCESS" || rawStatus === "CONFIRMED" || rawStatus === "APPROVED" || rawStatus === "PAID") {
    badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs";
    label = rawStatus === "SUCCESS" || rawStatus === "PAID" ? "Paid & Confirmed" : "Confirmed";
    Icon = CheckCircle2;
  } else if (rawStatus === "PENDING" || rawStatus === "PENDING_PAYMENT" || rawStatus === "PROCESSING" || rawStatus === "SUBMITTED") {
    badgeStyle = "bg-amber-50 text-amber-800 border-amber-300";
    label = rawStatus === "PENDING_PAYMENT" ? "Pending Payment" : "Pending Verification";
    Icon = Clock;
  } else if (rawStatus.includes("CANCELLED") || rawStatus === "REFUNDED" || rawStatus === "FAILED" || rawStatus === "REJECTED") {
    badgeStyle = "bg-rose-50 text-rose-800 border-rose-300";
    label = rawStatus === "REFUNDED" ? "Refunded" : rawStatus.includes("CANCELLED") ? "Cancelled" : "Failed";
    Icon = XCircle;
  } else if (rawStatus) {
    label = rawStatus;
    Icon = ShieldCheck;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-black tracking-wide uppercase shadow-2xs whitespace-nowrap",
        badgeStyle,
        className
      )}
    >
      <Icon size={12} className="shrink-0" />
      <span>{children || label}</span>
    </span>
  );
}

