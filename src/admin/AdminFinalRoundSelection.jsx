import { useEffect, useMemo, useState } from "react";
import { 
  Trophy, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  FileSpreadsheet,
  Crown,
  Printer,
  Share2,
  Check,
  Eye,
  X,
  Building,
  GraduationCap,
  Calendar,
  Flame,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  Layers,
  SlidersHorizontal,
  MoveUp,
  MoveDown,
  Trash2
} from "lucide-react";
import { adminFetchTeams, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";
import { SihLogo } from "../components/ui/SihLogo";
import { getShortBranch, getNormalizedStream, getNormalizedYear } from "./AdminAttendanceSheet";

const STORAGE_KEY = "sih_final_round_selected_team_ids_v2";

export function AdminFinalRoundSelection() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // "ALL", "SELECTED", "UNSELECTED", "OPEN_INNO", "PS_ALLOCATED"
  const [activeTab, setActiveTab] = useState("SELECTOR"); // "SELECTOR", "SEQUENCE", "SHOWCASE", "PRINT_CIRCULAR"
  
  // Array of team IDs in EXACT selection sequence (Index 0 = #1, Index 1 = #2, etc.)
  const [selectedTeamIds, setSelectedTeamIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [selectedTeamModal, setSelectedTeamModal] = useState(null);
  const [customCircularRef, setCustomCircularRef] = useState("GTMC/SIH-2026/FINAL-ROUND/025");
  const [customCircularDate, setCustomCircularDate] = useState(() => 
    new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
  );
  const [targetLimit, setTargetLimit] = useState(25);

  // Sync selected IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedTeamIds));
    } catch (e) {
      console.error("Failed to persist selected team ids", e);
    }
  }, [selectedTeamIds]);

  async function load() {
    setLoading(true);
    try {
      const data = await adminFetchTeams();
      setTeams(data || []);
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const unsubscribe = subscribeTable("teams", () => load().catch(() => undefined));
    return () => unsubscribe();
  }, []);

  // Filter only confirmed / valid teams
  const confirmedTeams = useMemo(() => {
    return teams.filter((t) => {
      return (
        t.payment_status === "SUCCESS" ||
        t.registration_status === "CONFIRMED" ||
        t.paymentStatus === "SUCCESS" ||
        t.registrationStatus === "CONFIRMED"
      );
    });
  }, [teams]);

  // Fast lookup Map by team ID
  const teamsMap = useMemo(() => {
    const map = new Map();
    teams.forEach((t) => {
      if (t.id) map.set(t.id, t);
    });
    return map;
  }, [teams]);

  // Selected teams in the EXACT selection sequence order (First chosen = #1, second = #2, etc.)
  const selectedTeams = useMemo(() => {
    return selectedTeamIds
      .map((id) => teamsMap.get(id))
      .filter(Boolean);
  }, [selectedTeamIds, teamsMap]);

  // Toggle selection for a single team (maintains exact append order)
  function toggleTeamSelection(teamId) {
    setSelectedTeamIds((prev) => {
      if (prev.includes(teamId)) {
        // Remove
        return prev.filter((id) => id !== teamId);
      } else {
        // Append at the end (maintains chronological click sequence)
        return [...prev, teamId];
      }
    });
  }

  // Move a team UP in the sequence
  function moveTeamUp(index) {
    if (index <= 0) return;
    setSelectedTeamIds((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  }

  // Move a team DOWN in the sequence
  function moveTeamDown(index) {
    if (index >= selectedTeamIds.length - 1) return;
    setSelectedTeamIds((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  }

  // Remove a specific team from sequence
  function removeSelectedTeam(teamId) {
    setSelectedTeamIds((prev) => prev.filter((id) => id !== teamId));
  }

  // Quick select top N teams in order
  function handleSelectTopN(count = 25) {
    const idsToSelect = confirmedTeams.slice(0, count).map((t) => t.id);
    setSelectedTeamIds(idsToSelect);
  }

  // Select all currently filtered teams
  function handleSelectAllFiltered() {
    const idsToAdd = filteredTeams.map((t) => t.id).filter((id) => !selectedTeamIds.includes(id));
    setSelectedTeamIds((prev) => [...prev, ...idsToAdd]);
  }

  // Clear all selections
  function handleClearAll() {
    if (selectedTeamIds.length === 0) return;
    if (confirm(`Are you sure you want to deselect all ${selectedTeamIds.length} teams?`)) {
      setSelectedTeamIds([]);
    }
  }

  // Search and category filter
  const filteredTeams = useMemo(() => {
    const selectedSet = new Set(selectedTeamIds);
    return confirmedTeams.filter((t) => {
      const isSel = selectedSet.has(t.id);
      const isOpenInno = Boolean(t.is_open_innovation || t.isOpenInnovation);
      const hasPs = Boolean((t.selected_problem_id || t.selectedProblemId) && !isOpenInno);

      if (categoryFilter === "SELECTED" && !isSel) return false;
      if (categoryFilter === "UNSELECTED" && isSel) return false;
      if (categoryFilter === "OPEN_INNO" && !isOpenInno) return false;
      if (categoryFilter === "PS_ALLOCATED" && !hasPs) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          (t.team_name || t.teamName || "")?.toLowerCase().includes(q) ||
          (t.registration_id || t.registrationId || "")?.toLowerCase().includes(q) ||
          (t.leader_name || t.leaderName || "")?.toLowerCase().includes(q) ||
          (t.leader_email || t.email || "")?.toLowerCase().includes(q) ||
          (t.leader_phone || "")?.toLowerCase().includes(q) ||
          (t.selected_problem_code || t.selectedProblemCode || "")?.toLowerCase().includes(q) ||
          (t.selected_problem_title || t.selectedProblemTitle || "")?.toLowerCase().includes(q) ||
          (t.open_innovation_title || t.openInnovationTitle || "")?.toLowerCase().includes(q) ||
          (t.college || "")?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [confirmedTeams, selectedTeamIds, categoryFilter, search]);

  // Export Selected to CSV in exact sequence
  function handleExportSelectedCsv() {
    if (!selectedTeams.length) {
      alert("No teams currently selected to export.");
      return;
    }

    const rows = selectedTeams.map((t, idx) => {
      const members = t.members || [];
      const leader = members.find((m) => m.is_leader) || members[0] || {};
      const isOpenInno = Boolean(t.is_open_innovation || t.isOpenInnovation);

      return {
        "Selection Sequence / Rank": idx + 1,
        "Registration ID": t.registration_id || t.registrationId || `SIH-TM-${101 + idx}`,
        "Team Name": t.team_name || t.teamName,
        "College / Institution": t.college || "GTMC Nanded",
        "Stream": getNormalizedStream(t),
        "Branch": getShortBranch(t.leader_branch || leader.branch),
        "Year": getNormalizedYear(t),
        "Category": isOpenInno ? "Open Innovation" : "Problem Statement",
        "Problem Code": isOpenInno ? "OPEN-INNO" : (t.selected_problem_code || t.selectedProblemCode || "N/A"),
        "Problem / Project Title": isOpenInno ? (t.open_innovation_title || "Open Innovation Project") : (t.selected_problem_title || "N/A"),
        "Leader Name": t.leader_name || leader.name || "Leader",
        "Leader Mobile": t.leader_phone || leader.phone || "N/A",
        "Leader Email": t.leader_email || leader.email || "N/A",
        "Total Members": members.length || 6,
        "Members List": members.map((m) => m.name || m.full_name).filter(Boolean).join(", ")
      };
    });

    downloadCsv(`SIH2026_Top_${selectedTeams.length}_Final_Round_Sequence_Order.csv`, rows);
  }

  // Copy WhatsApp / Telegram Announcement Broadcast message in exact sequence
  function handleCopyBroadcast() {
    if (!selectedTeams.length) {
      alert("Please select at least 1 team first.");
      return;
    }

    const teamListText = selectedTeams
      .map((t, i) => {
        const isOpenInno = Boolean(t.is_open_innovation || t.isOpenInnovation);
        const pCode = isOpenInno ? "OPEN-INNO" : (t.selected_problem_code || t.selectedProblemCode || "PS");
        const pTitle = isOpenInno ? (t.open_innovation_title || "Open Innovation") : (t.selected_problem_title || "Project");
        return `🏅 *#${i + 1}. ${t.team_name || t.teamName}* (${t.registration_id || t.registrationId})\n   ↳ Leader: ${t.leader_name || "Leader"} | 🎯 ${pCode}: ${pTitle}`;
      })
      .join("\n\n");

    const message = `🎉 *SMART INDIA HACKATHON 2026 — GRAND FINALE QUALIFIERS* 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ *Gramin Technical & Management Campus, Nanded*
🏆 *OFFICIAL ANNOUNCEMENT: TOP ${selectedTeams.length} SHORTLISTED TEAMS*

Heartiest Congratulations to the following *${selectedTeams.length} Teams* selected for the *Final Evaluation Round / Grand Finale*! 🚀

${teamListText}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *IMPORTANT INSTRUCTIONS FOR FINAL ROUND:*
1. All qualified teams must report to the Main Auditorium with their working prototype.
2. Pitch Duration: 8 mins presentation + 4 mins Jury Q&A.
3. Keep your presentation slides and live demonstration ready.

✨ *Best of luck to all finalist teams!* ✨
- SIH Organizing Committee & Technical Jury Panel`;

    navigator.clipboard.writeText(message);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 3000);
  }

  function handlePrint() {
    window.print();
  }

  const isTargetAchieved = selectedTeams.length === targetLimit;

  return (
    <div className="space-y-6 text-left">
      {/* PRINT STYLES FOR OFFICIAL A4 CIRCULAR & PDF EXPORT */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 7mm 8mm 7mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 8.5pt !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only-container {
            display: block !important;
            width: 100% !important;
          }
          .print-table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          .print-table th,
          .print-table td {
            border: 1.2px solid #0f172a !important;
            padding: 4.5px 5px !important;
            font-size: 7.8pt !important;
            line-height: 1.2 !important;
            word-wrap: break-word !important;
          }
          .page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* SCREEN VIEW UI (Hidden in Print) */}
      <div className="no-print space-y-6">
        {/* Top Header Banner with Official SIH Logo */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-5 rounded-3xl border-3 border-web shadow-comic">
          <div className="flex items-center gap-4">
            <div className="shrink-0 p-1.5 bg-slate-50 border-2 border-web/20 rounded-2xl">
              <img
                src="/sih_official_logo.png?v=3"
                alt="Smart India Hackathon 2026 Official Logo"
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-0.5 text-xs font-black text-web uppercase tracking-wider">
                  <Trophy size={14} className="text-spidey animate-bounce" /> Final Round Selection System
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider ${
                  isTargetAchieved 
                    ? "bg-emerald-600 text-white shadow-comic" 
                    : "bg-slate-200 text-slate-800"
                }`}>
                  <CheckCircle2 size={13} /> {selectedTeams.length} / {targetLimit} Teams (Exact Sequence)
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl text-web">
                Final Round Selection & Announcement
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-ink/75">
                Teams appear in the <strong>exact order you select them</strong> (#1 first clicked, #2 second, etc.).
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={load}
              variant="secondary"
              className="flex items-center gap-1.5 py-2 px-3 text-xs font-black uppercase"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>

            <button
              onClick={handleCopyBroadcast}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-800 bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-black uppercase text-white transition shadow-comic"
              title="Copy WhatsApp announcement in exact selected sequence"
            >
              {copiedBroadcast ? <Check size={14} /> : <Share2 size={14} />}
              {copiedBroadcast ? "Copied!" : "WhatsApp Broadcast"}
            </button>

            <button
              onClick={handleExportSelectedCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-800 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-black uppercase text-white transition shadow-comic"
            >
              <FileSpreadsheet size={14} className="text-gold" /> Export CSV ({selectedTeams.length})
            </button>

            <Button
              onClick={handlePrint}
              className="flex items-center gap-2 py-2 px-4 text-xs font-black uppercase bg-spidey hover:bg-spidey-dark text-white transition shadow-comic border-2 border-web"
            >
              <Printer size={15} /> Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Quick Target Progress Bar */}
        <div className="rounded-3xl border-3 border-web bg-gradient-to-r from-web via-slate-900 to-web p-4 sm:p-5 text-white shadow-comic">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className="text-gold" size={20} />
                <h3 className="font-display text-lg sm:text-xl text-gold">
                  Top {targetLimit} Finalist Selection Tracker
                </h3>
              </div>
              <p className="text-xs text-white/80 font-medium">
                {selectedTeams.length < targetLimit 
                  ? `Select ${targetLimit - selectedTeams.length} more teams to complete the Top ${targetLimit} sequence.`
                  : selectedTeams.length === targetLimit
                  ? `🎉 Perfect! Exactly ${targetLimit} teams are shortlisted in your custom sequence.`
                  : `⚠️ ${selectedTeams.length} teams selected (${selectedTeams.length - targetLimit} over target).`}
              </p>
            </div>

            {/* Target Limit Selector & Quick Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5 border border-white/20">
                <span className="text-xs font-bold text-white/90">Target:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetLimit}
                  onChange={(e) => setTargetLimit(Number(e.target.value) || 25)}
                  className="w-12 bg-white text-ink text-center font-black rounded-lg text-xs py-0.5"
                />
              </div>

              <button
                onClick={() => handleSelectTopN(targetLimit)}
                className="rounded-xl border border-gold bg-gold/20 hover:bg-gold hover:text-web px-3 py-1.5 text-xs font-black uppercase text-gold transition"
              >
                ⚡ Pick First {targetLimit}
              </button>

              <button
                onClick={handleClearAll}
                className="rounded-xl border border-rose-500/50 bg-rose-500/20 hover:bg-rose-600 px-3 py-1.5 text-xs font-black uppercase text-rose-200 transition"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider mb-1">
              <span className="text-gold">{selectedTeams.length} Finalists in Sequence</span>
              <span className="text-white/70">{Math.round((selectedTeams.length / targetLimit) * 100)}% Complete</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isTargetAchieved 
                    ? "bg-gradient-to-r from-emerald-400 to-gold" 
                    : "bg-gradient-to-r from-spidey to-gold"
                }`}
                style={{ width: `${Math.min(100, (selectedTeams.length / targetLimit) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 pb-3">
          <div className="flex flex-wrap bg-slate-200 p-1 rounded-2xl border-2 border-web/20">
            <button
              onClick={() => setActiveTab("SELECTOR")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase transition ${
                activeTab === "SELECTOR"
                  ? "bg-web text-white shadow-comic"
                  : "text-slate-700 hover:text-ink"
              }`}
            >
              <CheckCircle2 size={15} /> 1. Manual Checkbox Selector
            </button>

            <button
              onClick={() => setActiveTab("SEQUENCE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase transition ${
                activeTab === "SEQUENCE"
                  ? "bg-indigo-700 text-white shadow-comic"
                  : "text-slate-700 hover:text-ink"
              }`}
            >
              <ListOrdered size={15} /> 2. Sequence Order Manager ({selectedTeams.length})
            </button>

            <button
              onClick={() => setActiveTab("SHOWCASE")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase transition ${
                activeTab === "SHOWCASE"
                  ? "bg-gold text-web shadow-comic"
                  : "text-slate-700 hover:text-ink"
              }`}
            >
              <Sparkles size={15} /> 3. Congratulations Showcase 🎉
            </button>

            <button
              onClick={() => setActiveTab("PRINT_CIRCULAR")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase transition ${
                activeTab === "PRINT_CIRCULAR"
                  ? "bg-spidey text-white shadow-comic"
                  : "text-slate-700 hover:text-ink"
              }`}
            >
              <Printer size={15} /> 4. Official PDF & Circular
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Live Order Preserved</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
        </div>

        {/* TAB 1: MANUAL CHECKBOX SELECTOR */}
        {activeTab === "SELECTOR" && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border-2 border-web/20 bg-white p-3 shadow-xs">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidate teams to select..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border-2 border-web/20 bg-slate-50 pl-9 pr-8 py-2 text-xs font-bold text-ink placeholder:text-slate-400 focus:border-web focus:bg-white focus:outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black">
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setCategoryFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition whitespace-nowrap ${
                    categoryFilter === "ALL" ? "bg-web text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All ({confirmedTeams.length})
                </button>

                <button
                  onClick={() => setCategoryFilter("SELECTED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition whitespace-nowrap ${
                    categoryFilter === "SELECTED" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Selected ({selectedTeams.length})
                </button>

                <button
                  onClick={() => setCategoryFilter("UNSELECTED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition whitespace-nowrap ${
                    categoryFilter === "UNSELECTED" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Unselected ({confirmedTeams.length - selectedTeams.length})
                </button>

                <button
                  onClick={() => setCategoryFilter("PS_ALLOCATED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition whitespace-nowrap ${
                    categoryFilter === "PS_ALLOCATED" ? "bg-spidey text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Problem Statements
                </button>

                <button
                  onClick={() => setCategoryFilter("OPEN_INNO")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition whitespace-nowrap ${
                    categoryFilter === "OPEN_INNO" ? "bg-gold text-web" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Open Innovation
                </button>
              </div>
            </div>

            {/* Interactive Selectable Teams Table */}
            <div className="overflow-hidden rounded-3xl border-3 border-web bg-white shadow-comic">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-web text-white font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={filteredTeams.length > 0 && filteredTeams.every((t) => selectedTeamIds.includes(t.id))}
                          onChange={(e) => {
                            if (e.target.checked) handleSelectAllFiltered();
                            else {
                              const fIds = new Set(filteredTeams.map((t) => t.id));
                              setSelectedTeamIds((prev) => prev.filter((id) => !fIds.has(id)));
                            }
                          }}
                          className="h-4 w-4 rounded accent-gold cursor-pointer"
                        />
                      </th>
                      <th className="p-3.5 w-32">Selection Rank</th>
                      <th className="p-3.5">Team & Reg ID</th>
                      <th className="p-3.5">Allocated Problem / Project</th>
                      <th className="p-3.5">Team Leader</th>
                      <th className="p-3.5">Stream & College</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 font-semibold">
                    {filteredTeams.map((team, idx) => {
                      const isSelected = selectedTeamIds.includes(team.id);
                      const sequenceIndex = selectedTeamIds.indexOf(team.id);
                      const members = team.members || [];
                      const leader = members.find((m) => m.is_leader) || members[0] || {};
                      const isOpenInno = Boolean(team.is_open_innovation || team.isOpenInnovation);
                      const probTitle = isOpenInno
                        ? team.open_innovation_title || "Open Innovation Project"
                        : team.selected_problem_title || "Problem Statement";
                      const probCode = isOpenInno ? "OPEN-INNO" : (team.selected_problem_code || "PS");

                      return (
                        <tr
                          key={team.id || idx}
                          onClick={() => toggleTeamSelection(team.id)}
                          className={`cursor-pointer transition select-none ${
                            isSelected
                              ? "bg-amber-50/90 hover:bg-amber-100 border-l-4 border-l-gold"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTeamSelection(team.id)}
                              className="h-5 w-5 rounded accent-spidey cursor-pointer"
                            />
                          </td>

                          {/* Selection Rank Badge (Exact Click Sequence) */}
                          <td className="p-3.5">
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-black text-web border border-web/20 shadow-xs">
                                <Crown size={13} className="text-spidey" /> Rank #{sequenceIndex + 1}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 border border-slate-200">
                                Click to Select
                              </span>
                            )}
                          </td>

                          {/* Team Name & Reg ID */}
                          <td className="p-3.5">
                            <span className="font-mono text-[10px] font-black text-spidey bg-spidey/10 px-1.5 py-0.5 rounded">
                              {team.registration_id || team.registrationId || "CONFIRMED"}
                            </span>
                            <h4 className="font-display text-base text-web leading-tight mt-0.5">
                              {team.team_name || team.teamName}
                            </h4>
                          </td>

                          {/* Problem Code & Title */}
                          <td className="p-3.5">
                            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded mb-1 ${
                              isOpenInno ? "bg-gold/40 text-web border border-gold" : "bg-spidey/15 text-spidey font-mono"
                            }`}>
                              {probCode}
                            </span>
                            <p className="font-bold text-xs text-slate-800 line-clamp-2 max-w-sm">
                              {probTitle}
                            </p>
                          </td>

                          {/* Leader */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-1">
                              <Crown size={12} className="text-gold shrink-0" />
                              <span className="font-bold text-web">{leader.name || team.leader_name || "Leader"}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              {leader.phone || team.leader_phone || "No phone"}
                            </span>
                          </td>

                          {/* Stream & College */}
                          <td className="p-3.5">
                            <p className="font-bold text-slate-700 text-xs">
                              {getNormalizedStream(team)} • {getShortBranch(team.leader_branch || leader.branch)} ({getNormalizedYear(team)})
                            </p>
                            <span className="text-[10px] text-slate-500 block">
                              {team.college || "GTMC Nanded"}
                            </span>
                          </td>

                          {/* Quick Inspect Details */}
                          <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedTeamModal(team)}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 transition"
                            >
                              <Eye size={12} /> Roster ({members.length})
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!filteredTeams.length && !loading && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-500 font-bold">
                          No teams found matching search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEQUENCE ORDER MANAGER (Reorder & Arrange Finalist Ranks) */}
        {activeTab === "SEQUENCE" && (
          <div className="space-y-4">
            <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-display text-lg text-indigo-950 flex items-center gap-2">
                  <ListOrdered size={20} className="text-indigo-600" /> Sequence & Ranking Re-order
                </h3>
                <p className="text-xs text-indigo-800 font-medium">
                  Use the <strong>Up (▲)</strong> and <strong>Down (▼)</strong> buttons below to customize the exact sequence number for each finalist team. This exact order will be reflected in the PDF circular and announcement.
                </p>
              </div>

              <span className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 text-white font-black text-xs px-3.5 py-2 shadow-xs shrink-0">
                {selectedTeams.length} Teams in Sequence
              </span>
            </div>

            <div className="overflow-hidden rounded-3xl border-3 border-web bg-white shadow-comic">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-web text-white font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5 w-16 text-center">Rank</th>
                      <th className="p-3.5 w-24 text-center">Reorder</th>
                      <th className="p-3.5">Team & Reg ID</th>
                      <th className="p-3.5">Allocated Problem Statement</th>
                      <th className="p-3.5">Team Leader & Contact</th>
                      <th className="p-3.5 text-right">Remove</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200 font-semibold">
                    {selectedTeams.map((team, idx) => {
                      const members = team.members || [];
                      const leader = members.find((m) => m.is_leader) || members[0] || {};
                      const isOpenInno = Boolean(team.is_open_innovation || team.isOpenInnovation);
                      const probTitle = isOpenInno
                        ? team.open_innovation_title || "Open Innovation Project"
                        : team.selected_problem_title || "Problem Statement";
                      const probCode = isOpenInno ? "OPEN-INNO" : (team.selected_problem_code || "PS");

                      return (
                        <tr key={team.id || idx} className="hover:bg-slate-50 transition">
                          {/* Rank */}
                          <td className="p-3.5 text-center">
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gold text-web font-display text-sm font-black border border-web/20 shadow-xs">
                              #{idx + 1}
                            </span>
                          </td>

                          {/* Reorder Buttons */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                disabled={idx === 0}
                                onClick={() => moveTeamUp(idx)}
                                className={`p-1.5 rounded-lg border text-xs font-black transition ${
                                  idx === 0
                                    ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border-indigo-200"
                                }`}
                                title="Move Up in Rank"
                              >
                                <ArrowUp size={14} />
                              </button>

                              <button
                                disabled={idx === selectedTeams.length - 1}
                                onClick={() => moveTeamDown(idx)}
                                className={`p-1.5 rounded-lg border text-xs font-black transition ${
                                  idx === selectedTeams.length - 1
                                    ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed"
                                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border-indigo-200"
                                }`}
                                title="Move Down in Rank"
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>
                          </td>

                          {/* Team Name */}
                          <td className="p-3.5">
                            <span className="font-mono text-[10px] font-black text-spidey bg-spidey/10 px-1.5 py-0.5 rounded">
                              {team.registration_id || team.registrationId}
                            </span>
                            <h4 className="font-display text-base text-web leading-tight mt-0.5">
                              {team.team_name || team.teamName}
                            </h4>
                          </td>

                          {/* Problem Title */}
                          <td className="p-3.5">
                            <span className="font-mono text-[10px] font-bold text-spidey">[{probCode}]</span>
                            <p className="font-bold text-xs text-slate-800 line-clamp-2 max-w-sm">
                              {probTitle}
                            </p>
                          </td>

                          {/* Leader */}
                          <td className="p-3.5">
                            <span className="font-bold text-web">{leader.name || team.leader_name || "Leader"}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              {leader.phone || team.leader_phone || ""}
                            </span>
                          </td>

                          {/* Remove */}
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => removeSelectedTeam(team.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition"
                              title="Deselect Team"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!selectedTeams.length && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">
                          No teams currently selected. Switch to "Manual Checkbox Selector" tab to pick teams.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONGRATULATIONS SHOWCASE (Interactive Live View / Projector View) */}
        {activeTab === "SHOWCASE" && (
          <div className="space-y-6">
            {/* Grand Celebratory Banner with Official SIH Logo */}
            <div className="relative overflow-hidden rounded-3xl border-4 border-gold bg-gradient-to-br from-slate-950 via-web to-slate-900 p-6 sm:p-8 text-center text-white shadow-2xl">
              <div className="relative z-10 max-w-3xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/20 p-2 px-4 shadow-inner mb-2">
                  <img
                    src="/sih_official_logo.png?v=3"
                    alt="Official SIH Logo"
                    className="h-10 sm:h-12 w-auto object-contain"
                  />
                  <div className="text-left">
                    <p className="font-serif text-[11px] font-black uppercase text-gold tracking-wider">
                      GRAMIN TECHNICAL & MANAGEMENT CAMPUS, NANDED
                    </p>
                    <p className="text-[10px] font-bold text-white/80">
                      SMART INDIA HACKATHON 2026 — INTERNAL GRAND FINALE
                    </p>
                  </div>
                </div>

                <h2 className="font-display text-3xl sm:text-5xl text-gold drop-shadow-md tracking-tight">
                  🎉 HEARTIEST CONGRATULATIONS 🎉
                </h2>
                
                <h3 className="font-display text-xl sm:text-2xl text-white">
                  TOP {selectedTeams.length} SHORTLISTED TEAMS FOR THE GRAND FINALE
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 font-semibold max-w-xl mx-auto">
                  Listed below in the exact jury selection sequence. All qualified teams must report to the grand stage for the final presentation round.
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleCopyBroadcast}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gold px-5 py-2.5 text-xs font-black uppercase text-web hover:bg-gold-light transition shadow-comic"
                  >
                    <Share2 size={15} /> Copy WhatsApp Announcement
                  </button>
                  <Button
                    onClick={handlePrint}
                    className="flex items-center gap-2 rounded-2xl bg-spidey hover:bg-spidey-dark text-white px-5 py-2.5 text-xs font-black uppercase shadow-comic"
                  >
                    <Printer size={15} /> Print Official Circular
                  </Button>
                </div>
              </div>
            </div>

            {/* Selected Teams Cards Grid in Exact Selection Sequence */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedTeams.map((team, index) => {
                const members = team.members || [];
                const leader = members.find((m) => m.is_leader) || members[0] || {};
                const isOpenInno = Boolean(team.is_open_innovation || team.isOpenInnovation);
                const probCode = isOpenInno ? "OPEN-INNO" : (team.selected_problem_code || "PS");
                const probTitle = isOpenInno
                  ? team.open_innovation_title || "Custom Innovation Project"
                  : team.selected_problem_title || "Problem Statement";

                return (
                  <div
                    key={team.id || index}
                    className="relative rounded-3xl border-3 border-web bg-white p-5 shadow-comic hover:-translate-y-1 transition duration-200 flex flex-col justify-between"
                  >
                    {/* Top Tag & Rank */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 font-display text-xs text-web font-black border border-web/20">
                          <Crown size={13} className="text-spidey" /> Finalist #{index + 1}
                        </span>
                        <span className="font-mono text-xs font-black text-spidey bg-spidey/10 px-2 py-0.5 rounded">
                          {team.registration_id || team.registrationId}
                        </span>
                      </div>

                      {/* Team Name */}
                      <h3 className="font-display text-xl text-web mb-2">
                        {team.team_name || team.teamName}
                      </h3>

                      {/* Problem Statement Box */}
                      <div className="rounded-2xl bg-slate-50 border-2 border-slate-200 p-3 mb-3">
                        <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded mb-1 ${
                          isOpenInno ? "bg-gold text-web" : "bg-spidey text-white"
                        }`}>
                          {probCode}
                        </span>
                        <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                          {probTitle}
                        </p>
                      </div>
                    </div>

                    {/* Team Leader & Roster Footer */}
                    <div className="border-t border-slate-200 pt-3 mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">Leader:</span>
                        <span className="font-black text-web">{leader.name || team.leader_name || "Leader"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">Stream:</span>
                        <span className="font-bold text-slate-700">{getNormalizedStream(team)} ({getShortBranch(team.leader_branch || leader.branch)})</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">Team Size:</span>
                        <span className="font-mono font-black text-spidey">{members.length || 6} Members</span>
                      </div>

                      <button
                        onClick={() => setSelectedTeamModal(team)}
                        className="w-full mt-2 rounded-xl border border-web/20 bg-slate-100 hover:bg-web hover:text-white py-1.5 text-xs font-black uppercase text-web transition"
                      >
                        Inspect Members
                      </button>
                    </div>
                  </div>
                );
              })}

              {!selectedTeams.length && (
                <div className="col-span-full rounded-3xl border-3 border-dashed border-slate-300 p-12 text-center bg-white">
                  <Trophy size={40} className="mx-auto text-slate-300 mb-3" />
                  <h4 className="font-display text-xl text-slate-600">No Final Round Teams Selected Yet</h4>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    Switch to the "Manual Checkbox Selector" tab and check the boxes next to candidate teams.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: OFFICIAL PRINT & PDF CIRCULAR PREVIEW */}
        {activeTab === "PRINT_CIRCULAR" && (
          <div className="space-y-4">
            {/* Print Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border-2 border-web/20 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Circular Ref No.</label>
                  <input
                    type="text"
                    value={customCircularRef}
                    onChange={(e) => setCustomCircularRef(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-mono font-bold text-ink"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Notification Date</label>
                  <input
                    type="text"
                    value={customCircularDate}
                    onChange={(e) => setCustomCircularDate(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-bold text-ink"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrint}
                  className="flex items-center gap-2 py-2 px-5 text-xs font-black uppercase bg-spidey hover:bg-spidey-dark text-white shadow-comic"
                >
                  <Printer size={16} /> Print / Save as PDF
                </Button>
              </div>
            </div>

            {/* Document Print Container Wrapper */}
            <div className="bg-slate-200 p-4 sm:p-8 rounded-3xl overflow-x-auto shadow-inner">
              <div className="bg-white mx-auto shadow-2xl p-6 sm:p-10 max-w-[210mm] border border-slate-300 text-black">
                {/* Official Circular Document Rendered */}
                <OfficialCircularDocument
                  selectedTeams={selectedTeams}
                  circularRef={customCircularRef}
                  circularDate={customCircularDate}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DEDICATED PRINT ONLY VIEW (Rendered purely when window.print() is fired) */}
      <div className="hidden print:block print-only-container">
        <OfficialCircularDocument
          selectedTeams={selectedTeams}
          circularRef={customCircularRef}
          circularDate={customCircularDate}
        />
      </div>

      {/* TEAM ROSTER MODAL */}
      {selectedTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl border-4 border-web bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <span className="font-mono text-xs font-black text-spidey bg-spidey/10 px-2.5 py-0.5 rounded">
                  {selectedTeamModal.registration_id || selectedTeamModal.registrationId}
                </span>
                <h3 className="font-display text-2xl text-web mt-1">
                  {selectedTeamModal.team_name || selectedTeamModal.teamName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTeamModal(null)}
                className="rounded-full p-2 text-slate-400 hover:text-black hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 border p-3">
                <span className="text-[10px] font-black uppercase text-slate-500 block">Allocated Problem</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {selectedTeamModal.is_open_innovation ? (selectedTeamModal.open_innovation_title || "Open Innovation") : (selectedTeamModal.selected_problem_title || "Problem Statement")}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-slate-500 mb-2">Team Members ({selectedTeamModal.members?.length || 6})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(selectedTeamModal.members || []).map((m, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 p-2.5 bg-white text-xs">
                      <div className="flex items-center gap-1.5">
                        {m.is_leader && <Crown size={13} className="text-gold" />}
                        <span className="font-bold text-web">{m.name || m.full_name || `Member ${idx + 1}`}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {m.branch || selectedTeamModal.leader_branch || "Engg"} • {m.year || "Year"}
                      </p>
                      {m.phone && <p className="text-[10px] text-slate-400 font-mono">{m.phone}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedTeamModal(null)} className="text-xs font-black uppercase">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Clean, Official Circular Document for Screen and Print with Official SIH Logo
function OfficialCircularDocument({ selectedTeams, circularRef, circularDate }) {
  return (
    <div className="space-y-4 text-black text-left font-sans">
      {/* Official Header with Official SIH 2026 Logo */}
      <div className="border-b-2 border-black pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <img
                src="/sih_official_logo.png?v=3"
                alt="Smart India Hackathon 2026 Official Emblem"
                className="h-16 sm:h-20 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="font-serif text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                GRAMIN TECHNICAL & MANAGEMENT CAMPUS, NANDED
              </h1>
              <p className="text-[9.5pt] font-bold text-slate-700">
                Approved by AICTE, New Delhi | Affiliated to SRTMU Nanded & MSBTE Mumbai
              </p>
              <p className="text-[10.5pt] font-black text-spidey uppercase mt-0.5">
                SMART INDIA HACKATHON 2026 — INTERNAL ROUND & GRAND FINALE
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block border border-black px-2.5 py-1 text-[8pt] font-mono font-black uppercase">
              OFFICIAL NOTIFICATION
            </span>
          </div>
        </div>
      </div>

      {/* Reference and Date Info */}
      <div className="flex items-center justify-between text-[8.5pt] font-bold border-b border-slate-300 pb-1.5">
        <span><strong>Ref No:</strong> <span className="font-mono">{circularRef}</span></span>
        <span><strong>Date:</strong> {circularDate}</span>
      </div>

      {/* Notification Title */}
      <div className="text-center py-1">
        <h2 className="text-[10pt] sm:text-[11pt] font-black uppercase tracking-wider text-black border-y-2 border-black py-1.5 bg-slate-100">
          OFFICIAL NOTIFICATION: SHORTLISTED TEAMS FOR THE FINAL ROUND / GRAND FINALE
        </h2>
      </div>

      {/* Congratulatory preamble */}
      <div className="text-[8.5pt] text-justify leading-relaxed text-slate-800 bg-amber-50/60 p-2.5 border border-amber-300 rounded">
        <p>
          <strong>Heartiest Congratulations!</strong> Based on evaluation by the technical jury panel and project review milestones, the following <strong>{selectedTeams.length} Teams</strong> have been officially shortlisted to compete in the <strong>Grand Finale / Final Round</strong> of the Internal Smart India Hackathon 2026 in the sequence of selection below:
        </p>
      </div>

      {/* High-Resolution Selected Teams Table in Exact Selection Sequence */}
      <table className="print-table w-full border-collapse border border-black text-left text-[9pt]">
        <thead>
          <tr className="bg-slate-200 text-black font-black uppercase text-[8pt]">
            <th className="border border-black p-1.5 w-8 text-center">#</th>
            <th className="border border-black p-1.5 w-24">Team ID</th>
            <th className="border border-black p-1.5">Team Name & College</th>
            <th className="border border-black p-1.5">Allocated Problem Statement / Domain</th>
            <th className="border border-black p-1.5 w-32">Team Leader</th>
            <th className="border border-black p-1.5 w-20 text-center">Desk Slot</th>
          </tr>
        </thead>
        <tbody>
          {selectedTeams.map((team, idx) => {
            const members = team.members || [];
            const leader = members.find((m) => m.is_leader) || members[0] || {};
            const isOpenInno = Boolean(team.is_open_innovation || team.isOpenInnovation);
            const pCode = isOpenInno ? "OPEN-INNO" : (team.selected_problem_code || team.selectedProblemCode || "PS");
            const pTitle = isOpenInno
              ? team.open_innovation_title || "Open Innovation Project"
              : team.selected_problem_title || team.selectedProblemTitle || "Problem Statement";

            return (
              <tr key={team.id || idx} className="page-break-avoid font-medium text-[8pt]">
                <td className="border border-black p-1.5 text-center font-bold font-mono">{idx + 1}</td>
                <td className="border border-black p-1.5 font-mono font-bold">{team.registration_id || team.registrationId || `TM-${101 + idx}`}</td>
                <td className="border border-black p-1.5">
                  <div className="font-bold text-black text-[8.5pt]">{team.team_name || team.teamName}</div>
                  <div className="text-[7.5pt] text-slate-600">{getNormalizedStream(team)} ({getShortBranch(team.leader_branch || leader.branch)}) • {team.college || "GTMC Nanded"}</div>
                </td>
                <td className="border border-black p-1.5">
                  <span className="font-mono font-bold text-[7.5pt] bg-slate-100 px-1 py-0.5 rounded mr-1">[{pCode}]</span>
                  <span className="font-medium text-slate-900">{pTitle}</span>
                </td>
                <td className="border border-black p-1.5">
                  <div className="font-bold">{leader.name || team.leader_name || "Leader"}</div>
                  <div className="text-[7.5pt] text-slate-600 font-mono">{leader.phone || team.leader_phone || ""}</div>
                </td>
                <td className="border border-black p-1.5 text-center font-mono font-bold">
                  {team.desk_number || team.deskNumber ? `Desk-${team.desk_number || team.deskNumber}` : `Slot #${idx + 1}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Guidelines Box */}
      <div className="page-break-avoid border border-black p-2.5 text-[8pt] space-y-1 bg-slate-50">
        <h4 className="font-black uppercase text-[8.5pt]">Guidelines for Final Round Presentation:</h4>
        <ul className="list-disc list-inside space-y-0.5 text-slate-800">
          <li>All shortlisted teams must be stationed at their designated desk before the final jury rounds begin.</li>
          <li>Each team will be given <strong>8 Minutes for Presentation + 4 Minutes for Live Demo & Jury Q&A</strong>.</li>
          <li>Hardware / software prototypes must be kept in working condition for live inspection.</li>
        </ul>
      </div>

      {/* Signatures Footer */}
      <div className="page-break-avoid pt-6 mt-4 border-t border-slate-300">
        <div className="grid grid-cols-3 gap-4 text-center text-[8pt]">
          <div>
            <div className="h-10"></div>
            <p className="border-t border-black font-black uppercase pt-1">SIH Faculty SPOC</p>
            <p className="text-[7pt] text-slate-600">Event Coordinator</p>
          </div>
          <div>
            <div className="h-10"></div>
            <p className="border-t border-black font-black uppercase pt-1">Jury Committee Chair</p>
            <p className="text-[7pt] text-slate-600">Chief Evaluator</p>
          </div>
          <div>
            <div className="h-10"></div>
            <p className="border-t border-black font-black uppercase pt-1">Principal / Campus Director</p>
            <p className="text-[7pt] text-slate-600">GTMC Nanded</p>
          </div>
        </div>
      </div>
    </div>
  );
}
