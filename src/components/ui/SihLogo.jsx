import { Zap } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * SihLogo Component
 * Theme-consistent brand logo matching the Spider-Man & Tech Hackathon design system.
 * Uses Web Navy (#0a1f5c), Spidey Red (#e11d2e), & Gold (#f5c518).
 */
export function SihLogo({ variant = "light", size = "md", showSubtitle = true, className }) {
  const isDark = variant === "dark";

  return (
    <div className={cn("inline-flex items-center gap-2.5 group leading-none select-none", className)}>
      {/* Icon Badge */}
      <div
        className={cn(
          "flex items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-2deg]",
          size === "sm" ? "w-7 h-7" : size === "lg" ? "w-11 h-11" : "w-9 h-9",
          isDark
            ? "bg-gradient-to-br from-spidey via-spidey/90 to-web text-gold border border-gold/40 shadow-[0_2px_12px_rgba(225,29,46,0.4)]"
            : "bg-gradient-to-br from-web via-web/95 to-spidey text-gold border border-web/20 shadow-[0_4px_14px_rgba(10,31,92,0.2)]"
        )}
      >
        <Zap
          className={cn(
            "fill-gold text-gold transition-transform duration-300 group-hover:scale-110",
            size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-6 h-6" : "w-4.5 h-4.5"
          )}
        />
      </div>

      {/* Typography */}
      <div className="flex flex-col">
        <div className="flex items-center leading-none">
          <span
            className={cn(
              "font-display tracking-wider font-black transition-colors duration-200",
              size === "sm" ? "text-xl" : size === "lg" ? "text-4xl md:text-5xl" : "text-2xl md:text-3xl",
              isDark ? "text-white group-hover:text-gold" : "text-web group-hover:text-spidey"
            )}
          >
            SIH
          </span>
          <span
            className={cn(
              "font-display font-black ml-1.5 px-2 py-0.5 rounded-md transition-all duration-300",
              size === "sm" ? "text-xs" : size === "lg" ? "text-lg md:text-xl" : "text-xs md:text-sm",
              isDark
                ? "bg-gold text-ink font-extrabold shadow-xs group-hover:bg-white"
                : "bg-spidey text-white shadow-[0_2px_8px_rgba(225,29,46,0.35)] group-hover:bg-web"
            )}
          >
            2026
          </span>
        </div>
        {showSubtitle && (
          <span
            className={cn(
              "font-ui font-black uppercase tracking-[0.22em] transition-colors duration-200 mt-0.5",
              size === "sm" ? "text-[7.5px]" : size === "lg" ? "text-[10px] md:text-[11px]" : "text-[8.5px] md:text-[9.5px]",
              isDark ? "text-gold/90" : "text-slate-500 group-hover:text-web"
            )}
          >
            Smart India Hackathon
          </span>
        )}
      </div>
    </div>
  );
}
