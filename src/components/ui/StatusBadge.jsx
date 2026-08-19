import { cn } from "../../utils/cn";

export function StatusBadge({ tone, children }) {
  const map = {
    green: "bg-gold/25 text-web border-gold",
    yellow: "bg-gold/20 text-ink border-gold/40",
    red: "bg-spidey/10 text-spidey border-spidey/30",
    blue: "bg-web/10 text-web border-web/30",
    slate: "bg-ink/5 text-ink/70 border-ink/10",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em]",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}
