import { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  MessageCircle,
  X,
  Trophy,
  Users,
  MapPin,
  Flame,
  Search,
  Layers,
  HelpCircle,
  ChevronRight,
  Radio,
  Timer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "./ui/SectionHeading";
import { Button } from "./ui/Button";
import { WHATSAPP_GROUP_URL } from "../utils/constants";
import { fetchTimeline, subscribeTable } from "../services/apiService";
import { DEFAULT_SIH_TIMELINE_EVENTS, sanitizeTimelineEvents } from "../admin/AdminTimeline";
import { cn } from "../utils/cn";

const PUBLIC_DAY_FILTERS = [
  { id: "ALL", label: "All 2-Day Schedule" },
  { id: "Day 1", label: "🟦 Day 1 (2 Sept 2026)" },
  { id: "Day 2", label: "🟥 Day 2 (3 Sept 2026)" },
];

function getCategoryBadge(cat) {
  switch (cat) {
    case "Milestone":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "Check-in":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "Mentoring":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Evaluation Round":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Coding Sprint":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Jury Pitch":
      return "bg-violet-100 text-violet-800 border-violet-200";
    case "Award Ceremony":
      return "bg-amber-100 text-amber-900 border-amber-300 font-black";
    case "Food & Refreshments":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Ceremony":
      return "bg-teal-100 text-teal-800 border-teal-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

export function Timeline() {
  const [modalOpen, setModalOpen] = useState(false);
  const [timelineData, setTimelineData] = useState({
    published: false,
    title: "Official 2-Day Internal Hackathon Schedule",
    subtitle: "Complete timeline for Smart India Hackathon Internal Rounds. Track registration milestones, mission completion sprint, and final jury evaluation.",
    events: DEFAULT_SIH_TIMELINE_EVENTS,
  });
  const [activeDay, setActiveDay] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await fetchTimeline();
        if (isMounted && data) {
          const rawEvents = Array.isArray(data.events) && data.events.length > 0 ? data.events : DEFAULT_SIH_TIMELINE_EVENTS;
          setTimelineData({
            published: Boolean(data.published),
            title: data.title || "Official 2-Day Internal Hackathon Schedule",
            subtitle: data.subtitle || "Complete timeline for Smart India Hackathon Internal Rounds. Track registration milestones, mission completion sprint, and final jury evaluation.",
            events: sanitizeTimelineEvents(rawEvents),
          });
        }
      } catch {
        // fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();

    const unsub = subscribeTable("timeline", () => {
      load();
    });

    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, []);

  const isPublished = timelineData.published;
  const events = timelineData.events || [];

  // Filter events
  const filteredEvents = events.filter((e) => {
    const matchesDay = activeDay === "ALL" || e.day === activeDay;
    const matchesSearch = 
      searchQuery.trim() === "" ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDay && matchesSearch;
  });

  return (
    <section id="timeline" className="relative overflow-hidden px-4 py-24 md:px-6 bg-cream/60">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Official Schedule"
          title={timelineData.title || "Internal Hackathon 2-Day Timeline"}
          copy={timelineData.subtitle || "Complete timeline for Smart India Hackathon Internal Rounds. Track registration milestones, mission completion sprint, and final jury evaluation."}
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
                REGISTRATION CUTOFF
              </span>
            </div>

            <div className="mt-6">
              <p className="font-ui text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-ink/60">
                Team Registration Deadline
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
                Internal Hackathon Dates
              </p>
              <h3 className="mt-1 font-display text-4xl sm:text-5xl lg:text-6xl text-web">
                2 & 3 September 2026
              </h3>
              <p className="mt-3 text-xs sm:text-sm font-bold text-ink/80 leading-relaxed">
                Day 1: Mission Completion & Mentoring (12:30 PM - 5:30 PM). Day 2: Final Jury Evaluation (11:00 AM - 2:00 PM) and Closing Ceremony.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-web/30 bg-web/10 px-3.5 py-2 text-xs font-black text-web">
                <Trophy size={15} className="text-amber-600" /> Internal Hackathon Evaluation & National SIH Nominations
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 DAY 1 & DAY 2 CORE OBJECTIVES BANNER */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {/* Day 1 Focus Banner */}
          <div className="rounded-2xl border-3 border-web/60 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-white p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-web text-white font-black text-xl shadow-xs">
              D1
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-black uppercase">
                🟦 DAY 1 MAIN OBJECTIVE
              </span>
              <h4 className="font-display text-base sm:text-lg text-web mt-0.5">
                12:30 PM – 5:30 PM = MISSION COMPLETION
              </h4>
              <p className="text-xs text-slate-600 font-bold">
                Teams build their working prototype & interact with domain mentors.
              </p>
            </div>
          </div>

          {/* Day 2 Focus Banner */}
          <div className="rounded-2xl border-3 border-spidey/60 bg-gradient-to-r from-red-500/10 via-red-500/5 to-white p-5 shadow-xs flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-spidey text-white font-black text-xl shadow-xs">
              D2
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-black uppercase">
                🟥 DAY 2 MAIN OBJECTIVE
              </span>
              <h4 className="font-display text-base sm:text-lg text-spidey mt-0.5">
                11:00 AM – 2:00 PM = JUDGING ROUND
              </h4>
              <p className="text-xs text-slate-600 font-bold">
                Live prototype demo & Q&A followed by 🏆 3:15 PM Closing Ceremony.
              </p>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* CONDITIONAL RENDER: PUBLISHED SCHEDULE vs COMING SOON BANNER */}
        {/* ---------------------------------------------------- */}

        {isPublished ? (
          /* 🟢 LIVE DYNAMIC TIMELINE SECTION (WHEN ADMIN PUSHES LIVE) */
          <div className="mt-10 space-y-8 animate-in fade-in duration-500">
            {/* Control Bar: Day Filter Tabs & Search */}
            <div className="rounded-3xl border-3 border-web bg-white p-6 shadow-comic flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Day Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
                  Filter Day:
                </span>
                {PUBLIC_DAY_FILTERS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDay(tab.id)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition border-2",
                      activeDay === tab.id
                        ? "bg-web text-white border-web shadow-comic -translate-y-0.5"
                        : "bg-slate-50 text-slate-700 border-slate-300 hover:border-web hover:bg-white"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search activities, rounds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 pl-9 pr-3.5 py-2 text-xs font-bold text-ink placeholder:text-slate-400 focus:border-web focus:bg-white focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <div className="rounded-3xl border-3 border-dashed border-slate-300 bg-white/60 p-12 text-center">
                <Calendar className="mx-auto text-slate-400 mb-3" size={40} />
                <h4 className="font-display text-xl text-web">No Activities Found</h4>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  Try clearing your search query or switching the day filter tab.
                </p>
                <button
                  onClick={() => { setSearchQuery(""); setActiveDay("ALL"); }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-web text-white px-4 py-2 text-xs font-black shadow-comic hover:bg-spidey transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((evt, idx) => (
                  <motion.div
                    key={evt.id || idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn(
                      "relative flex flex-col justify-between overflow-hidden rounded-3xl border-3 bg-white p-6 shadow-comic transition hover:-translate-y-1.5",
                      evt.highlight
                        ? "border-web ring-4 ring-gold/40 bg-gradient-to-br from-amber-50/40 via-white to-white"
                        : "border-web/80 hover:border-spidey"
                    )}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className={cn("rounded-lg border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider", getCategoryBadge(evt.category))}>
                          {evt.category || "Milestone"}
                        </span>
                        
                        {evt.status === "LIVE_NOW" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-300 px-2.5 py-0.5 text-[10px] font-black text-red-700 uppercase animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-red-600" /> LIVE NOW
                          </span>
                        ) : evt.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black text-emerald-800 uppercase">
                            <CheckCircle2 size={12} /> Done
                          </span>
                        ) : evt.highlight ? (
                          <span className="rounded-md bg-gold/30 border border-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-900 uppercase">
                            ⭐ Key Event
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-600 uppercase">
                            {evt.day}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="font-display text-xl sm:text-2xl text-web leading-snug">
                        {evt.title}
                      </h4>

                      {/* Time & Venue */}
                      <div className="mt-3.5 space-y-1.5 text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2 text-spidey">
                          <Clock size={15} className="shrink-0" />
                          <span className="text-sm font-black">{evt.time}</span>
                          <span className="text-slate-300">•</span>
                          <span>{evt.day}</span>
                        </div>
                        {evt.venue && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin size={15} className="shrink-0 text-web" />
                            <span>{evt.venue}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {evt.description && (
                        <p className="mt-3 text-xs font-semibold text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                          {evt.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Date Tag */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>{evt.date}</span>
                      <span className="text-web font-black uppercase tracking-wider">{evt.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Bottom CTA for WhatsApp Group */}
            <div className="rounded-3xl border-3 border-web bg-gold/15 p-6 sm:p-8 text-center shadow-comic flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-web text-white px-3 py-0.5 text-[11px] font-black uppercase">
                  <Sparkles size={12} className="text-gold" /> LIVE HACKATHON BROADCAST
                </span>
                <h4 className="font-display text-2xl text-web">
                  Need real-time announcements during the 2-day hackathon?
                </h4>
                <p className="text-xs font-bold text-slate-600">
                  Reporting times, desk calls, and jury announcements will be posted simultaneously in the WhatsApp channel.
                </p>
              </div>

              <a
                href={WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="font-ui inline-flex items-center gap-2 rounded-xl border-2 border-web bg-[#25D366] px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-web hover:brightness-105 transition shadow-comic shrink-0"
              >
                <MessageCircle size={17} /> Join WhatsApp Channel
              </a>
            </div>
          </div>
        ) : (
          /* 🔴 UNPUBLISHED / COMING SOON VIEW (DEFAULT UNTIL ADMIN PUSHES LIVE) */
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
        )}
      </div>

      {/* Interactive 2-Day Schedule Modal (Complete Tabular Breakdown) */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in overflow-hidden">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border-3 sm:border-4 border-web bg-white p-6 sm:p-8 shadow-2xl text-left overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute right-4 top-4 rounded-full border-2 border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition shadow-xs z-10"
                title="Close"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-3 border-web bg-gold text-web shrink-0 shadow-2xs">
                  <Calendar size={24} />
                </div>
                <div>
                  <span className="inline-block rounded-full bg-spidey/15 border border-spidey/30 px-3 py-0.5 text-xs font-black text-spidey uppercase tracking-wider">
                    SIH INTERNAL HACKATHON
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl text-web">
                    Final 2-Day Timeline
                  </h3>
                </div>
              </div>

              {/* Day 1 Section */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between bg-blue-50 border-2 border-web/30 px-3.5 py-2 rounded-xl">
                  <h4 className="font-display text-base text-web flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-blue-600" />
                    🟦 DAY 1 — Opening & Mission Completion
                  </h4>
                  <span className="text-[11px] font-black text-blue-700 uppercase">2 Sept 2026</span>
                </div>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">9:30 – 10:00 AM</span>
                    <span className="text-slate-800 flex-1">Team Reporting & Registration</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">10:00 – 10:30 AM</span>
                    <span className="text-slate-800 flex-1">Team Seating & Final Instructions</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">10:30 – 11:00 AM</span>
                    <span className="text-slate-800 flex-1">Welcome & Introduction</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-amber-50 font-black text-amber-900 border-l-4 border-amber-500">
                    <span className="text-spidey font-mono w-36 shrink-0">11:00 AM – 12:00 PM</span>
                    <span className="flex-1">🎤 Opening Ceremony</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">12:00 – 12:30 PM</span>
                    <span className="text-slate-800 flex-1">Hackathon Briefing & Mission Allocation</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 font-black text-emerald-900 border-l-4 border-emerald-500">
                    <span className="text-spidey font-mono w-36 shrink-0">12:30 – 1:30 PM</span>
                    <span className="flex-1">💻 Mission Completion Phase — Teams Begin Working</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">1:30 – 2:30 PM</span>
                    <span className="text-slate-800 flex-1">🍱 Lunch Break</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-purple-50 font-black text-purple-900 border-l-4 border-purple-500">
                    <span className="text-spidey font-mono w-36 shrink-0">2:30 – 5:30 PM</span>
                    <span className="flex-1">🚀 Mission Completion + Mentoring Round</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">5:30 PM</span>
                    <span className="text-slate-800 flex-1">🔚 Day 1 Ends</span>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-300 bg-blue-50/70 p-3 text-xs font-bold text-blue-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600 shrink-0" />
                  <span><strong>🎯 Day 1 Core Objective:</strong> 12:30 PM – 5:30 PM = MISSION COMPLETION</span>
                </div>
              </div>

              {/* Day 2 Section */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between bg-red-50 border-2 border-spidey/30 px-3.5 py-2 rounded-xl">
                  <h4 className="font-display text-base text-spidey flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-600" />
                    🟥 DAY 2 — Judging & Closing
                  </h4>
                  <span className="text-[11px] font-black text-rose-700 uppercase">3 Sept 2026</span>
                </div>

                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">9:30 – 10:00 AM</span>
                    <span className="text-slate-800 flex-1">Team Reporting</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">10:00 – 10:30 AM</span>
                    <span className="text-slate-800 flex-1">Final Setup & Submission Preparation</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">10:30 – 11:00 AM</span>
                    <span className="text-slate-800 flex-1">Final Instructions for Judging</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-indigo-50 font-black text-indigo-900 border-l-4 border-indigo-500">
                    <span className="text-spidey font-mono w-36 shrink-0">11:00 AM – 2:00 PM</span>
                    <span className="flex-1">⚖️ Judging Round — Evaluation of Teams & Solutions</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-white font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">2:00 – 3:00 PM</span>
                    <span className="text-slate-800 flex-1">Final Evaluation & Result Preparation</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/50 font-bold">
                    <span className="text-spidey font-mono w-36 shrink-0">3:00 – 3:15 PM</span>
                    <span className="text-slate-800 flex-1">Closing Ceremony Setup</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-amber-50 font-black text-amber-900 border-l-4 border-amber-500">
                    <span className="text-spidey font-mono w-36 shrink-0">3:15 – 5:20 PM</span>
                    <span className="flex-1">🏆 CLOSING CEREMONY</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 font-black text-emerald-900 border-l-4 border-emerald-500">
                    <span className="text-spidey font-mono w-36 shrink-0">5:20 PM</span>
                    <span className="flex-1">✅ Hackathon Officially Ends</span>
                  </div>
                </div>
              </div>

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
