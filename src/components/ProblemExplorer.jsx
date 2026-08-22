import { ExternalLink, Lightbulb, Sparkles, FileText, CheckCircle2, ArrowRight, ShieldCheck, Info } from "lucide-react";
import { SectionHeading } from "./ui/SectionHeading";
import { Button } from "./ui/Button";
import { SIH_OFFICIAL_WEBSITE_URL, OPEN_INNOVATION_PROBLEM } from "../utils/constants";

export function ProblemExplorer({ compact = false, canSelect = false, selectedProblemId, onSelect }) {
  const isSelectedPS = Boolean(selectedProblemId && selectedProblemId !== "OPEN_INNOVATION");
  const isSelectedOpenInno = Boolean(selectedProblemId === "OPEN_INNOVATION");

  return (
    <section id="problems" className="section-lilac px-4 py-12 md:py-20 md:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="SIH 2026 Problem Statement Allocation Workflow"
          title="How Problem Statement Selection Works"
          copy="Follow the simple step-by-step process to choose your official SIH 2026 Problem Statement or submit your custom project idea under Open Innovation."
        />

        {/* STEP-BY-STEP PROFESSIONAL INFOGRAPHIC GUIDE */}
        <div className="mt-8 rounded-3xl border-3 border-web bg-white p-6 sm:p-8 shadow-comic space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="font-display text-xl sm:text-2xl text-web flex items-center gap-2">
              <Info className="text-spidey shrink-0" size={24} /> Step-by-Step Selection Procedure
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-black uppercase bg-gold/30 text-web px-3 py-1 rounded-full border border-web/20">
              Max Quota: 5 Teams / Ideas Per Problem Statement
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="rounded-2xl border-2 border-web/20 bg-slate-50 p-4 relative space-y-2">
              <span className="absolute -top-3 left-4 rounded-full bg-web px-2.5 py-0.5 text-[10px] font-black text-gold">STEP 1</span>
              <p className="pt-1 text-xs font-black uppercase text-web">Browse Official SIH PS</p>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Visit the official portal <strong className="text-spidey">sih.gov.in/sih2026PS</strong> to find problem statements.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border-2 border-web/20 bg-slate-50 p-4 relative space-y-2">
              <span className="absolute -top-3 left-4 rounded-full bg-web px-2.5 py-0.5 text-[10px] font-black text-gold">STEP 2</span>
              <p className="pt-1 text-xs font-black uppercase text-web">Copy PS ID & Title</p>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Copy your desired Problem Statement ID (e.g. <span className="font-mono font-bold text-spidey">SIH1547</span>) & exact Title.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border-2 border-web/20 bg-slate-50 p-4 relative space-y-2">
              <span className="absolute -top-3 left-4 rounded-full bg-web px-2.5 py-0.5 text-[10px] font-black text-gold">STEP 3</span>
              <p className="pt-1 text-xs font-black uppercase text-web">Verify Team Email</p>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Enter registered Leader Email on this website to authenticate your team's access.
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border-2 border-web/20 bg-slate-50 p-4 relative space-y-2">
              <span className="absolute -top-3 left-4 rounded-full bg-web px-2.5 py-0.5 text-[10px] font-black text-gold">STEP 4</span>
              <p className="pt-1 text-xs font-black uppercase text-web">Lock Your Selection</p>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                Confirm your selection! Up to <strong className="text-spidey">5 teams</strong> can choose the same problem statement.
              </p>
            </div>
          </div>
        </div>

        {/* TWO TRACK SELECTION CARDS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* OPTION 1: OFFICIAL SIH PROBLEM STATEMENT */}
          <div className="relative overflow-hidden rounded-3xl border-4 border-web bg-white p-6 sm:p-8 shadow-comic flex flex-col justify-between transition hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-web bg-spidey/10 px-3.5 py-1 text-xs font-black tracking-widest text-spidey uppercase">
                  <FileText size={15} /> OPTION 1: OFFICIAL SIH PS
                </span>
                {isSelectedPS && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                    <CheckCircle2 size={14} /> Selected
                  </span>
                )}
              </div>

              <h3 className="font-display text-2xl sm:text-3xl text-web comic-pop">
                Official SIH 2026 Problem Statement
              </h3>

              <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
                Multiple problem statements are available on the official SIH portal. Enter your PS ID & Title to confirm your allocation.
              </p>

              <div className="rounded-2xl border-2 border-web/20 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-bold text-web flex items-center justify-between">
                  <span>Browse Official Problem Statements:</span>
                  <span className="text-[10px] font-black uppercase text-spidey bg-gold/30 px-2 py-0.5 rounded">Max 5 Teams / PS</span>
                </p>
                <a
                  href={SIH_OFFICIAL_WEBSITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-xl border-2 border-web bg-gold/20 px-4 py-2.5 text-xs font-black uppercase text-web hover:bg-gold transition shadow-xs"
                >
                  <ExternalLink size={14} /> Open sih.gov.in/sih2026PS ↗
                </a>
                <p className="text-[11px] font-semibold text-slate-500">
                  Find your PS ID on the portal, then click below to enter details and lock it for your team.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              <Button
                variant="primary"
                className="w-full text-xs sm:text-sm font-black py-3.5 px-6 shadow-comic bg-web text-white hover:bg-spidey transition"
                onClick={() =>
                  onSelect?.({
                    id: "CUSTOM_PS",
                    code: "OFFICIAL_SIH_PS",
                    title: "Official SIH 2026 Problem Statement",
                    isOpenInnovation: false,
                  })
                }
                disabled={!canSelect}
              >
                Select & Enter Problem Statement ID <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>

          {/* OPTION 2: OPEN INNOVATION Track */}
          <div className="relative overflow-hidden rounded-3xl border-4 border-web bg-gradient-to-br from-amber-50 via-cream to-gold/20 p-6 sm:p-8 shadow-comic flex flex-col justify-between transition hover:-translate-y-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-web bg-gold px-3.5 py-1 text-xs font-black tracking-widest text-web uppercase">
                  <Sparkles size={15} /> OPTION 2: OPEN THEME
                </span>
                {isSelectedOpenInno && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                    <CheckCircle2 size={14} /> Selected
                  </span>
                )}
              </div>

              <h3 className="font-display text-2xl sm:text-3xl text-web comic-pop flex items-center gap-2">
                <Lightbulb className="text-amber-500 shrink-0" size={28} /> Open Innovation Track
              </h3>

              <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">
                Have your own custom project idea outside the official SIH problem statements? Submit your team's custom problem title, abstract, tech stack, and solution under Open Innovation!
              </p>

              <div className="rounded-2xl border-2 border-web/20 bg-white/80 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-web">
                  <Sparkles size={14} className="text-spidey shrink-0" />
                  <span>Unlimited Capacity & Open Tech Stack</span>
                </div>
                <p className="text-[11px] font-semibold text-slate-600">
                  Ideal for original innovations in AI, Web3, IoT, Healthcare, FinTech, Sustainability, and Robotics.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-web/10">
              <Button
                variant="primary"
                className="w-full text-xs sm:text-sm font-black py-3.5 px-6 shadow-comic bg-spidey text-white hover:bg-web transition"
                onClick={() => onSelect?.(OPEN_INNOVATION_PROBLEM)}
                disabled={!canSelect}
              >
                <Sparkles size={16} className="mr-2 text-gold" /> Select Open Innovation <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
