import { useEffect, useState, useMemo } from "react";
import { 
  Printer, 
  Search, 
  Sparkles, 
  Building, 
  GraduationCap, 
  Hash, 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  Table as TableIcon,
  LayoutGrid,
  List,
  Check,
  X,
  Scissors,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { adminFetchTeams, adminUpdateTeamSeating, adminBatchUpdateSeating, subscribeTable } from "../services/apiService";
import { Button } from "../components/ui/Button";
import { getShortBranch, getNormalizedStream, getNormalizedYear } from "./AdminAttendanceSheet";

export function AdminSeatingAndPlacards() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [streamFilter, setStreamFilter] = useState("ALL"); // ALL, B.Tech, Diploma, B.Voc, BCA, MCA, B.Sc
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [batchFilter, setBatchFilter] = useState("ALL"); // ALL, JUNIORS, SENIORS, UNASSIGNED, ASSIGNED
  const [sortBy, setSortBy] = useState("YEAR_BRANCH"); // YEAR_BRANCH, STREAM_YEAR, BRANCH, REG_ID, DESK
  const [viewMode, setViewMode] = useState("PLACARDS"); // "PLACARDS" (4/page), "TABLE_LIST"
  
  // Auto-Assign Modal State
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoPrefix, setAutoPrefix] = useState("T-");
  const [autoStartNum, setAutoStartNum] = useState(1);
  const [autoTarget, setAutoTarget] = useState("FILTERED");
  const [autoBusy, setAutoBusy] = useState(false);

  // Inline edit state
  const [editingDeskId, setEditingDeskId] = useState(null);
  const [deskInput, setDeskInput] = useState("");
  const [savingDesk, setSavingDesk] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await adminFetchTeams();
      setTeams(data || []);
    } catch (err) {
      console.error("Failed to fetch teams for seating:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return subscribeTable("teams", () => load().catch(() => undefined));
  }, []);

  // Helper to categorize Junior (1st/2nd Yr) vs Senior (3rd/Final Yr)
  function getTeamBatchInfo(team) {
    const yr = getNormalizedYear(team);
    if (yr.includes("1st") || yr.includes("2nd")) {
      return {
        batch: "JUNIOR",
        label: "Junior Batch (1st/2nd Year)",
        color: "text-amber-700 bg-amber-50 border-amber-300"
      };
    }
    return {
      batch: "SENIOR",
      label: "Senior Batch (3rd/Final Year)",
      color: "text-indigo-700 bg-indigo-50 border-indigo-300"
    };
  }

  // Multi-dimensional Stream, Branch & Year Analytics Breakdown
  const analytics = useMemo(() => {
    const streams = {};
    const branches = {};
    const years = {};

    teams.forEach((t) => {
      const st = getNormalizedStream(t);
      streams[st] = (streams[st] || 0) + 1;

      const b = getShortBranch(t.leaderBranch || t.leader_branch);
      branches[b] = (branches[b] || 0) + 1;

      const y = getNormalizedYear(t);
      years[y] = (years[y] || 0) + 1;
    });

    return { streams, branches, years };
  }, [teams]);

  const filteredTeams = useMemo(() => {
    const result = teams.filter((t) => {
      const batchInfo = getTeamBatchInfo(t);
      const hasDesk = Boolean(t.deskNumber || t.desk_number);
      const stream = getNormalizedStream(t);
      const branch = getShortBranch(t.leaderBranch || t.leader_branch);
      const year = getNormalizedYear(t);

      if (batchFilter === "JUNIORS" && batchInfo.batch !== "JUNIOR") return false;
      if (batchFilter === "SENIORS" && batchInfo.batch !== "SENIOR") return false;
      if (batchFilter === "UNASSIGNED" && hasDesk) return false;
      if (batchFilter === "ASSIGNED" && !hasDesk) return false;

      if (streamFilter !== "ALL" && stream !== streamFilter) return false;
      if (branchFilter !== "ALL" && branch !== branchFilter) return false;
      if (yearFilter !== "ALL" && year !== yearFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const desk = (t.deskNumber || t.desk_number || "").toLowerCase();
        const probId = (t.selectedProblemId || t.selected_problem_id || "").toLowerCase();
        return (
          (t.registrationId || t.registration_id || "").toLowerCase().includes(q) ||
          (t.teamName || t.team_name || "").toLowerCase().includes(q) ||
          (t.leaderName || t.leader_name || "").toLowerCase().includes(q) ||
          probId.includes(q) ||
          desk.includes(q)
        );
      }
      return true;
    });

    // Multi-dimensional Sorting
    result.sort((a, b) => {
      if (sortBy === "YEAR_BRANCH") {
        const yA = getNormalizedYear(a);
        const yB = getNormalizedYear(b);
        if (yA !== yB) return yA.localeCompare(yB);
        const bA = getShortBranch(a.leaderBranch || a.leader_branch);
        const bB = getShortBranch(b.leaderBranch || b.leader_branch);
        if (bA !== bB) return bA.localeCompare(bB);
        return (a.registrationId || "").localeCompare(b.registrationId || "");
      }
      if (sortBy === "STREAM_YEAR") {
        const sA = getNormalizedStream(a);
        const sB = getNormalizedStream(b);
        if (sA !== sB) return sA.localeCompare(sB);
        const yA = getNormalizedYear(a);
        const yB = getNormalizedYear(b);
        if (yA !== yB) return yA.localeCompare(yB);
        return (a.registrationId || "").localeCompare(b.registrationId || "");
      }
      if (sortBy === "BRANCH") {
        const bA = getShortBranch(a.leaderBranch || a.leader_branch);
        const bB = getShortBranch(b.leaderBranch || b.leader_branch);
        if (bA !== bB) return bA.localeCompare(bB);
        return (a.registrationId || "").localeCompare(b.registrationId || "");
      }
      if (sortBy === "DESK") {
        const dA = a.deskNumber || a.desk_number || "ZZZ";
        const dB = b.deskNumber || b.desk_number || "ZZZ";
        return dA.localeCompare(dB, undefined, { numeric: true, sensitivity: "base" });
      }
      // Default: REG_ID
      return (a.registrationId || "").localeCompare(b.registrationId || "");
    });

    return result;
  }, [teams, batchFilter, streamFilter, branchFilter, yearFilter, sortBy, search]);

  const juniorCount = useMemo(() => teams.filter((t) => getTeamBatchInfo(t).batch === "JUNIOR").length, [teams]);
  const seniorCount = useMemo(() => teams.filter((t) => getTeamBatchInfo(t).batch === "SENIOR").length, [teams]);
  const assignedCount = useMemo(() => teams.filter((t) => Boolean(t.deskNumber || t.desk_number)).length, [teams]);

  async function handleSaveSingleDesk(teamId) {
    setSavingDesk(true);
    try {
      await adminUpdateTeamSeating(teamId, { desk_number: deskInput.trim() });
      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, deskNumber: deskInput.trim(), desk_number: deskInput.trim() } : t))
      );
      setEditingDeskId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update table number");
    } finally {
      setSavingDesk(false);
    }
  }

  async function handleAutoAssign() {
    setAutoBusy(true);
    try {
      let targetList = [];
      if (autoTarget === "JUNIORS") {
        targetList = teams.filter((t) => getTeamBatchInfo(t).batch === "JUNIOR");
      } else if (autoTarget === "SENIORS") {
        targetList = teams.filter((t) => getTeamBatchInfo(t).batch === "SENIOR");
      } else if (autoTarget === "FILTERED") {
        targetList = filteredTeams;
      } else {
        targetList = teams;
      }

      const assignments = targetList.map((t, idx) => ({
        team_id: t.id,
        desk_number: `${autoPrefix}${String(autoStartNum + idx).padStart(2, "0")}`
      }));

      await adminBatchUpdateSeating({ assignments });
      await load();
      setShowAutoModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to auto-assign tables");
    } finally {
      setAutoBusy(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6 text-left">
      {/* SCREEN VIEW CONTROLS & HEADER (Hidden in Print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-web flex items-center gap-2">
              <TableIcon className="text-spidey shrink-0" size={32} /> Table Assignment & Desk Placards
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
              Filter by Stream (Degree/Diploma), Department/Branch & Year, assign tables, and generate clean 4-per-page A4 table placards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAutoModal(true)}
              className="rounded-xl border-2 border-spidey bg-spidey px-3.5 py-2 text-xs font-black uppercase text-white hover:bg-web transition shadow-comic flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} className="text-gold" /> Auto-Assign Tables
            </button>

            <button
              onClick={handlePrint}
              className="rounded-xl border-2 border-web bg-web px-4 py-2 text-xs font-black uppercase text-white hover:bg-spidey transition shadow-comic flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={15} /> 🖨️ Print 4-Placards / Page
            </button>

            <button
              onClick={() => load()}
              className="rounded-xl border-2 border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Multi-Dimensional Analytics Breakdown Bar (Stream, Branch & Year) */}
        <div className="rounded-3xl border-3 border-web bg-white p-4 shadow-comic space-y-3">
          {/* Stream (Degree) Row */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
            <span className="font-black uppercase text-[10.5px] text-slate-400 mr-1 flex items-center gap-1">
              <GraduationCap size={13} className="text-spidey" /> Stream / Degree:
            </span>
            <button
              onClick={() => setStreamFilter("ALL")}
              className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                streamFilter === "ALL"
                  ? "bg-web text-white border-web shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              All Streams ({teams.length})
            </button>
            {Object.entries(analytics.streams).map(([st, count]) => (
              <button
                key={st}
                onClick={() => setStreamFilter(streamFilter === st ? "ALL" : st)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                  streamFilter === st
                    ? "bg-spidey text-white border-spidey shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-gold/30 hover:border-web"
                }`}
              >
                {st}: <span className="font-mono font-bold">{count}</span>
              </button>
            ))}
          </div>

          {/* Branch Breakdown Row */}
          <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
            <span className="font-black uppercase text-[10.5px] text-slate-400 mr-1 flex items-center gap-1">
              <Building size={13} className="text-amber-600" /> Branch / Dept:
            </span>
            <button
              onClick={() => setBranchFilter("ALL")}
              className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                branchFilter === "ALL"
                  ? "bg-web text-white border-web shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              All Branches
            </button>
            {Object.entries(analytics.branches).map(([br, count]) => (
              <button
                key={br}
                onClick={() => setBranchFilter(branchFilter === br ? "ALL" : br)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                  branchFilter === br
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-gold/30"
                }`}
              >
                {br}: <span className="font-mono font-bold">{count}</span>
              </button>
            ))}
          </div>

          {/* Year Breakdown Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-black uppercase text-[10.5px] text-slate-400 mr-1 flex items-center gap-1">
              <Layers size={13} className="text-indigo-600" /> Study Year:
            </span>
            <button
              onClick={() => setYearFilter("ALL")}
              className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                yearFilter === "ALL"
                  ? "bg-web text-white border-web shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              All Years
            </button>
            {Object.entries(analytics.years).map(([yr, count]) => (
              <button
                key={yr}
                onClick={() => setYearFilter(yearFilter === yr ? "ALL" : yr)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                  yearFilter === yr
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-gold/30"
                }`}
              >
                {yr}: <span className="font-mono font-bold">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sorting & Secondary Controls Bar */}
        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black uppercase text-[11px] text-slate-500 flex items-center gap-1">
              <ArrowUpDown size={13} className="text-spidey" /> Sort Squads By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border-2 border-web/30 bg-white px-3 py-1 text-xs font-bold text-ink focus:border-web"
            >
              <option value="YEAR_BRANCH">Study Year $\rightarrow$ Branch (1st Yr $\rightarrow$ 2nd Yr $\rightarrow$ 3rd Yr $\rightarrow$ 4th Yr)</option>
              <option value="STREAM_YEAR">Degree Stream $\rightarrow$ Year (B.Tech $\rightarrow$ Diploma $\rightarrow$ B.Voc)</option>
              <option value="BRANCH">Department / Branch (CSE $\rightarrow$ IT $\rightarrow$ E&TC $\rightarrow$ EE...)</option>
              <option value="REG_ID">Team Registration ID (ENGG-SIH-01...)</option>
              <option value="DESK">Assigned Table Number</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={() => setViewMode("PLACARDS")}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition flex items-center gap-1 cursor-pointer ${
                  viewMode === "PLACARDS" ? "bg-web text-white shadow-xs" : "text-slate-600"
                }`}
                title="4 Placards per A4 Page"
              >
                <LayoutGrid size={13} /> 4 / Sheet
              </button>
              <button
                onClick={() => setViewMode("TABLE_LIST")}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition flex items-center gap-1 cursor-pointer ${
                  viewMode === "TABLE_LIST" ? "bg-web text-white shadow-xs" : "text-slate-600"
                }`}
                title="Table Master List"
              >
                <List size={13} /> Master List
              </button>
            </div>

            <div className="relative w-48 sm:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Team, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs font-bold text-ink focus:border-web focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY CSS RULES: REMOVES BROWSER DATE/TIME HEADERS & APPLIES CLEAN A4 2x2 GRID */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .placards-print-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            grid-auto-rows: minmax(0, 1fr) !important;
            gap: 12px !important;
          }
          .placard-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            min-height: 128mm !important;
            max-height: 136mm !important;
          }
        }
      `}</style>

      {/* VIEW MODE 1: PRINTABLE TABLE PLACARDS (4 LARGE CARDS PER A4 PAGE, CUT-OUT READY) */}
      {viewMode === "PLACARDS" && (
        <div>
          <div className="print:hidden flex items-center justify-between mb-3 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <Scissors size={14} className="text-spidey" />
              Showing <strong>{filteredTeams.length}</strong> printable table placards (Exactly 4 cards per A4 page).
            </span>
            <span className="text-[11px] text-slate-400">Click &quot;Print 4-Placards / Page&quot; to print cards with clean cut-out lines.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3.5 placards-print-grid">
            {filteredTeams.map((team, idx) => {
              const deskNo = team.deskNumber || team.desk_number;
              const isEditing = editingDeskId === team.id;
              const shortBranch = getShortBranch(team.leaderBranch || team.leader_branch);
              const stream = getNormalizedStream(team);
              const studyYear = getNormalizedYear(team);
              
              const isOpenInno = Boolean(team.is_open_innovation || team.isOpenInnovation);
              const rawProbId = team.selectedProblemId || team.selected_problem_id || "";
              const hasSelectedProblem = Boolean(
                rawProbId && 
                rawProbId.trim() && 
                rawProbId.trim().toUpperCase() !== "PS" && 
                rawProbId.trim().toUpperCase() !== "PS-ALLOCATED"
              );

              return (
                <div
                  key={team.id || idx}
                  className="placard-card relative flex flex-col justify-between rounded-3xl border-3 border-black bg-white p-5 sm:p-6 shadow-comic print:shadow-none print:rounded-2xl print:border-3 print:border-black print:p-4 text-center"
                >
                  {/* Top Header: Centered Large SIH & College Logo */}
                  <div>
                    <div className="flex flex-col items-center justify-center pb-2.5 border-b-2 border-black text-center">
                      <img
                        src="/sih-logo.png"
                        alt="SIH Logo"
                        className="h-16 sm:h-20 w-auto object-contain print:h-16 drop-shadow-sm mb-1.5"
                      />
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 print:text-black leading-tight">
                        GTMC NANDED · SMART INDIA HACKATHON 2026
                      </h4>
                      <h5 className="text-[11px] sm:text-xs font-black uppercase tracking-tight text-spidey print:text-black mt-0.5">
                        INTERNAL HACKATHON
                      </h5>
                    </div>

                    {/* Table Number Box */}
                    <div className="mt-3">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1.5 my-1">
                          <input
                            type="text"
                            value={deskInput}
                            onChange={(e) => setDeskInput(e.target.value)}
                            placeholder="e.g. T-01"
                            className="w-28 rounded border-2 border-black px-2 py-1 text-sm font-black text-black font-mono uppercase text-center"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveSingleDesk(team.id)}
                            disabled={savingDesk}
                            className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-700"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingDeskId(null)}
                            className="bg-slate-200 text-black p-1 rounded hover:bg-slate-300"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingDeskId(team.id);
                            setDeskInput(team.deskNumber || team.desk_number || "");
                          }}
                          className="rounded-2xl border-3 border-black bg-white p-3 text-center cursor-pointer hover:bg-gold/20 transition print:bg-white print:border-3 print:border-black"
                          title="Click to assign table number"
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block print:text-black mb-1">
                            ALLOCATED DESK / TABLE
                          </span>
                          <div className="font-mono font-black text-2xl sm:text-3xl text-black tracking-wide">
                            {deskNo ? (
                              <span>TABLE #{deskNo}</span>
                            ) : (
                              <span className="text-black font-black font-mono inline-block">
                                TABLE NO : ________
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team ID & Team Name (Huge, Prominent & Centered) */}
                    <div className="mt-3 space-y-1">
                      <div className="inline-block rounded-xl border-2 border-black bg-black text-white px-3 py-1 font-mono text-sm sm:text-base font-black tracking-wider print:border-black print:bg-black print:text-white">
                        {team.registrationId || team.registration_id}
                      </div>

                      <h2 className="font-display text-2xl sm:text-3xl text-web font-black uppercase tracking-tight print:text-black leading-tight pt-1">
                        {team.teamName || team.team_name}
                      </h2>

                      <p className="text-xs font-black text-slate-700 print:text-black">
                        {stream} · {shortBranch} · {studyYear}
                      </p>
                    </div>
                  </div>

                  {/* Bottom: PROBLEM STATEMENT ID / OPEN INNOVATION / MANUAL WRITE-IN BOX */}
                  <div className="mt-3 pt-2.5 border-t-2 border-dashed border-black">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block print:text-black">
                      ALLOCATED PROBLEM STATEMENT ID
                    </span>

                    {isOpenInno ? (
                      <div className="mt-1 rounded-xl border-2 border-black bg-gold/20 p-2 print:border-black print:bg-transparent text-center">
                        <span className="font-mono text-lg sm:text-xl font-black text-web print:text-black tracking-wider block">
                          🚀 OPEN INNOVATION
                        </span>
                      </div>
                    ) : hasSelectedProblem ? (
                      <div className="mt-1 rounded-xl border-2 border-black bg-gold/20 p-2 print:border-black print:bg-transparent text-center">
                        <span className="font-mono text-lg sm:text-xl font-black text-web print:text-black tracking-wider block">
                          {rawProbId}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 rounded-xl border-2 border-dashed border-black bg-slate-50 p-2 print:border-black print:bg-transparent text-center">
                        <span className="font-mono text-base sm:text-lg font-black text-slate-700 print:text-black tracking-wider block">
                          PS ID: _________________
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MASTER SEATING CHART LIST */}
      {viewMode === "TABLE_LIST" && (
        <div className="overflow-hidden rounded-3xl border-3 border-web bg-white shadow-comic print:border-none print:shadow-none">
          <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-3">
            <h1 className="text-lg font-black uppercase text-black">GTMC NANDED — SMART INDIA HACKATHON (SIH 2026)</h1>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Master Seating & Table Allocation Chart</h2>
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600 mt-1">
              <span>Date: Event Day</span>
              <span>Total Teams: {filteredTeams.length}</span>
              <span>Stream / Branch / Year Sorted</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-web text-white font-black uppercase text-[10px] tracking-wider print:bg-slate-200 print:text-black print:border-b-2 print:border-black">
                <tr>
                  <th className="p-3 text-center w-12 print:border print:border-black">#</th>
                  <th className="p-3 w-28 print:border print:border-black">Table #</th>
                  <th className="p-3 w-32 print:border print:border-black">Team ID</th>
                  <th className="p-3 min-w-[180px] print:border print:border-black">Team Name</th>
                  <th className="p-3 w-44 print:border print:border-black">Stream, Branch & Year</th>
                  <th className="p-3 min-w-[200px] print:border print:border-black">Problem ID</th>
                  <th className="p-3 w-36 print:border print:border-black">Leader & Contact</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-semibold print:divide-black">
                {filteredTeams.map((team, idx) => {
                  const isEditing = editingDeskId === team.id;
                  const deskNo = team.deskNumber || team.desk_number || "—";
                  const shortBranch = getShortBranch(team.leaderBranch || team.leader_branch);
                  const stream = getNormalizedStream(team);
                  const studyYear = getNormalizedYear(team);

                  return (
                    <tr key={team.id || idx} className="hover:bg-slate-50 transition print:border-b print:border-black">
                      <td className="p-3 text-center font-mono font-bold text-slate-500 print:text-black print:border print:border-black">
                        {idx + 1}
                      </td>

                      {/* Table Number */}
                      <td className="p-3 print:border print:border-black">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={deskInput}
                              onChange={(e) => setDeskInput(e.target.value)}
                              className="w-16 rounded border border-web px-1 py-0.5 text-xs font-mono font-bold uppercase"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveSingleDesk(team.id)}
                              disabled={savingDesk}
                              className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-700"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setEditingDeskId(null)}
                              className="bg-slate-200 text-black p-1 rounded hover:bg-slate-300"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => {
                              setEditingDeskId(team.id);
                              setDeskInput(team.deskNumber || team.desk_number || "");
                            }}
                            className="font-mono font-black text-xs text-white bg-black px-2 py-0.5 rounded cursor-pointer hover:bg-spidey transition inline-block print:text-black print:bg-transparent print:border print:border-black"
                            title="Click to edit table number"
                          >
                            {deskNo}
                          </span>
                        )}
                      </td>

                      {/* Team ID */}
                      <td className="p-3 print:border print:border-black font-mono font-bold text-spidey print:text-black">
                        {team.registrationId || team.registration_id}
                      </td>

                      {/* Team Name */}
                      <td className="p-3 print:border print:border-black font-display text-sm text-web print:text-black">
                        {team.teamName || team.team_name}
                      </td>

                      {/* Stream, Branch & Year */}
                      <td className="p-3 print:border print:border-black text-[11px]">
                        <span className="font-bold text-spidey">{stream}</span> · <span className="font-bold text-black">{shortBranch}</span> · <span className="text-slate-600 font-semibold">{studyYear}</span>
                      </td>

                      {/* Problem Statement ID */}
                      <td className="p-3 print:border print:border-black text-xs font-mono font-black text-web print:text-black">
                        {team.isOpenInnovation || team.is_open_innovation ? "🚀 OPEN INNOVATION" : (team.selectedProblemId || team.selected_problem_id || "PS-ALLOCATED")}
                      </td>

                      {/* Leader */}
                      <td className="p-3 print:border print:border-black text-[11px] text-slate-600 print:text-black">
                        <div className="font-bold text-black">{team.leaderName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{team.phone || "—"}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUTO-ASSIGN TABLES MODAL */}
      {showAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border-3 border-web bg-white p-6 shadow-2xl space-y-4 text-left animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-display text-2xl text-web flex items-center gap-1.5">
                <Sparkles size={20} className="text-spidey" /> Bulk Auto-Assign Tables
              </h3>
              <button onClick={() => setShowAutoModal(false)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-semibold">
              Automatically assign sequential table numbers (e.g. <span className="font-mono font-bold">FL1-T01</span> or <span className="font-mono font-bold">T-01</span>) to teams based on their floor or batch level.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Target Squads to Assign
                </label>
                <select
                  value={autoTarget}
                  onChange={(e) => setAutoTarget(e.target.value)}
                  className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2 text-xs font-bold text-ink"
                >
                  <option value="JUNIORS">Junior Batch (1st & 2nd Year) — {juniorCount} Teams</option>
                  <option value="SENIORS">Senior Batch (3rd & Final Year) — {seniorCount} Teams</option>
                  <option value="FILTERED">Currently Filtered Teams — {filteredTeams.length} Teams</option>
                  <option value="ALL">All Teams ({teams.length} Teams)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Table Prefix
                  </label>
                  <input
                    type="text"
                    value={autoPrefix}
                    onChange={(e) => setAutoPrefix(e.target.value)}
                    placeholder="e.g. FL1-T or T-"
                    className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2 text-xs font-bold text-ink font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Start Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={autoStartNum}
                    onChange={(e) => setAutoStartNum(Number(e.target.value) || 1)}
                    className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2 text-xs font-bold text-ink font-mono"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <span className="font-bold text-slate-500 block mb-0.5">Sample Preview:</span>
                <span className="font-mono font-black text-spidey">
                  {autoPrefix}{String(autoStartNum).padStart(2, "0")}, {autoPrefix}{String(autoStartNum + 1).padStart(2, "0")}, {autoPrefix}{String(autoStartNum + 2).padStart(2, "0")} ...
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAutoModal(false)}
                className="rounded-xl border-2 border-slate-300 px-4 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <Button
                type="button"
                disabled={autoBusy}
                onClick={handleAutoAssign}
                className="bg-web hover:bg-spidey text-white px-5 py-2 text-xs font-black uppercase shadow-comic cursor-pointer"
              >
                {autoBusy ? "Assigning..." : "Assign Tables Now ✓"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
