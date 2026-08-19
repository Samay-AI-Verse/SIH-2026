import { Link } from "react-router-dom";
import { FileText, Megaphone, ArrowRight } from "lucide-react";
import { Button } from "./ui/Button";
import { WebOverlay } from "./SpideyArt";
import { PROBLEM_STATEMENTS_PDF } from "../utils/constants";

export function CTA() {
  return (
    <section className="px-4 py-20 md:px-6">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] border-4 border-gold web-bg px-6 py-14 text-white shadow-[0_0_50px_rgba(225,29,46,0.3)]">
        <WebOverlay />

        {/* Superhero Glow Background Effect */}
        <div className="pointer-events-none absolute -right-12 bottom-0 top-0 w-1/2 bg-gradient-to-l from-spidey/25 via-gold/15 to-transparent blur-3xl" />

        {/* Clean, High-Quality Superhero Image (No ugly background cutouts) */}
        <div className="pointer-events-none absolute -right-6 -bottom-4 hidden h-[125%] max-h-[500px] w-auto md:block spidey-float">
          <img
            src="/hero/spidey-leap.png"
            alt="Smart India Hackathon Visual"
            aria-hidden="true"
            className="spidey-png h-full w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)]"
          />
        </div>

        {/* Left Side Content */}
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-gold mb-4 shadow-[0_0_12px_rgba(245,197,24,0.2)]">
            <span>⚡ Join National Innovation Challenge</span>
          </div>

          <h2 className="font-display text-5xl sm:text-6xl md:text-7xl leading-[0.95] text-white">
            Ready to build <span className="text-gold">the future?</span>
          </h2>
          
          <p className="font-ui mt-4 text-base sm:text-lg text-white/90 font-medium leading-relaxed max-w-xl">
            Your challenge is waiting. Your solution could change everything. Team up, solve real-world problems, and win national awards!
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="slash-cta font-ui inline-flex items-center gap-2 rounded-md bg-spidey px-7 py-3.5 text-base sm:text-lg font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_25px_rgba(225,29,46,0.6)] transition-all duration-200 hover:scale-105 hover:bg-[#b51221]"
            >
              <Megaphone size={20} /> Register now <ArrowRight size={18} />
            </Link>

            <Button variant="secondary" to="/problems" className="py-3.5 px-6 text-base">
              Explore Problems
            </Button>

            <Button variant="ghost" href={PROBLEM_STATEMENTS_PDF} target="_blank" rel="noreferrer" className="py-3.5 px-5">
              <FileText size={18} /> Official PDF
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

