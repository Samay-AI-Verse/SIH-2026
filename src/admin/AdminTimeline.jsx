import { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Globe, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  Layers, 
  MapPin, 
  Tag, 
  Check, 
  X,
  Trophy,
  Flame,
  Coffee,
  Code2,
  Users,
  Presentation,
  Award
} from "lucide-react";
import { 
  adminFetchTimeline, 
  adminSaveTimeline, 
  adminToggleTimelinePublish 
} from "../services/apiService";
import { Button } from "../components/ui/Button";
import { cn } from "../utils/cn";

export const DEFAULT_SIH_TIMELINE_EVENTS = [
  // --- DAY 1 ---
  {
    id: "evt-day1-reporting",
    day: "Day 1",
    date: "2 September 2026",
    time: "9:30 – 10:00 AM",
    title: "Team Reporting & Registration",
    category: "Check-in",
    status: "UPCOMING",
    venue: "Registration Desk / Main Entrance",
    description: "Teams report to the campus registration desk, verify attendance, collect participant kits, and receive desk allocations.",
    highlight: false,
  },
  {
    id: "evt-day1-seating",
    day: "Day 1",
    date: "2 September 2026",
    time: "10:00 – 10:30 AM",
    title: "Team Seating & Final Instructions",
    category: "Check-in",
    status: "UPCOMING",
    venue: "Hackathon Hall / Assigned Labs",
    description: "Teams take their designated team tables/desks, connect to hackathon Wi-Fi network, and receive final lab & environment setup instructions.",
    highlight: false,
  },
  {
    id: "evt-day1-welcome",
    day: "Day 1",
    date: "2 September 2026",
    time: "10:30 – 11:00 AM",
    title: "Welcome & Introduction",
    category: "Ceremony",
    status: "UPCOMING",
    venue: "Main Auditorium / Stage",
    description: "Official welcome address to all participating teams, introducing faculties, event coordinators, and hackathon guidelines.",
    highlight: false,
  },
  {
    id: "evt-day1-opening",
    day: "Day 1",
    date: "2 September 2026",
    time: "11:00 AM – 12:00 PM",
    title: "🎤 Opening Ceremony",
    category: "Ceremony",
    status: "UPCOMING",
    venue: "Main Auditorium",
    description: "Grand opening ceremony with dignitaries, keynote address, lighting of the lamp, and motivating kickoff speech.",
    highlight: true,
  },
  {
    id: "evt-day1-briefing",
    day: "Day 1",
    date: "2 September 2026",
    time: "12:00 – 12:30 PM",
    title: "Hackathon Briefing & Mission Allocation",
    category: "Milestone",
    status: "UPCOMING",
    venue: "Main Auditorium / Hackathon Hall",
    description: "Comprehensive hackathon rulebook walkthrough, evaluation criteria briefing, and official confirmation of assigned mission/problem statements.",
    highlight: true,
  },
  {
    id: "evt-day1-mission-start",
    day: "Day 1",
    date: "2 September 2026",
    time: "12:30 – 1:30 PM",
    title: "💻 Mission Completion Phase — Teams Begin Working on Assigned Mission",
    category: "Coding Sprint",
    status: "UPCOMING",
    venue: "Assigned Team Desks",
    description: "Coding starts! Teams begin system architecture planning, git repo initialization, UI wireframing, and initial feature implementation.",
    highlight: true,
  },
  {
    id: "evt-day1-lunch",
    day: "Day 1",
    date: "2 September 2026",
    time: "1:30 – 2:30 PM",
    title: "🍱 Lunch Break",
    category: "Food & Refreshments",
    status: "UPCOMING",
    venue: "Dining Hall / Cafeteria",
    description: "Nutritious lunch and relaxation break for all participating teams and faculty mentors.",
    highlight: false,
  },
  {
    id: "evt-day1-mentoring",
    day: "Day 1",
    date: "2 September 2026",
    time: "2:30 – 5:30 PM",
    title: "🚀 Mission Completion + Mentoring Round",
    category: "Mentoring",
    status: "UPCOMING",
    venue: "Team Desks & Labs",
    description: "Teams continue working to complete their assigned mission. Mentors interact with teams, understand their approach, provide guidance and help them improve their solutions.",
    highlight: true,
  },
  {
    id: "evt-day1-end",
    day: "Day 1",
    date: "2 September 2026",
    time: "5:30 PM",
    title: "🔚 Day 1 Ends",
    category: "Milestone",
    status: "UPCOMING",
    venue: "Hackathon Hall",
    description: "Day 1 wraps up. Teams save and commit their Day 1 progress to GitHub. Mentors provide closing remarks for the day.",
    highlight: false,
  },

  // --- DAY 2 ---
  {
    id: "evt-day2-reporting",
    day: "Day 2",
    date: "3 September 2026",
    time: "9:30 – 10:00 AM",
    title: "Team Reporting",
    category: "Check-in",
    status: "UPCOMING",
    venue: "Registration Desk / Main Entrance",
    description: "Day 2 reporting, morning attendance verification, and morning refreshments.",
    highlight: false,
  },
  {
    id: "evt-day2-final-setup",
    day: "Day 2",
    date: "3 September 2026",
    time: "10:00 – 10:30 AM",
    title: "Final Setup & Submission Preparation",
    category: "Milestone",
    status: "UPCOMING",
    venue: "Assigned Team Desks",
    description: "Teams run final tests on their live prototypes, prepare PPT pitch decks, and test projector/screen sharing configurations.",
    highlight: false,
  },
  {
    id: "evt-day2-instructions",
    day: "Day 2",
    date: "3 September 2026",
    time: "10:30 – 11:00 AM",
    title: "Final Instructions for Judging",
    category: "General",
    status: "UPCOMING",
    venue: "Hackathon Hall",
    description: "Jury briefing and announcement of judging order, time limits (pitch + Q&A), and evaluation rubric criteria.",
    highlight: false,
  },
  {
    id: "evt-day2-judging",
    day: "Day 2",
    date: "3 September 2026",
    time: "11:00 AM – 2:00 PM",
    title: "⚖️ Judging Round — Evaluation of Teams & Solutions",
    category: "Evaluation Round",
    status: "UPCOMING",
    venue: "Jury Evaluation Panels / Labs",
    description: "Rigorous evaluation of teams and solutions by the internal judging committee. Live demo of working prototypes and Q&A.",
    highlight: true,
  },
  {
    id: "evt-day2-evaluation-prep",
    day: "Day 2",
    date: "3 September 2026",
    time: "2:00 – 3:00 PM",
    title: "Final Evaluation & Result Preparation",
    category: "Evaluation Round",
    status: "UPCOMING",
    venue: "Jury Control Room",
    description: "Judges consolidate scorecards, tally final points across criteria, and finalize the winner and runner-up nominations for SIH national nomination.",
    highlight: false,
  },
  {
    id: "evt-day2-setup-ceremony",
    day: "Day 2",
    date: "3 September 2026",
    time: "3:00 – 3:15 PM",
    title: "Closing Ceremony Setup",
    category: "Ceremony",
    status: "UPCOMING",
    venue: "Main Auditorium",
    description: "Teams and audience assemble in the Main Auditorium for the grand closing ceremony and felicitation.",
    highlight: false,
  },
  {
    id: "evt-day2-closing-ceremony",
    day: "Day 2",
    date: "3 September 2026",
    time: "3:15 – 5:20 PM",
    title: "🏆 CLOSING CEREMONY",
    category: "Award Ceremony",
    status: "UPCOMING",
    venue: "Main Auditorium",
    description: "Grand valedictory session, announcement of hackathon winners, prize distribution, memento presentations, and coordinator acknowledgments.",
    highlight: true,
  },
  {
    id: "evt-day2-end",
    day: "Day 2",
    date: "3 September 2026",
    time: "5:20 PM",
    title: "✅ Hackathon Officially Ends",
    category: "Milestone",
    status: "UPCOMING",
    venue: "Main Auditorium",
    description: "Official conclusion of SIH 2026 Internal Hackathon. Group photo session, certificate distribution, and departure.",
    highlight: true,
  },
];

const CATEGORIES = [
  "Milestone",
  "Check-in",
  "Mentoring",
  "Evaluation Round",
  "Coding Sprint",
  "Jury Pitch",
  "Award Ceremony",
  "Food & Refreshments",
  "Ceremony",
  "General",
];

const STATUS_OPTIONS = [
  { value: "UPCOMING", label: "Upcoming", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "LIVE_NOW", label: "🔴 LIVE NOW", color: "bg-red-100 text-red-700 border-red-300 animate-pulse" },
  { value: "COMPLETED", label: "Completed", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { value: "HIGHLIGHT", label: "⭐ Key Highlight", color: "bg-amber-100 text-amber-800 border-amber-300" },
];

function getCategoryColor(cat) {
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

export function sanitizeTimelineEvents(rawEvents) {
  if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
    return DEFAULT_SIH_TIMELINE_EVENTS;
  }
  const hasInvalid = rawEvents.some(
    (e) => !e.day || e.day.toLowerCase().includes("night") || e.day.toLowerCase().includes("pre")
  );
  if (hasInvalid) {
    return DEFAULT_SIH_TIMELINE_EVENTS;
  }
  return rawEvents.map((evt) => {
    const isDay2 = evt.day === "Day 2" || (evt.date && evt.date.includes("3 September"));
    const day = isDay2 ? "Day 2" : "Day 1";
    const date = isDay2 ? "3 September 2026" : "2 September 2026";
    return {
      ...evt,
      day,
      date: evt.date || date,
    };
  });
}

const DAY_TABS = [
  { id: "ALL", label: "All Events", badge: "2-Day Schedule" },
  { id: "Day 1", label: "Day 1", badge: "2 Sept 2026" },
  { id: "Day 2", label: "Day 2", badge: "3 Sept 2026" },
];

export function AdminTimeline() {
  const [published, setPublished] = useState(false);
  const [title, setTitle] = useState("Important Dates & Timeline");
  const [subtitle, setSubtitle] = useState("Key dates and 2-day schedule for Smart India Hackathon 2026.");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("editor"); // 'editor' | 'preview'

  // Modal State for adding/editing event
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [eventForm, setEventForm] = useState({
    day: "Day 1",
    date: "2 September 2026",
    time: "09:30 AM",
    title: "",
    category: "Mentoring",
    status: "UPCOMING",
    venue: "Main Auditorium",
    description: "",
    highlight: false,
  });

  useEffect(() => {
    loadTimeline();
  }, []);

  async function loadTimeline() {
    setLoading(true);
    try {
      const data = await adminFetchTimeline();
      if (data) {
        setPublished(Boolean(data.published));
        setTitle(data.title || "Important Dates & Timeline");
        setSubtitle(data.subtitle || "Key dates and 2-day schedule for Smart India Hackathon 2026.");
        const rawEvents = Array.isArray(data.events) && data.events.length > 0
          ? data.events
          : DEFAULT_SIH_TIMELINE_EVENTS;
        setEvents(sanitizeTimelineEvents(rawEvents));
      } else {
        setEvents(DEFAULT_SIH_TIMELINE_EVENTS);
      }
    } catch (err) {
      setEvents(DEFAULT_SIH_TIMELINE_EVENTS);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveAll(publishStatusOverride = null) {
    setSaving(true);
    setMessage("");
    setError("");
    const isPub = publishStatusOverride !== null ? publishStatusOverride : published;
    try {
      const payload = {
        published: isPub,
        title: title.trim(),
        subtitle: subtitle.trim(),
        events: events,
      };
      await adminSaveTimeline(payload);
      if (publishStatusOverride !== null) {
        setPublished(publishStatusOverride);
      }
      setMessage(
        isPub 
          ? "🎉 Timeline saved & PUSHED LIVE to official website! All visitors can now view the schedule." 
          : "💾 Timeline saved in DRAFT mode (Hidden from website visitors until pushed)."
      );
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save timeline.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish() {
    const nextState = !published;
    await handleSaveAll(nextState);
  }

  async function handleLoadTemplate() {
    if (window.confirm("Load & Save the official 2-Day SIH Schedule (Day 1: 2 Sept, Day 2: 3 Sept)? This will remove all night plans and populate the clean schedule.")) {
      setEvents(DEFAULT_SIH_TIMELINE_EVENTS);
      setSelectedDayFilter("ALL");
      try {
        await adminSaveTimeline({
          published: published,
          title: title.trim() || "Important Dates & Timeline",
          subtitle: subtitle.trim() || "Key dates and 2-day schedule for Smart India Hackathon 2026.",
          events: DEFAULT_SIH_TIMELINE_EVENTS,
        });
        setMessage("✅ Official 2-Day SIH Schedule (2 & 3 Sept) loaded and saved successfully!");
        setTimeout(() => setMessage(""), 5000);
      } catch (err) {
        setMessage("Loaded 2-Day schedule template in editor. Click 'Save Draft' or 'Push Live' to save.");
      }
    }
  }

  function openAddModal() {
    setEditingIndex(null);
    setEventForm({
      day: "Day 1",
      date: "2 September 2026",
      time: "09:30 AM - 10:30 AM",
      title: "",
      category: "Mentoring",
      status: "UPCOMING",
      venue: "Main Auditorium",
      description: "",
      highlight: false,
    });
    setModalOpen(true);
  }

  function openEditModal(index) {
    setEditingIndex(index);
    const evt = events[index];
    const isDay2 = evt.day === "Day 2" || (evt.date && evt.date.includes("3 September"));
    setEventForm({
      ...evt,
      day: isDay2 ? "Day 2" : "Day 1",
      date: evt.date || (isDay2 ? "3 September 2026" : "2 September 2026"),
    });
    setModalOpen(true);
  }

  function handleSaveEventModal(e) {
    e.preventDefault();
    if (!eventForm.title.trim()) {
      alert("Please enter an event title.");
      return;
    }
    const updated = [...events];
    const eventObj = {
      ...eventForm,
      id: eventForm.id || `evt-${Date.now()}`,
    };
    if (editingIndex !== null) {
      updated[editingIndex] = eventObj;
    } else {
      updated.push(eventObj);
    }
    setEvents(updated);
    setModalOpen(false);
  }

  function handleDeleteEvent(index) {
    if (window.confirm(`Delete event "${events[index]?.title}"?`)) {
      const updated = events.filter((_, i) => i !== index);
      setEvents(updated);
    }
  }

  function handleMoveUp(index) {
    if (index === 0) return;
    const updated = [...events];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setEvents(updated);
  }

  function handleMoveDown(index) {
    if (index === events.length - 1) return;
    const updated = [...events];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setEvents(updated);
  }

  const filteredEvents = selectedDayFilter === "ALL" 
    ? events 
    : events.filter((e) => e.day === selectedDayFilter);

  return (
    <div className="max-w-6xl space-y-6 text-left pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-web/10 px-3 py-1 text-xs font-black text-web uppercase tracking-wider">
            <Calendar size={14} className="text-spidey" /> Official Schedule Management
          </span>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl text-web flex items-center gap-2">
            Hackathon Timeline & Schedule
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            2-Day Internal Hackathon Schedule: <strong>Day 1 (2 Sept)</strong> & <strong>Day 2 (3 Sept)</strong>. Push live whenever ready.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "editor" ? "preview" : "editor")}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            {viewMode === "editor" ? <Eye size={15} /> : <Edit3 size={15} />}
            {viewMode === "editor" ? "Live Site Preview" : "Back to Editor"}
          </button>

          <Button
            variant="primary"
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="bg-web text-white hover:bg-spidey transition shadow-comic text-xs font-black py-2.5 px-4"
          >
            <Save size={15} className="mr-1.5" />
            {saving ? "Saving..." : "Save Draft"}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 text-xs font-bold text-rose-900 flex items-center gap-2 shadow-xs">
          <AlertTriangle size={18} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 🚀 HERO CARD: PUSH TO LIVE WEBSITE TOGGLE */}
      <div className={cn(
        "rounded-3xl border-3 p-6 sm:p-7 shadow-comic transition-all",
        published 
          ? "border-emerald-600 bg-gradient-to-br from-emerald-50 via-white to-white"
          : "border-spidey bg-gradient-to-br from-amber-50/70 via-white to-white"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border",
                published
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm"
                  : "bg-rose-100 text-rose-800 border-rose-300"
              )}>
                {published ? "🟢 PUBLISHED & LIVE ON WEBSITE" : "🔴 DRAFT / HIDDEN FROM PUBLIC"}
              </span>
              <span className="text-xs font-bold text-slate-500">
                ({events.length} Milestones Configured)
              </span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl text-web">
              {published 
                ? "Official Timeline is Live for All Website Visitors" 
                : "Timeline is in Draft Mode (Coming Soon Banner Shown)"}
            </h3>
            
            <p className="text-xs sm:text-sm font-semibold text-slate-600 max-w-2xl leading-relaxed">
              {published
                ? "The interactive 2-Day schedule (2 & 3 September 2026) is currently VISIBLE on the public website home page."
                : "Public visitors currently see the exciting 2-Day teaser card. Toggle this switch when you are ready to publish the schedule live."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 font-display text-sm uppercase tracking-wider text-white shadow-comic transition-all transform hover:-translate-y-0.5",
                published
                  ? "bg-rose-600 hover:bg-rose-700 border-2 border-rose-800"
                  : "bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-800 animate-pulse"
              )}
            >
              {published ? <EyeOff size={18} /> : <Globe size={18} />}
              {published ? "Hide / Unpublish from Site" : "🚀 Push Live to Website Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Main View Mode Selector */}
      {viewMode === "preview" ? (
        /* LIVE SITE PREVIEW */
        <div className="rounded-3xl border-3 border-web bg-slate-50 p-6 sm:p-8 shadow-comic space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
              <Eye className="text-web" size={20} />
              <h3 className="font-display text-2xl text-web">Public Website Preview</h3>
            </div>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
              Status: {published ? "Visible Live" : "Hidden (Showing 2-Day Teaser)"}
            </span>
          </div>

          {/* Section Heading Mock */}
          <div className="text-center max-w-2xl mx-auto py-4">
            <span className="text-xs font-black uppercase tracking-widest text-spidey">
              Official Schedule
            </span>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl text-web">
              {title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-600">
              {subtitle}
            </p>
          </div>

          {/* Day Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {DAY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedDayFilter(tab.id)}
                className={cn(
                  "rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition border-2 flex items-center gap-2",
                  selectedDayFilter === tab.id
                    ? "bg-web text-white border-web shadow-comic"
                    : "bg-white text-slate-700 border-slate-300 hover:border-web"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", selectedDayFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500")}>
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Timeline Cards Grid Preview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((evt, idx) => (
              <div
                key={evt.id || idx}
                className={cn(
                  "relative rounded-2xl border-3 bg-white p-5 shadow-sm transition hover:shadow-md",
                  evt.highlight ? "border-web ring-2 ring-gold/50" : "border-slate-300"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-black uppercase", getCategoryColor(evt.category))}>
                    {evt.category}
                  </span>
                  <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-black uppercase", 
                    STATUS_OPTIONS.find((s) => s.value === evt.status)?.color || "bg-slate-100 text-slate-700"
                  )}>
                    {STATUS_OPTIONS.find((s) => s.value === evt.status)?.label || evt.status}
                  </span>
                </div>

                <h4 className="font-display text-lg text-web leading-snug">
                  {evt.title}
                </h4>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600 font-bold">
                  <div className="flex items-center gap-1.5 text-spidey">
                    <Clock size={13} className="shrink-0" />
                    <span>{evt.time}</span>
                    <span className="text-slate-400">•</span>
                    <span>{evt.day} ({evt.date})</span>
                  </div>
                  {evt.venue && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <MapPin size={13} className="shrink-0 text-web" />
                      <span>{evt.venue}</span>
                    </div>
                  )}
                </div>

                {evt.description && (
                  <p className="mt-3 text-xs text-slate-600 border-t border-slate-100 pt-2.5 line-clamp-3">
                    {evt.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TIMELINE EDITOR */
        <div className="space-y-6">
          {/* Section Titles Config */}
          <div className="rounded-3xl border-3 border-web bg-white p-6 shadow-comic space-y-4">
            <h3 className="font-display text-2xl text-web flex items-center gap-2">
              <Layers size={20} className="text-spidey" /> Section Titles & Headings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  Public Section Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Important Dates & Timeline"
                  className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                  Public Section Subtitle / Copy
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Key dates and 2-day schedule for Smart India Hackathon 2026."
                  className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Events Manager */}
          <div className="rounded-3xl border-3 border-web bg-white p-6 shadow-comic space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-display text-2xl text-web flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" /> Hackathon Milestones & Events ({events.length})
                </h3>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  Day 1 (2 September 2026) & Day 2 (3 September 2026) — No overnight plan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadTemplate}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-web/30 bg-web/10 px-3.5 py-2 text-xs font-black text-web hover:bg-web hover:text-white transition shadow-2xs"
                  title="Populate complete 2-Day SIH schedule (2 & 3 Sept)"
                >
                  <RefreshCw size={14} /> Load SIH 2-Day Template (2 & 3 Sept)
                </button>

                <Button
                  variant="primary"
                  onClick={openAddModal}
                  className="bg-spidey text-white hover:bg-web transition shadow-comic text-xs font-black py-2 px-3.5"
                >
                  <Plus size={15} className="mr-1" /> Add Milestone
                </Button>
              </div>
            </div>

            {/* Filter by Day */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-500 mr-1">Filter:</span>
              {DAY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedDayFilter(tab.id)}
                  className={cn(
                    "rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition border-2 flex items-center gap-1.5",
                    selectedDayFilter === tab.id
                      ? "bg-web text-white border-web shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400"
                  )}
                >
                  <span>{tab.label}</span>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.2 rounded", selectedDayFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600")}>
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Events List */}
            {filteredEvents.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center">
                <Calendar className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-xs font-bold text-slate-600">No events found for this filter.</p>
                <button
                  onClick={openAddModal}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-web text-white px-3.5 py-1.5 text-xs font-bold"
                >
                  <Plus size={14} /> Add First Event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((evt, idx) => {
                  const actualIndex = events.findIndex((e) => e === evt);
                  return (
                    <div
                      key={evt.id || idx}
                      className={cn(
                        "rounded-2xl border-2 p-4 transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-4",
                        evt.highlight ? "border-web shadow-xs bg-blue-50/20" : "border-slate-200 hover:border-slate-400"
                      )}
                    >
                      {/* Left: Event Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cn(
                            "rounded-md border px-2 py-0.5 text-[10px] font-black uppercase",
                            evt.day === "Day 2" ? "bg-red-50 text-red-800 border-red-200" : "bg-blue-50 text-blue-800 border-blue-200"
                          )}>
                            {evt.day} ({evt.date || (evt.day === "Day 2" ? "3 Sept" : "2 Sept")})
                          </span>
                          <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-black uppercase", getCategoryColor(evt.category))}>
                            {evt.category}
                          </span>
                          <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-black uppercase", 
                            STATUS_OPTIONS.find((s) => s.value === evt.status)?.color || "bg-slate-100 text-slate-700"
                          )}>
                            {STATUS_OPTIONS.find((s) => s.value === evt.status)?.label || evt.status}
                          </span>
                          {evt.highlight && (
                            <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-800">
                              ⭐ Highlight
                            </span>
                          )}
                        </div>

                        <h4 className="font-display text-lg text-web truncate">
                          {evt.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-bold">
                          <span className="flex items-center gap-1 text-spidey">
                            <Clock size={13} /> {evt.time}
                          </span>
                          {evt.venue && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <MapPin size={13} /> {evt.venue}
                            </span>
                          )}
                        </div>

                        {evt.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                        {/* Move Up / Down */}
                        <button
                          type="button"
                          onClick={() => handleMoveUp(actualIndex)}
                          disabled={actualIndex === 0}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(actualIndex)}
                          disabled={actualIndex === events.length - 1}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown size={15} />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openEditModal(actualIndex)}
                          className="inline-flex items-center gap-1 rounded-xl border border-web/30 bg-web/10 px-3 py-1.5 text-xs font-black text-web hover:bg-web hover:text-white transition"
                        >
                          <Edit3 size={14} /> Edit
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(actualIndex)}
                          className="rounded-xl border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-600 hover:text-white transition"
                          title="Delete Event"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT TIMELINE EVENT */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-3 border-web bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <h3 className="font-display text-2xl text-web flex items-center gap-2">
                <Calendar className="text-spidey" size={22} />
                {editingIndex !== null ? "Edit Milestone / Event" : "Add New Milestone"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEventModal} className="space-y-4 text-xs font-bold text-slate-700">
              {/* Event Title */}
              <div>
                <label className="block uppercase text-slate-600 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Mentoring Round: Problem Statement Review"
                  className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                />
              </div>

              {/* Day & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-slate-600 mb-1">Hackathon Day *</label>
                  <select
                    value={eventForm.day}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEventForm({
                        ...eventForm,
                        day: val,
                        date: val === "Day 2" ? "3 September 2026" : "2 September 2026",
                      });
                    }}
                    className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  >
                    <option value="Day 1">Day 1 (2 September 2026)</option>
                    <option value="Day 2">Day 2 (3 September 2026)</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase text-slate-600 mb-1">Date</label>
                  <input
                    type="text"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    placeholder="e.g. 2 September 2026"
                    className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Time & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-slate-600 mb-1">Time Range</label>
                  <input
                    type="text"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    placeholder="e.g. 02:30 PM - 05:30 PM"
                    className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block uppercase text-slate-600 mb-1">Venue / Location</label>
                  <input
                    type="text"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    placeholder="e.g. Main Auditorium / Assigned Labs"
                    className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-slate-600 mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block uppercase text-slate-600 mb-1">Current Status</label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block uppercase text-slate-600 mb-1">Event Description</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="Details for participants (e.g. what to bring, jury criteria, submission links)..."
                  className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                />
              </div>

              {/* Highlight Star */}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                <input
                  type="checkbox"
                  id="highlightCheckbox"
                  checked={eventForm.highlight}
                  onChange={(e) => setEventForm({ ...eventForm, highlight: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-web focus:ring-web"
                />
                <label htmlFor="highlightCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  ⭐ Mark as Key Marquee Event (Featured with prominent border & highlight)
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" className="bg-web text-white hover:bg-spidey">
                  {editingIndex !== null ? "Update Event" : "Add Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
