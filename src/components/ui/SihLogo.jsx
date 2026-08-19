import { cn } from "../../utils/cn";

export function SihLogo({ variant = "light", size = "md", showSubtitle = true, className }) {
  const heightClasses =
    size === "sm"
      ? "h-8"
      : size === "lg"
      ? "h-14 md:h-16"
      : "h-10 md:h-12";

  return (
    <div className={cn("inline-flex items-center group leading-none select-none", className)}>
      <img
        src="/sih-logo.png"
        alt="Smart India Hackathon 2026 Logo"
        className={cn(
          "w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-md",
          heightClasses
        )}
      />
    </div>
  );
}
