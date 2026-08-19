import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Megaphone, Users, LayoutDashboard } from "lucide-react";
import { Button } from "./ui/Button";
import { FemaleMark, Skyline, WebOverlay } from "./SpideyArt";
import { PROBLEM_STATEMENTS_PDF } from "../utils/constants";
import { useReducedMotion } from "../hooks/useReducedMotion";

export function Hero() {
  const { simplify } = useReducedMotion();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const poseShift = simplify ? undefined : { transform: `translate3d(${mouse.x * 16}px, ${mouse.y * 10}px, 0)` };

  return (
    <section
      id="home"
      className="relative isolate overflow-hidden web-bg pt-24 text-white"
      onMouseMove={(event) => {
        if (simplify) return;
        const { innerWidth, innerHeight } = window;
        setMouse({ x: (event.clientX / innerWidth - 0.5) * 2, y: (event.clientY / innerHeight - 0.5) * 2 });
      }}
    >
      {/* Background Lighting Effects */}
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="hero-vignette pointer-events-none absolute inset-0" />
      <WebOverlay />
      <Skyline className="pointer-events-none absolute bottom-[100px] left-0 w-full opacity-40 md:bottom-[80px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-12 pt-6 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pb-16 lg:pt-8">
        
        {/* Left Content Column */}
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-spidey/50 bg-spidey/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-gold shadow-[0_0_12px_rgba(225,29,46,0.3)]">
              <span className="h-2 w-2 rounded-full bg-spidey pulse-live" />
              <span>Registration Open</span>
            </div>

            {/* Main Title */}
            <h1 className="font-display mt-3 text-5xl sm:text-7xl leading-[0.88] text-white md:text-8xl lg:text-[7.2rem]">
              SIH <span className="text-gold">2026</span>
            </h1>
            <div className="font-display text-2xl sm:text-4xl leading-tight md:text-5xl">
              <span className="text-white">SMART INDIA </span>
              <span className="text-spidey font-extrabold">HACKATHON</span>
            </div>
          </motion.div>

          {/* Slogan Banner */}
          <div className="brush-banner mt-6 px-4 py-2.5 rounded-r-md">
            <p className="font-ui text-sm font-extrabold uppercase tracking-[0.16em] text-web md:text-base">
              India's Biggest <span className="text-spidey">Innovation Challenge</span>
            </p>
          </div>

          {/* Concise Description */}
          <p className="mt-4 max-w-lg text-sm md:text-base leading-relaxed text-white/85">
            Build real-world solutions for national problem statements. Work in teams of 6, solve real challenges, and win prizes!
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="slash-cta font-ui inline-flex items-center gap-2 rounded-md bg-spidey px-6 py-3 text-base font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#b51221] shadow-[0_0_20px_rgba(225,29,46,0.5)]"
            >
              <Megaphone size={18} /> Register Now
            </Link>

            <Link
              to="/dashboard"
              className="font-ui inline-flex items-center gap-2 rounded-md border-2 border-spidey bg-spidey/20 px-5 py-3 text-base font-bold uppercase tracking-[0.14em] text-white transition hover:bg-spidey shadow-[0_0_15px_rgba(225,29,46,0.3)]"
            >
              <LayoutDashboard size={18} /> Dashboard
            </Link>

            <Button variant="secondary" to="/problems" className="py-3">
              Explore Problems
            </Button>
          </div>
        </div>

        {/* Right Spidey Graphic */}
        <div className="relative mx-auto aspect-square w-full max-w-[480px] lg:max-w-none lg:min-h-[520px]">
          <div className="pointer-events-none absolute left-1/2 top-[25%] h-64 w-64 -translate-x-1/2 rounded-full bg-spidey/30 blur-3xl lg:h-80 lg:w-80" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={poseShift}
          >
            <div className={`h-full w-full ${simplify ? "" : "spidey-float"}`}>
              <img
                src="/heropng.png"
                alt="Smart India Hackathon Hero Visual"
                className="spidey-png h-full w-full object-contain object-center drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                fetchPriority="high"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Announcement Bar */}
      <div className="relative z-10 border-t-2 border-web/20 bg-white/95 px-4 py-3.5 text-ink backdrop-blur-md shadow-sm">
        <div className="font-ui mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs md:text-sm font-black uppercase tracking-[0.12em]">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-2 text-web">
              <Users size={16} className="text-spidey" /> Team of 6 Members
            </span>
            <span className="flex items-center gap-2 text-web">
              <FemaleMark className="h-4 w-4 text-spidey" /> 1 Female Mandatory
            </span>
            <span className="flex items-center gap-2 text-ink/80">
              Registration Fee: <span className="text-spidey font-black">₹300</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={PROBLEM_STATEMENTS_PDF}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-web bg-gold px-3.5 py-1 text-xs font-black text-web hover:bg-gold-light transition shadow-sm"
            >
              <FileText size={14} /> Download PDF
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
