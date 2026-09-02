import { cn } from "../../utils/cn";

export function SihLogo({ variant = "light", size = "md", className }) {
  const heightClasses =
    size === "sm"
      ? "h-8 sm:h-9"
      : size === "lg"
      ? "h-16 sm:h-20 md:h-20"
      : "h-10 sm:h-11 md:h-12";

  return (
    <div className={cn("inline-flex items-center group leading-none select-none", className)}>
      <img
        src="/sih_official_logo.png?v=3"
        alt="Smart India Hackathon 2026 Logo"
        className={cn(
          "w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm",
          heightClasses
        )}
      />
    </div>
  );
}
