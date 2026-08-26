import { useState } from "react";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  MessageCircle,
  X,
  Trophy,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";
import { Button } from "./ui/Button";
import { WHATSAPP_GROUP_URL } from "../utils/constants";

export function Timeline() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section id="timeline" className="relative overflow-hidden px-4 py-24 md:px-6 bg-cream/60">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Official Schedule"
          title="Important Dates & Timeline"
          copy="Key dates for Smart India Hackathon 2026. Complete your team registration before the deadline to participate in the 2-day Grand Finale."
        />

        {/* 2 MAIN FOCUS CARDS: REGISTRATION DEADLINE & GRAND FINALE */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {/* 1. Registration Deadline Card */}
          <div className="relative overflow-hidden rounded-3xl border-4 border-spidey bg-gradient-to-br from-red-50 via-white to-white p-7 sm:p-9 shadow-comic transition hover:-translate-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-spidey px-3.5 py-1 text-xs font-black tracking-wider text-white uppercase shadow-sm">
                <Clock size={14} /> Cutoff Deadline
              </span>
              <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-black text-red-700">
                LIVE NOW
              </span>
            </div>

            <div className="mt-6">
              <p className="font-ui text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-ink/60">
                Registration Deadline
              </p>
              <h3 className="mt-1 font-display text-4xl sm:text-5xl lg:text-6xl text-spidey">
                31 August 2026
              </h3>
              <p className="mt-3 text-xs sm:text-sm font-bold text-ink/80 leading-relaxed">
                Last date to register your 6-member team (incl. 1+ female member) and submit the ₹300 fee UTR payment proof.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-spidey/30 bg-spidey/10 px-3.5 py-2 text-xs font-black text-spidey">
                <Users size={15} /> All 6 Members Registration Closes at 11:59 PM
              </div>
            </div>
          </div>

          {/* 2. Grand Finale Event (2 Days Event) Card */}
          <div className="relative overflow-hidden rounded-3xl border-4 border-web bg-gradient-to-br from-blue-50 via-white to-white p-7 sm:p-9 shadow-comic transition hover:-translate-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-web px-3.5 py-1 text-xs font-black tracking-wider text-white uppercase shadow-sm">
                <Calendar size={14} /> Main Event
              </span>
              <span className="rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-black text-web">
                2 DAYS EVENT
              </span>
            </div>

            <div className="mt-6">
              <p className="font-ui text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-ink/60">
                Grand Finale Dates
              </p>
              <h3 className="mt-1 font-display text-4xl sm:text-5xl lg:text-6xl text-web">
                2 & 3 September 2026
              </h3>
              <p className="mt-3 text-xs sm:text-sm font-bold text-ink/80 leading-relaxed">
                Official 2-Day Hackathon Grand Finale featuring live problem solving, mentor evaluation rounds, working prototype demos, and awards ceremony.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-web/30 bg-web/10 px-3.5 py-2 text-xs font-black text-web">
                <Trophy size={15} className="text-amber-600" /> National Innovation Grand Finale & Cash Prizes
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Round Schedule Trigger & WhatsApp Banner */}
        <div className="mt-10 rounded-3xl border-3 border-web bg-white p-6 sm:p-8 text-center shadow-comic">
          <div className="inline-flex items-center gap-2 rounded-full border border-web/20 bg-gold/20 px-3.5 py-1 text-xs font-black text-web">
            <Sparkles size={14} className="text-amber-600" /> 2-DAY EVENT SCHEDULE
          </div>
          <h3 className="mt-2 font-display text-3xl sm:text-4xl text-web">
            Want to see the event timeline details?
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm font-bold text-ink/70">
            Check the 2-day event milestones, check-in reporting times, evaluation rounds, and award ceremony timings.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setModalOpen(true)}
              className="bg-web text-white hover:bg-spidey transition shadow-comic text-xs sm:text-sm font-black"
            >
              <Calendar size={16} className="mr-2" /> View Detailed 2-Day Schedule
            </Button>
            <a
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noreferrer"
              className="font-ui inline-flex items-center gap-2 rounded-xl border-2 border-web bg-gold px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-web hover:bg-gold-light transition shadow-comic"
            >
              <MessageCircle size={16} /> Join WhatsApp for Live Updates
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Coming Soon / Round Schedule Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in overflow-hidden">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border-3 sm:border-4 border-web bg-white p-6 sm:p-8 shadow-2xl text-center overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute right-4 top-4 rounded-full border-2 border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition shadow-xs z-10"
                title="Close"
              >
                <X size={18} />
              </button>

              <div className="mx-auto mb-3 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border-3 border-web bg-gold text-web shrink-0 shadow-2xs">
                <Calendar size={28} />
              </div>

              <span className="inline-block rounded-full bg-spidey/15 border border-spidey/30 px-3 py-0.5 text-xs font-black text-spidey uppercase tracking-wider mx-auto">
                2-DAY EVENT SCHEDULE
              </span>

              <h3 className="mt-3 font-display text-2xl sm:text-3xl text-web">
                2-Day Grand Finale Schedule
              </h3>

              <div className="mt-4 space-y-2.5 rounded-2xl border-2 border-web/20 bg-slate-50 p-4 text-left text-xs font-bold text-ink/80">
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <strong>31 August 2026:</strong> Registration Deadline (11:59 PM)
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <strong>Day 1 (2 Sept 2026):</strong> Team Check-in & Hackathon Kickoff
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <strong>Day 1 (2 Sept 2026):</strong> Mentoring & Architecture Review Rounds
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <strong>Day 2 (3 Sept 2026):</strong> Final Working Prototype Jury Pitch
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <strong>Day 2 (3 Sept 2026):</strong> Grand Valedictory & Award Ceremony
                </p>
              </div>

              <p className="mt-4 text-xs font-bold text-ink/60">
                Detailed reporting times and mentor guidelines are shared inside the official WhatsApp group.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <a
                  href={WHATSAPP_GROUP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-xs font-black uppercase text-web border-2 border-web shadow-sm hover:brightness-105"
                >
                  <MessageCircle size={15} /> Join WhatsApp Channel
                </a>
                <Button variant="secondary" onClick={() => setModalOpen(false)} className="text-xs font-bold py-2.5">
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
