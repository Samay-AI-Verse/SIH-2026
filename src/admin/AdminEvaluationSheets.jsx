import { useEffect, useState, useMemo } from "react";
import { 
  Printer, 
  Download, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  Crown, 
  User, 
  Layers, 
  RefreshCw, 
  Award, 
  SlidersHorizontal,
  FileText,
  Sparkles,
  ClipboardList,
  Trophy,
  PackageCheck,
  ChevronDown,
  Calendar,
  Building,
  CheckSquare,
  Hash
} from "lucide-react";
import { adminFetchTeams, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function formatTeamCode(team, index, idFormat = "SIH_FORMAT") {
  if (idFormat === "REG_ID") {
    if (team.registrationId && team.registrationId.length <= 16 && !team.registrationId.includes("-4")) {
      return team.registrationId;
    }
    if (team.id && team.id.length > 8) {
      return `REG-${team.id.slice(0, 6).toUpperCase()}`;
    }
  }
  
  if (idFormat === "DESK" && (team.deskNumber || team.desk_number)) {
    return `Desk-${team.deskNumber || team.desk_number}`;
  }

  // If team has an explicit clean SIH format registration ID (not a 36-char raw UUID)
  if (team.registrationId && (team.registrationId.startsWith("SIH") || team.registrationId.startsWith("TM-")) && team.registrationId.length <= 14) {
    return team.registrationId;
  }

  // Standard Official Clean SIH Code: SIH-TM-101, SIH-TM-102 ...
  return `SIH-TM-${101 + index}`;
}

export function getProblemStatementText(team) {
  if (team.selectedProblemTitle && team.selectedProblemTitle.trim()) {
    const code = team.selectedProblemCode ? `[${team.selectedProblemCode}] ` : "";
    return `${code}${team.selectedProblemTitle}`;
  }
  if (team.openInnovationTitle && team.openInnovationTitle.trim()) {
    return `[Open Innovation] ${team.openInnovationTitle}`;
  }
  if (team.problemTitle && team.problemTitle.trim() && team.problemTitle !== "Smart India Hackathon Innovation Challenge") {
    return team.problemTitle;
  }
  if (team.problemStatement && team.problemStatement.trim()) {
    return team.problemStatement;
  }
  if (team.problemCategory || team.category) {
    return `${team.problemCategory || team.category} Track Innovation`;
  }
  return "Smart India Hackathon 2026 Solution";
}

export function AdminEvaluationSheets() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("CONFIRMED"); // "CONFIRMED", "ALL"
  const [activeSheet, setActiveSheet] = useState("mentor"); // "mentor", "judge", "swag"
  const [idFormat, setIdFormat] = useState("SIH_FORMAT"); // "SIH_FORMAT", "REG_ID", "DESK"
  const [labRoom, setLabRoom] = useState("Lab-01");
  const [liveScores, setLiveScores] = useState({}); // { [teamId]: { c1, c2, c3, c4, c5 } }
  const [includeBlankRows, setIncludeBlankRows] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await adminFetchTeams();
      setTeams(data || []);
    } catch (err) {
      console.error("Failed to load evaluation teams:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return subscribeTable("teams", () => load().catch(() => undefined));
  }, []);

  // Tracks / Themes extraction
  const tracks = useMemo(() => {
    const set = new Set();
    teams.forEach(t => {
      const cat = t.problemCategory || t.category || t.psCategory || "General Software / AI";
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [teams]);

  // Filtered Teams
  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      // Status filter
      if (statusFilter === "CONFIRMED") {
        const isConfirmed = t.paymentStatus === "SUCCESS" || t.status === "CONFIRMED" || t.status === "APPROVED";
        if (!isConfirmed && teams.some(item => item.paymentStatus === "SUCCESS")) {
          return false;
        }
      }

      // Track filter
      if (trackFilter !== "ALL") {
        const cat = t.problemCategory || t.category || t.psCategory || "General Software / AI";
        if (cat !== trackFilter) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const tid = (t.teamId || t.id || "").toLowerCase();
        const regId = (t.registrationId || "").toLowerCase();
        const tname = (t.teamName || t.name || "").toLowerCase();
        const ps = getProblemStatementText(t).toLowerCase();
        const leader = (t.leaderName || "").toLowerCase();
        if (!tid.includes(q) && !regId.includes(q) && !tname.includes(q) && !ps.includes(q) && !leader.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [teams, statusFilter, trackFilter, search]);

  const handleScoreChange = (teamKey, field, val) => {
    const num = Math.min(10, Math.max(0, parseFloat(val) || 0));
    setLiveScores(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        [field]: val === "" ? "" : num
      }
    }));
  };

  const getTeamTotal = (teamKey, mode = "mentor") => {
    const s = liveScores[teamKey] || {};
    if (mode === "mentor") {
      const c1 = parseFloat(s.c1) || 0;
      const c2 = parseFloat(s.c2) || 0;
      const c3 = parseFloat(s.c3) || 0;
      return (s.c1 !== undefined || s.c2 !== undefined || s.c3 !== undefined) ? (c1 + c2 + c3) : "";
    } else {
      const c1 = parseFloat(s.c1) || 0;
      const c2 = parseFloat(s.c2) || 0;
      const c3 = parseFloat(s.c3) || 0;
      const c4 = parseFloat(s.c4) || 0;
      const c5 = parseFloat(s.c5) || 0;
      return (s.c1 !== undefined || s.c2 !== undefined || s.c3 !== undefined || s.c4 !== undefined || s.c5 !== undefined) 
        ? (c1 + c2 + c3 + c4 + c5) : "";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (activeSheet === "mentor") {
      const rows = filteredTeams.map((t, idx) => {
        const teamCode = formatTeamCode(t, idx, idFormat);
        const teamKey = t.id || teamCode;
        return {
          "S.No": idx + 1,
          "Team ID": teamCode,
          "Team Name": t.teamName || t.name,
          "Leader Name": t.leaderName || "",
          "Problem Statement": getProblemStatementText(t),
          "Problem & Innovation (Max 10)": liveScores[teamKey]?.c1 ?? "",
          "Mission 1 Progress (Max 10)": liveScores[teamKey]?.c2 ?? "",
          "Mission 2 Execution (Max 10)": liveScores[teamKey]?.c3 ?? "",
          "Total Score (Max 30)": getTeamTotal(teamKey, "mentor"),
        };
      });
      downloadCsv(rows, `SIH_2026_Mentor_Evaluation_${formatDate(new Date())}.csv`);
    } else if (activeSheet === "judge") {
      const rows = filteredTeams.map((t, idx) => {
        const teamCode = formatTeamCode(t, idx, idFormat);
        const teamKey = t.id || teamCode;
        return {
          "S.No": idx + 1,
          "Team ID": teamCode,
          "Team Name": t.teamName || t.name,
          "Leader Name": t.leaderName || "",
          "Problem Statement": getProblemStatementText(t),
          "C1: Problem & Inno (10M)": liveScores[teamKey]?.c1 ?? "",
          "C2: UI/UX Design (10M)": liveScores[teamKey]?.c2 ?? "",
          "C3: Tech Stack & HW (10M)": liveScores[teamKey]?.c3 ?? "",
          "C4: Working Demo (10M)": liveScores[teamKey]?.c4 ?? "",
          "C5: PPT & Q&A (10M)": liveScores[teamKey]?.c5 ?? "",
          "Total Score (Max 50)": getTeamTotal(teamKey, "judge"),
        };
      });
      downloadCsv(rows, `SIH_2026_Jury_Evaluation_${formatDate(new Date())}.csv`);
    } else {
      const rows = filteredTeams.map((t, idx) => ({
        "S.No": idx + 1,
        "Team ID": formatTeamCode(t, idx, idFormat),
        "Team Name": t.teamName || t.name,
        "Leader": t.leaderName || "",
        "Members Count": (t.members || []).length || 6,
        "Kit Status": t.checkinStatus || "Pending",
        "Food Coupons": "Issued",
      }));
      downloadCsv(rows, `SIH_2026_Swag_Goodies_Checklist_${formatDate(new Date())}.csv`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Screen-Only Control Toolbar (Hidden in Print) */}
      <div className="print:hidden space-y-5">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs shadow-md">
                SIH
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Official Evaluation & Score Sheets
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Real-time scorecards, live evaluation matrix, and clean print-ready judging sheets for Smart India Hackathon 2026.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="gap-2 font-bold text-xs bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              Export CSV
            </Button>

            <a
              href="/Goodies/SIH_2026_MASTER_EVALUATION_AND_SWAG_KIT.pdf"
              download="SIH_2026_MASTER_EVALUATION_AND_SWAG_KIT.pdf"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800 transition shadow-sm"
            >
              <Download size={14} className="text-amber-400" />
              Download Master PDF
            </a>

            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-2 font-black text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
              <Printer size={15} />
              Print Score Sheet
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
          <button
            onClick={() => setActiveSheet("mentor")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeSheet === "mentor"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-700 hover:bg-white/60"
            }`}
          >
            <ClipboardList size={15} />
            1. Mentor Score Sheet (3 Criteria - 30M)
          </button>

          <button
            onClick={() => setActiveSheet("judge")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeSheet === "judge"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-700 hover:bg-white/60"
            }`}
          >
            <Trophy size={15} />
            2. Grand Finale Jury Sheet (5 Criteria - 50M)
          </button>

          <button
            onClick={() => setActiveSheet("swag")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              activeSheet === "swag"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-700 hover:bg-white/60"
            }`}
          >
            <PackageCheck size={15} />
            3. Swag & Goodies Verification
          </button>
        </div>

        {/* Search & Metadata Bar */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search team ID, name, leader..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* ID Format Selector */}
          <div>
            <select
              value={idFormat}
              onChange={(e) => setIdFormat(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-blue-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            >
              <option value="SIH_FORMAT">ID: SIH-TM-101 (Official Clean)</option>
              <option value="REG_ID">ID: Registration Code / ID</option>
              <option value="DESK">ID: Desk / Table Number</option>
            </select>
          </div>

          {/* Track Filter */}
          <div>
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">All Problem Tracks & Themes</option>
              {tracks.map((trk) => (
                <option key={trk} value={trk}>
                  {trk}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-hidden"
            >
              <option value="CONFIRMED">Approved & Confirmed Teams Only</option>
              <option value="ALL">All Registered Teams (Draft + Confirmed)</option>
            </select>
          </div>

          {/* Lab / Round Settings */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Lab Room No."
              value={labRoom}
              onChange={(e) => setLabRoom(e.target.value)}
              className="w-1/2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium focus:border-blue-500 focus:bg-white focus:outline-hidden"
            />
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeBlankRows}
                onChange={(e) => setIncludeBlankRows(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Blank Rows
            </label>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE OFFICIAL SHEET VIEWPORT (STYLED FOR BOTH SCREEN & PRINT) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none">
        
        {/* Printable Official Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
              {activeSheet === "mentor" && "Mentor Evaluation & Scoring Sheet"}
              {activeSheet === "judge" && "Grand Finale / Jury Evaluation Score Sheet"}
              {activeSheet === "swag" && "Swag & Goodies Distribution / Verification Tracker"}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="font-black text-amber-600 uppercase tracking-wider">Smart India Hackathon 2026</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-semibold">
                {activeSheet === "mentor" && "Round 1 & Round 2 Mentoring Checkpoints"}
                {activeSheet === "judge" && "Official 5-Criteria SIH Scoring Matrix (Max 50 Marks)"}
                {activeSheet === "swag" && "Participant Kit Handover & Real-Time Verification Checklist"}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
              Official Evaluator Sheet
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Date: {formatDate(new Date())}
            </div>
          </div>
        </div>

        {/* Evaluator Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-4">
          <div>
            <span className="font-bold text-slate-900">
              {activeSheet === "mentor" ? "Mentor Name:" : activeSheet === "judge" ? "Jury Member:" : "Desk Officer:"}
            </span>{" "}
            <span className="text-slate-600 underline">____________________</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">Track / Domain:</span>{" "}
            <span className="text-slate-600 font-semibold">{trackFilter === "ALL" ? "All Tracks" : trackFilter}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">Lab / Panel Room:</span>{" "}
            <span className="text-slate-600 underline">{labRoom || "Room ______"}</span>
          </div>
          <div>
            <span className="font-bold text-slate-900">Total Teams:</span>{" "}
            <span className="text-blue-700 font-black">{filteredTeams.length} Teams</span>
          </div>
        </div>

        {/* Criteria Breakdown Summary Banner */}
        <div className="mb-4 px-3 py-2 bg-blue-50/80 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900 flex flex-wrap items-center justify-between gap-2">
          {activeSheet === "mentor" && (
            <div>
              <b>Scoring Breakdown (Total 30 Marks):</b> 1. Problem Understanding & Proposed Solution (Max 10) | 2. Mission 1 Progress (Max 10) | 3. Mission 2 Execution (Max 10)
            </div>
          )}
          {activeSheet === "judge" && (
            <div>
              <b>Official SIH Matrix (50 Marks Total):</b> C1: Problem & Inno (10M) | C2: UI/UX (10M) | C3: Tech Stack & HW/SW (10M) | C4: Working Demo (10M) | C5: PPT & Q&A (10M)
            </div>
          )}
          {activeSheet === "swag" && (
            <div>
              <b>Kit Protocol:</b> Verify Student ID & Issue: ID Badge, Welcome Bag, T-Shirt, Stickers/Swag & Food Coupons.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TABLE 1: MENTOR EVALUATION TABLE (CLEAN 8 COLUMNS) */}
        {/* ========================================================================= */}
        {activeSheet === "mentor" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold text-center">
                  <th className="border border-slate-500 py-2.5 px-2 w-8">#</th>
                  <th className="border border-slate-500 py-2.5 px-2 w-28">Team ID</th>
                  <th className="border border-slate-500 py-2.5 px-2 w-44 text-left">Team Name</th>
                  <th className="border border-slate-500 py-2.5 px-2 text-left">Problem Statement / Title</th>
                  <th className="border border-slate-500 py-2.5 px-2 w-24">1. Problem & Inno<br/><span className="text-[9px] font-normal text-slate-300">(Max 10)</span></th>
                  <th className="border border-slate-500 py-2.5 px-2 w-24">2. Mission 1 Progress<br/><span className="text-[9px] font-normal text-slate-300">(Max 10)</span></th>
                  <th className="border border-slate-500 py-2.5 px-2 w-24">3. Mission 2 Execution<br/><span className="text-[9px] font-normal text-slate-300">(Max 10)</span></th>
                  <th className="border border-slate-500 py-2.5 px-2 w-24 bg-blue-900">Total Score<br/><span className="text-[9px] font-normal text-slate-300">(Max 30)</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team, idx) => {
                  const teamCode = formatTeamCode(team, idx, idFormat);
                  const teamKey = team.id || teamCode;
                  const tname = team.teamName || team.name || "Team";
                  const ps = getProblemStatementText(team);
                  const score = liveScores[teamKey] || {};
                  const total = getTeamTotal(teamKey, "mentor");

                  return (
                    <tr key={teamKey} className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                      <td className="border border-slate-300 py-2.5 px-2 text-center font-bold text-slate-700">{idx + 1}</td>
                      <td className="border border-slate-300 py-2.5 px-2 text-center font-mono font-black text-blue-900 bg-blue-50/20">
                        {teamCode}
                      </td>
                      <td className="border border-slate-300 py-2.5 px-2 font-bold text-slate-900">
                        {tname}
                        {team.leaderName && <div className="text-[10px] text-slate-500 font-normal">Lead: {team.leaderName}</div>}
                      </td>
                      <td className="border border-slate-300 py-2.5 px-2 text-slate-800 text-[11px] leading-snug">
                        {ps}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={score.c1 ?? ""}
                          onChange={(e) => handleScoreChange(teamKey, "c1", e.target.value)}
                          placeholder="—"
                          className="w-14 text-center py-1 font-bold text-slate-900 border border-slate-200 rounded focus:border-blue-500 focus:outline-hidden print:border-none print:placeholder-transparent"
                        />
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={score.c2 ?? ""}
                          onChange={(e) => handleScoreChange(teamKey, "c2", e.target.value)}
                          placeholder="—"
                          className="w-14 text-center py-1 font-bold text-slate-900 border border-slate-200 rounded focus:border-blue-500 focus:outline-hidden print:border-none print:placeholder-transparent"
                        />
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={score.c3 ?? ""}
                          onChange={(e) => handleScoreChange(teamKey, "c3", e.target.value)}
                          placeholder="—"
                          className="w-14 text-center py-1 font-bold text-slate-900 border border-slate-200 rounded focus:border-blue-500 focus:outline-hidden print:border-none print:placeholder-transparent"
                        />
                      </td>
                      <td className="border border-slate-300 py-2.5 px-2 text-center font-black text-blue-900 text-sm bg-blue-50/40">
                        {total !== "" ? total : "—"}
                      </td>
                    </tr>
                  );
                })}

                {/* Optional Blank Rows for Manual Evaluator Additions */}
                {includeBlankRows && [1, 2, 3].map((bIdx) => (
                  <tr key={`blank-${bIdx}`} className="h-9">
                    <td className="border border-slate-300 text-center font-bold text-slate-400">{filteredTeams.length + bIdx}</td>
                    <td className="border border-slate-300 text-center font-mono text-slate-400">SIH-TM-____</td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300 bg-blue-50/40"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TABLE 2: JURY GRAND FINALE EVALUATION TABLE (CLEAN 10 COLUMNS) */}
        {/* ========================================================================= */}
        {activeSheet === "judge" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold text-center">
                  <th className="border border-slate-500 py-2.5 px-2 w-8">#</th>
                  <th className="border border-slate-500 py-2.5 px-2 w-28">Team ID</th>
                  <th className="border border-slate-500 py-2.5 px-2 w-40 text-left">Team Name</th>
                  <th className="border border-slate-500 py-2.5 px-2 text-left">Problem Statement</th>
                  <th className="border border-slate-500 py-2 px-1 w-20">C1: Problem<br/><span className="text-[9px] font-normal text-slate-300">(10M)</span></th>
                  <th className="border border-slate-500 py-2 px-1 w-20">C2: UI/UX<br/><span className="text-[9px] font-normal text-slate-300">(10M)</span></th>
                  <th className="border border-slate-500 py-2 px-1 w-20">C3: Tech<br/><span className="text-[9px] font-normal text-slate-300">(10M)</span></th>
                  <th className="border border-slate-500 py-2 px-1 w-20">C4: Demo<br/><span className="text-[9px] font-normal text-slate-300">(10M)</span></th>
                  <th className="border border-slate-500 py-2 px-1 w-20">C5: PPT<br/><span className="text-[9px] font-normal text-slate-300">(10M)</span></th>
                  <th className="border border-slate-500 py-2.5 px-2 w-20 bg-indigo-900">Total<br/><span className="text-[9px] font-normal text-slate-300">(/50)</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team, idx) => {
                  const teamCode = formatTeamCode(team, idx, idFormat);
                  const teamKey = team.id || teamCode;
                  const tname = team.teamName || team.name || "Team";
                  const ps = getProblemStatementText(team);
                  const score = liveScores[teamKey] || {};
                  const total = getTeamTotal(teamKey, "judge");

                  return (
                    <tr key={teamKey} className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                      <td className="border border-slate-300 py-2 px-2 text-center font-bold text-slate-700">{idx + 1}</td>
                      <td className="border border-slate-300 py-2 px-2 text-center font-mono font-black text-indigo-900 bg-indigo-50/20">
                        {teamCode}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 font-bold text-slate-900">
                        {tname}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-slate-800 text-[11px] leading-snug">
                        {ps}
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={score.c1 ?? ""}
                          onChange={(e) => handleScoreChange(teamKey, "c1", e.target.value)}
                          placeholder="—"
                          className="w-11 text-center py-1 font-bold text-slate-900 border border-slate-200 rounded focus:border-indigo-500 focus:outline-hidden print:border-none print:placeholder-transparent"
                        />
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={score.c2 ?? ""}
                          onChange={(e) => handleScoreChange(teamKey, "c2", e.target.value)}
                          placeholder="—"
                          className="w-11 text-center py-1 font-bold text-slate-900 border border-slate-200 rounded focus:border-indigo-500 focus:outline-hidden print:border-none print:placeholder-transparent"
                        />
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={score.c3 ?? ""}
                          onChange={(e) => handleScoreChange(teamKey, "c3", e.target.value)}
                          placeholder="—"
                          className="w-11 text-center py-1 font-bold text-slate-900 border border-slate-200 rounded focus:border-indigo-500 focus:outline-hidden print:border-none print:placeholder-transparent"
                        />
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={score.c4 ?? ""}
                          onChange={(e) => handleScoreChange(teamKey, "c4", e.target.value)}
                          placeholder="—"
                          className="w-11 text-center py-1 font-bold text-slate-900 border border-slate-200 rounded focus:border-indigo-500 focus:outline-hidden print:border-none print:placeholder-transparent"
                        />
                      </td>
                      <td className="border border-slate-300 py-1.5 px-1 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={score.c5 ?? ""}
                          onChange={(e) => handleScoreChange(teamKey, "c5", e.target.value)}
                          placeholder="—"
                          className="w-11 text-center py-1 font-bold text-slate-900 border border-slate-200 rounded focus:border-indigo-500 focus:outline-hidden print:border-none print:placeholder-transparent"
                        />
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-center font-black text-indigo-900 text-sm bg-indigo-50/40">
                        {total !== "" ? total : "—"}
                      </td>
                    </tr>
                  );
                })}

                {includeBlankRows && [1, 2, 3].map((bIdx) => (
                  <tr key={`blank-j-${bIdx}`} className="h-9">
                    <td className="border border-slate-300 text-center font-bold text-slate-400">{filteredTeams.length + bIdx}</td>
                    <td className="border border-slate-300 text-center font-mono text-slate-400">SIH-TM-____</td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300 bg-indigo-50/40"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TABLE 3: SWAG & GOODIES DISTRIBUTION TRACKER */}
        {/* ========================================================================= */}
        {activeSheet === "swag" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-bold text-center">
                  <th className="border border-slate-500 py-2.5 px-2 w-8">#</th>
                  <th className="border border-slate-500 py-2.5 px-2 w-28">Team ID</th>
                  <th className="border border-slate-500 py-2.5 px-2 w-44 text-left">Team & Leader</th>
                  <th className="border border-slate-500 py-2 px-2 w-16">Members</th>
                  <th className="border border-slate-500 py-2 px-2 w-28">T-Shirt Sizes</th>
                  <th className="border border-slate-500 py-2 px-2 w-20">ID Badges</th>
                  <th className="border border-slate-500 py-2 px-2 w-20">Welcome Bag</th>
                  <th className="border border-slate-500 py-2 px-2 w-24">Swag / Stickers</th>
                  <th className="border border-slate-500 py-2 px-2 w-20">Food Coupons</th>
                  <th className="border border-slate-500 py-2.5 px-2 w-32 text-left">Received By (Sign)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team, idx) => {
                  const teamCode = formatTeamCode(team, idx, idFormat);
                  const teamKey = team.id || teamCode;
                  const tname = team.teamName || team.name || "Team";
                  const membersCount = (team.members || []).length || 6;

                  return (
                    <tr key={teamKey} className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                      <td className="border border-slate-300 py-2.5 px-2 text-center font-bold text-slate-700">{idx + 1}</td>
                      <td className="border border-slate-300 py-2.5 px-2 text-center font-mono font-black text-emerald-900 bg-emerald-50/20">
                        {teamCode}
                      </td>
                      <td className="border border-slate-300 py-2.5 px-2 font-bold text-slate-900">
                        {tname}
                        {team.leaderName && <div className="text-[10px] text-slate-500 font-normal">{team.leaderName}</div>}
                      </td>
                      <td className="border border-slate-300 py-2.5 px-2 text-center font-bold text-slate-700">{membersCount}</td>
                      <td className="border border-slate-300 py-2.5 px-2 text-center font-mono text-[10px]">S / M / L / XL</td>
                      <td className="border border-slate-300 py-2.5 px-2 text-center text-slate-600">[  ] Issued</td>
                      <td className="border border-slate-300 py-2.5 px-2 text-center text-slate-600">[  ] Issued</td>
                      <td className="border border-slate-300 py-2.5 px-2 text-center text-slate-600">[  ] Issued</td>
                      <td className="border border-slate-300 py-2.5 px-2 text-center text-slate-600">[  ] D1  [  ] D2</td>
                      <td className="border border-slate-300 py-2.5 px-2"></td>
                    </tr>
                  );
                })}

                {includeBlankRows && [1, 2, 3].map((bIdx) => (
                  <tr key={`blank-s-${bIdx}`} className="h-9">
                    <td className="border border-slate-300 text-center font-bold text-slate-400">{filteredTeams.length + bIdx}</td>
                    <td className="border border-slate-300 text-center font-mono text-slate-400">SIH-TM-____</td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300 text-center text-slate-400">[  ]</td>
                    <td className="border border-slate-300 text-center text-slate-400">[  ]</td>
                    <td className="border border-slate-300 text-center text-slate-400">[  ]</td>
                    <td className="border border-slate-300 text-center text-slate-400">[  ]</td>
                    <td className="border border-slate-300"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Verification & Signatures Block */}
        <div className="mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-700">
          <div>
            <b>Evaluator Signature:</b> ___________________________
          </div>
          <div>
            <b>Event In-Charge:</b> ___________________________
          </div>
          <div>
            <b>Official Seal:</b> [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ]
          </div>
        </div>
      </div>
    </div>
  );
}
