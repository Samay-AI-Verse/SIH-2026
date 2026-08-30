import { useEffect, useState, useMemo } from "react";
import { 
  Printer, 
  Search, 
  Sparkles, 
  Crown, 
  Building, 
  GraduationCap, 
  Hash, 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  List,
  Save,
  Check,
  X,
  FileSpreadsheet,
  Scissors
} from "lucide-react";
import { adminFetchTeams, adminUpdateTeamSeating, adminBatchUpdateSeating, subscribeTable } from "../services/apiService";
import { Button } from "../components/ui/Button";

export function AdminSeatingAndPlacards() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("ALL"); // ALL, JUNIORS, SENIORS, UNASSIGNED, ASSIGNED
  const [viewMode, setViewMode] = useState("PLACARDS_4"); // PLACARDS_4 (4/page), PLACARDS_3 (3/page), TABLE_LIST
  
  // Auto-Assign Modal State
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoPrefix, setAutoPrefix] = useState("T-");
  const [autoStartNum, setAutoStartNum] = useState(1);
  const [autoTarget, setAutoTarget] = useState("FILTERED"); // "ALL", "FILTERED", "JUNIORS", "SENIORS"
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
    const yrStr = String(team.leaderYear || team.leader_year || "").toLowerCase();
    const courseStr = String(team.leaderCourse || team.leader_course || "").toLowerCase();
    
    // Check if Junior: 1st Year, 2nd Year, FY, SY, Diploma 1st/2nd
    if (yrStr.includes("1st") || yrStr.includes("2nd") || yrStr.includes("fy") || yrStr.includes("sy") || yrStr.includes("first") || yrStr.includes("second")) {
      return {
        batch: "JUNIOR",
        label: "Junior Batch (1st/2nd Year)",
        floor: "Floor 1 / Lab 101-104",
        color: "text-amber-700 bg-amber-50 border-amber-300"
      };
    }
    // Else Senior: 3rd Year, 4th Year, Final Year, TY, BE, MCA
    return {
      batch: "SENIOR",
      label: "Senior Batch (3rd/Final Year)",
      floor: "Floor 2 / Lab 201-204",
      color: "text-indigo-700 bg-indigo-50 border-indigo-300"
    };
  }

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const batchInfo = getTeamBatchInfo(t);
      const hasDesk = Boolean(t.deskNumber || t.desk_number);

      if (batchFilter === "JUNIORS" && batchInfo.batch !== "JUNIOR") return false;
      if (batchFilter === "SENIORS" && batchInfo.batch !== "SENIOR") return false;
      if (batchFilter === "UNASSIGNED" && hasDesk) return false;
      if (batchFilter === "ASSIGNED" && !hasDesk) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const desk = (t.deskNumber || t.desk_number || "").toLowerCase();
        const membersStr = (t.members || []).map((m) => m.name || m.full_name || "").join(" ").toLowerCase();
        return (
          (t.registrationId || t.registration_id || "").toLowerCase().includes(q) ||
          (t.teamName || t.team_name || "").toLowerCase().includes(q) ||
          (t.leaderName || t.leader_name || "").toLowerCase().includes(q) ||
          desk.includes(q) ||
          membersStr.includes(q)
        );
      }
      return true;
    });
  }, [teams, batchFilter, search]);

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
              Assign tables by Floor/Lab (1st/2nd Yr vs 3rd/Final Yr) and generate printable A4 table desk cards (3-4 per sheet) with team names and IDs.
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
              <Printer size={15} /> 🖨️ Print / Save PDF Cards
            </button>

            <button
              onClick={() => load()}
              className="rounded-xl border-2 border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Pills & View Mode Bar */}
        <div className="rounded-3xl border-3 border-web bg-white p-4 shadow-comic space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Batch Level Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-black uppercase text-slate-400 mr-1">Floor / Batch:</span>

              <button
                onClick={() => setBatchFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                  batchFilter === "ALL" ? "bg-web text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Teams ({teams.length})
              </button>

              <button
                onClick={() => setBatchFilter("JUNIORS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer flex items-center gap-1 ${
                  batchFilter === "JUNIORS" ? "bg-amber-600 text-white shadow-xs" : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                }`}
              >
                🏢 Floor 1: 1st & 2nd Yr ({juniorCount})
              </button>

              <button
                onClick={() => setBatchFilter("SENIORS")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer flex items-center gap-1 ${
                  batchFilter === "SENIORS" ? "bg-indigo-600 text-white shadow-xs" : "bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100"
                }`}
              >
                🏢 Floor 2: 3rd & Final Yr ({seniorCount})
              </button>

              <button
                onClick={() => setBatchFilter("UNASSIGNED")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                  batchFilter === "UNASSIGNED" ? "bg-rose-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Unassigned ({teams.length - assignedCount})
              </button>
            </div>

            {/* View Mode & Search */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewMode("PLACARDS_4")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition flex items-center gap-1 cursor-pointer ${
                    viewMode === "PLACARDS_4" ? "bg-white text-web shadow-xs border border-slate-300" : "text-slate-600"
                  }`}
                  title="4 Placards per A4 Page"
                >
                  <LayoutGrid size={13} /> 4 / Sheet
                </button>
                <button
                  onClick={() => setViewMode("PLACARDS_3")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition flex items-center gap-1 cursor-pointer ${
                    viewMode === "PLACARDS_3" ? "bg-white text-web shadow-xs border border-slate-300" : "text-slate-600"
                  }`}
                  title="3 Placards per A4 Page (Larger)"
                >
                  <LayoutGrid size={13} /> 3 / Sheet
                </button>
                <button
                  onClick={() => setViewMode("TABLE_LIST")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition flex items-center gap-1 cursor-pointer ${
                    viewMode === "TABLE_LIST" ? "bg-white text-web shadow-xs border border-slate-300" : "text-slate-600"
                  }`}
                  title="Table Master List"
                >
                  <List size={13} /> Master List
                </button>
              </div>

              <div className="relative w-48 sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Team, ID, Table..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1 & 2: PRINTABLE TABLE PLACARDS (2x2 Grid or 3 Stacked per A4 Sheet) */}
      {(viewMode === "PLACARDS_4" || viewMode === "PLACARDS_3") && (
        <div>
          <div className="print:hidden flex items-center justify-between mb-3 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1.5">
              <Scissors size={14} className="text-spidey" />
              Showing <strong>{filteredTeams.length}</strong> printable desk cards ({viewMode === "PLACARDS_4" ? "4 cards per A4 page" : "3 cards per A4 page"}).
            </span>
            <span className="text-[11px] text-slate-400">Click &quot;Print / Save PDF&quot; to print all desk cards with clean cut lines.</span>
          </div>

          <div className={`grid gap-4 ${viewMode === "PLACARDS_4" ? "grid-cols-1 md:grid-cols-2 print:grid-cols-2 print:gap-3" : "grid-cols-1 print:grid-cols-1 print:gap-4"}`}>
            {filteredTeams.map((team, idx) => {
              const batchInfo = getTeamBatchInfo(team);
              const members = team.members || [];
              const deskNo = team.deskNumber || team.desk_number || "NOT ASSIGNED";
              const isEditing = editingDeskId === team.id;

              return (
                <div
                  key={team.id || idx}
                  className={`relative flex flex-col justify-between rounded-3xl border-3 border-black bg-white p-4 sm:p-5 shadow-comic print:shadow-none print:rounded-2xl print:border-2 print:border-black print:p-3.5 print:break-inside-avoid ${
                    viewMode === "PLACARDS_3" ? "min-h-[260px] print:min-h-[290px]" : "min-h-[250px] print:min-h-[235px]"
                  }`}
                >
                  {/* Top Placard Header: SIH Logo + Table Number Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b-2 border-black pb-2.5">
                      <div className="flex items-center gap-2">
                        <img src="/sih-logo.png" alt="SIH" className="h-8 w-auto object-contain print:h-7" />
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block leading-tight print:text-black">
                            GTMC NANDED · SIH 2026
                          </span>
                          <span className="text-[10px] font-black uppercase text-spidey print:text-black">
                            INTERNAL HACKATHON
                          </span>
                        </div>
                      </div>

                      {/* HUGE TABLE NUMBER BADGE */}
                      <div className="text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={deskInput}
                              onChange={(e) => setDeskInput(e.target.value)}
                              placeholder="e.g. T-01"
                              className="w-20 rounded border-2 border-black px-1.5 py-0.5 text-xs font-black text-black font-mono uppercase"
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
                          <div
                            onClick={() => {
                              setEditingDeskId(team.id);
                              setDeskInput(team.deskNumber || team.desk_number || "");
                            }}
                            className="inline-flex items-center gap-1 bg-black text-white px-3 py-1 rounded-xl border border-black font-mono font-black text-sm sm:text-base cursor-pointer hover:bg-spidey transition print:bg-black print:text-white print:px-2.5 print:py-0.5"
                            title="Click to change table number"
                          >
                            <span>TABLE {deskNo}</span>
                          </div>
                        )}
                        <span className="text-[8.5px] font-bold text-slate-600 block mt-0.5 print:text-black">
                          {batchInfo.floor}
                        </span>
                      </div>
                    </div>

                    {/* Team ID & Team Name (Ultra Large & Bold) */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black text-spidey bg-spidey/10 px-2 py-0.5 rounded border border-spidey/30 print:text-black print:border-black print:bg-transparent">
                          {team.registrationId || team.registration_id}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${batchInfo.color} print:text-black print:border-black print:bg-transparent`}>
                          {batchInfo.label}
                        </span>
                      </div>

                      <h2 className="font-display text-xl sm:text-2xl text-web mt-1 leading-tight uppercase tracking-tight print:text-black print:text-lg print:font-black">
                        {team.teamName || team.team_name}
                      </h2>
                      <p className="text-[10px] font-bold text-slate-600 print:text-black truncate">
                        {team.college || "GTMC Nanded"} · Stream: <span className="font-black text-black">{team.leaderCourse || team.leader_course || "B.Tech"} ({team.leaderBranch || team.leader_branch || "CSE"})</span>
                      </p>
                    </div>

                    {/* Problem Statement Box */}
                    <div className="mt-2 rounded-xl border border-slate-300 bg-slate-50 p-2 text-xs print:border-black print:bg-transparent print:p-1.5">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-500 block print:text-black">
                        Problem Statement
                      </span>
                      {team.isOpenInnovation ? (
                        <p className="font-black text-[11px] text-spidey mt-0.5 print:text-black line-clamp-1">
                          🚀 Open Innovation: {team.openInnovationTitle || "Custom Project"}
                        </p>
                      ) : (
                        <p className="font-bold text-[11px] text-slate-900 mt-0.5 print:text-black line-clamp-1">
                          <span className="font-mono font-black text-web print:text-black mr-1">{team.selectedProblemId || team.selected_problem_id || "PS"}</span>
                          {team.selectedProblemTitle || team.selected_problem_title || "Official Problem Statement"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom: 6 Squad Members List */}
                  <div className="mt-2.5 pt-2 border-t border-dashed border-slate-300 print:border-black">
                    <span className="text-[8.5px] font-black uppercase text-slate-400 block tracking-wider print:text-black mb-1">
                      Squad Roster (6 Members):
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] print:text-[8.5px] font-bold text-slate-800 print:text-black">
                      {members.map((m, mIdx) => {
                        const isLdr = m.isLeader || m.is_leader || mIdx === 0;
                        const mName = m.name || m.full_name || `Member #${mIdx + 1}`;
                        return (
                          <div key={m.id || mIdx} className="truncate flex items-center gap-1">
                            <span className="font-mono text-slate-400 print:text-black w-3 shrink-0">{mIdx + 1}.</span>
                            {isLdr && <Crown size={10} className="text-gold shrink-0 print:hidden" />}
                            <span className={isLdr ? "font-black text-black" : "font-semibold"}>{mName}</span>
                            {isLdr && <span className="text-[7.5px] bg-gold text-web px-0.5 rounded font-black print:text-black print:border print:border-black">LDR</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: COMPACT TABLE LIST (Master Seating Chart) */}
      {viewMode === "TABLE_LIST" && (
        <div className="overflow-hidden rounded-3xl border-3 border-web bg-white shadow-comic print:border-none print:shadow-none">
          {/* Print Header for Master Seating Chart */}
          <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-3">
            <h1 className="text-lg font-black uppercase text-black">GTMC NANDED — SMART INDIA HACKATHON (SIH 2026)</h1>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Master Seating & Table Allocation Chart</h2>
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-600 mt-1">
              <span>Date: Event Day</span>
              <span>Total Teams: {filteredTeams.length}</span>
              <span>Floor 1: 1st/2nd Yr · Floor 2: 3rd/Final Yr</span>
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
                  <th className="p-3 w-40 print:border print:border-black">Floor / Batch Level</th>
                  <th className="p-3 min-w-[200px] print:border print:border-black">Problem Statement</th>
                  <th className="p-3 w-36 print:border print:border-black">Leader & Contact</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 font-semibold print:divide-black">
                {filteredTeams.map((team, idx) => {
                  const batchInfo = getTeamBatchInfo(team);
                  const isEditing = editingDeskId === team.id;
                  const deskNo = team.deskNumber || team.desk_number || "—";

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

                      {/* Floor & Batch */}
                      <td className="p-3 print:border print:border-black text-[11px]">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${batchInfo.color} print:text-black print:border print:border-black`}>
                          {batchInfo.batch === "JUNIOR" ? "1st Floor (1st/2nd Yr)" : "2nd Floor (3rd/Final Yr)"}
                        </span>
                      </td>

                      {/* Problem Statement */}
                      <td className="p-3 print:border print:border-black text-[11px] text-slate-700 print:text-black">
                        {team.isOpenInnovation ? (
                          <span className="font-bold text-spidey print:text-black">🚀 Open Innovation</span>
                        ) : (
                          <span className="font-bold">{team.selectedProblemId || "PS"} - {team.selectedProblemTitle || "Selected"}</span>
                        )}
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
              <button onClick={() => setShowAutoModal(false)} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
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
                className="rounded-xl border-2 border-slate-300 px-4 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <Button
                type="button"
                disabled={autoBusy}
                onClick={handleAutoAssign}
                className="bg-web hover:bg-spidey text-white px-5 py-2 text-xs font-black uppercase shadow-comic"
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
