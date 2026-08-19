import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";
import { MaskBurst, MaskBurstLeft } from "./SpideyArt";

const stats = [
  { value: 100, suffix: "+", label: "Teams", accent: "text-spidey" },
  { value: 600, suffix: "+", label: "Contestants", accent: "text-web" },
  { value: 100, suffix: "+", label: "Problem Statements", accent: "text-gold" },
  { value: 2, suffix: "", label: "Teams Per Problem", accent: "text-spidey" },
];

export function About() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  const [counts, setCounts] = useState(stats.map(() => 0));

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setShown(true);
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shown) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setCounts(stats.map((item) => item.value));
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / 1200);
      setCounts(stats.map((item) => Math.round(item.value * progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown]);

  return (
    <section id="about" className="section-peach relative overflow-hidden px-4 pt-6 pb-16 md:pt-8 md:pb-20 md:px-6">
      {/* Left-Side Spidey Hanging (Flanking heading on the left) */}
      <MaskBurstLeft className="pointer-events-none absolute top-1 left-1 sm:left-4 md:left-6 lg:left-12 w-24 sm:w-36 md:w-48 lg:w-52 opacity-90 z-10 animate-bounce-slow" />
      
      {/* Right-Side Spidey Hanging (Flanking heading on the right) */}
      <MaskBurst className="pointer-events-none absolute top-1 right-1 sm:right-4 md:right-6 lg:right-12 w-24 sm:w-36 md:w-48 lg:w-52 opacity-90 z-10 animate-bounce-slow" />
      
      <div className="mx-auto max-w-7xl pt-2 sm:pt-4">
        <SectionHeading
          eyebrow="About SIH 2026"
          title="Where ideas become impact"
          copy="Smart India Hackathon 2026 at Gramin Technical and Management Campus, Nanded brings student teams together to solve nationally relevant challenges spanning AI, public infrastructure, healthcare, agriculture, and digital governance."
        />
        <div ref={ref} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item, index) => (
            <motion.div
              key={item.label}
              className="shine surface-card p-6 text-center"
              data-reveal
              whileHover={{ y: -8, rotate: index % 2 ? 1 : -1 }}
            >
              <p className={`font-display text-5xl comic-pop ${item.accent}`}>
                {counts[index]}
                {item.suffix}
              </p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-ink/50">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
