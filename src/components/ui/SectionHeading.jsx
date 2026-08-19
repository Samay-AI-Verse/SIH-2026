import { cn } from "../../utils/cn";

export function SectionHeading({ eyebrow, title, copy, align = "center" }) {
  return (
    <div className={cn("mx-auto max-w-3xl", align === "center" ? "text-center" : "text-left")} data-reveal>
      {eyebrow ? (
        <p className="font-ui mb-3 text-xs font-bold uppercase tracking-[0.32em] text-spidey">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-5xl text-web md:text-6xl">{title}</h2>
      {copy ? <p className="mt-4 text-base text-ink/65 md:text-lg">{copy}</p> : null}
    </div>
  );
}
