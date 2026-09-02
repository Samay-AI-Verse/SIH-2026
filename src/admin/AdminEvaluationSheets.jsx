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
  Hash,
  Edit3
} from "lucide-react";
import { adminFetchTeams, fetchProblems, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function formatTeamCode(team, index, idFormat = "REG_ID") {
  if (idFormat === "DESK" && (team.deskNumber || team.desk_number)) {
    return `Desk-${team.deskNumber || team.desk_number}`;
  }
  if (idFormat === "SIH_FORMAT") {
    return `SIH-TM-${101 + index}`;
  }

  // Default: Official Clean Registration ID (e.g. BSC-SIH-30, ENGG-SIH-23, DIPLOMA-SIH-39, GTMC-SIH-01)
  const regId = team.registrationId || team.registration_id || team.regId || team.reg_id;
  if (regId && regId.trim() && !regId.includes("-4") && regId.length <= 20) {
    return regId.trim();
  }
  if (regId && regId.trim()) {
    return regId.trim();
  }
  if (team.id && team.id.length > 8 && team.id.length < 32) {
    return team.id;
  }
  if (team.id && team.id.length >= 32) {
    return `REG-${team.id.slice(0, 6).toUpperCase()}`;
  }

  return `SIH-TM-${101 + index}`;
}

export function resolveProblemTitle(team, problemsMap = {}) {
  // 1. Check Open Innovation
  const isOpenInno = Boolean(
    team.is_open_innovation || 
    team.isOpenInnovation || 
    team.selected_problem_id === "OPEN_INNOVATION" || 
    team.selectedProblemId === "OPEN_INNOVATION" ||
    team.problem_id === "OPEN_INNOVATION" ||
    team.problemId === "OPEN_INNOVATION"
  );
  const openInnoTitle = team.open_innovation_title || team.openInnovationTitle || team.open_innovation_description || team.openInnovationDescription;
  if (isOpenInno) {
    if (openInnoTitle && openInnoTitle.trim()) {
      return `[OPEN INNOVATION] ${openInnoTitle.trim()}`;
    }
    return `[OPEN INNOVATION] Custom Innovation Project`;
  }

  // 2. Check selected problem ID / code in problemsMap lookup
  const pid = team.selected_problem_id || team.selectedProblemId || team.problem_id || team.problemId;
  const pcode = team.selected_problem_code || team.selectedProblemCode || team.problem_code || team.problemCode;
  
  if (pid && pid !== "OPEN_INNOVATION" && problemsMap[pid]) {
    const p = problemsMap[pid];
    return `[${p.code || pid}] ${p.title}`;
  }
  if (pcode && pcode !== "OPEN_INNOVATION" && problemsMap[pcode]) {
    const p = problemsMap[pcode];
    return `[${p.code || pcode}] ${p.title}`;
  }

  // 3. Check selected problem title directly on team
  const selTitle = team.selected_problem_title || team.selectedProblemTitle;
  if (selTitle && selTitle.trim()) {
    const codeTag = pid && pid !== "OPEN_INNOVATION" ? `[${pid}] ` : pcode ? `[${pcode}] ` : "";
    return `${codeTag}${selTitle.trim()}`;
  }

  // 4. Check if problem ID exists without title
  if (pid && pid !== "OPEN_INNOVATION") {
    return `[${pid}] Problem Statement ${pid}`;
  }

  // 5. Check project title / custom title
  const projTitle = team.project_title || team.projectTitle || team.title || team.topic;
  if (projTitle && projTitle.trim()) {
    return projTitle.trim();
  }

  // 6. Check problem title / statement
  const pTitle = team.problem_title || team.problemTitle;
  if (pTitle && pTitle.trim() && pTitle !== "Smart India Hackathon Innovation Challenge") {
    return pTitle.trim();
  }

  const pStmt = team.problem_statement || team.problemStatement;
  if (pStmt && pStmt.trim() && pStmt !== "Smart India Hackathon Innovation Challenge") {
    return pStmt.trim();
  }

  // 7. Check category
  const cat = team.problemCategory || team.category || team.psCategory;
  if (cat && cat.trim()) {
    return `${cat.trim()} Innovation Track`;
  }

  return "Smart India Hackathon Innovation Challenge";
}

export function AdminEvaluationSheets() {
  const [teams, setTeams] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("CONFIRMED"); // "CONFIRMED", "ALL"
  const [activeSheet, setActiveSheet] = useState("mentor"); // "mentor", "judge", "swag"
  const [idFormat, setIdFormat] = useState("REG_ID"); // "REG_ID", "DESK", "SIH_FORMAT"
  const [labRoom, setLabRoom] = useState("Lab-01");
  const [liveScores, setLiveScores] = useState({}); // { [teamKey]: { c1, c2, c3, c4, c5 } }
  const [customTitles, setCustomTitles] = useState({}); // { [teamKey]: editedTitle }
  const [includeBlankRows, setIncludeBlankRows] = useState(true);
  const [orientation, setOrientation] = useState("landscape"); // "landscape" or "portrait"

  async function loadData() {
    setLoading(true);
    try {
      const [teamsData, problemsData] = await Promise.all([
        adminFetchTeams().catch(() => []),
        fetchProblems().catch(() => [])
      ]);
      setTeams(teamsData || []);
      setProblems(problemsData || []);
    } catch (err) {
      console.error("Failed to load evaluation data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    return subscribeTable("teams", () => loadData().catch(() => undefined));
  }, []);

  // Problems Dictionary Lookup
  const problemsMap = useMemo(() => {
    const map = {};
    problems.forEach(p => {
      if (p.id) map[p.id] = p;
      if (p.code) map[p.code] = p;
    });
    return map;
  }, [problems]);

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
        const isConfirmed = t.paymentStatus === "SUCCESS" || t.status === "CONFIRMED" || t.status === "APPROVED" || t.registration_status === "CONFIRMED";
        if (!isConfirmed && teams.some(item => item.paymentStatus === "SUCCESS" || item.registration_status === "CONFIRMED")) {
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
        const regId = (t.registrationId || t.registration_id || "").toLowerCase();
        const tname = (t.teamName || t.team_name || t.name || "").toLowerCase();
        const ps = resolveProblemTitle(t, problemsMap).toLowerCase();
        const leader = (t.leaderName || t.leader_name || "").toLowerCase();
        if (!tid.includes(q) && !regId.includes(q) && !tname.includes(q) && !ps.includes(q) && !leader.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [teams, statusFilter, trackFilter, search, problemsMap]);

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
        const problemTitle = customTitles[teamKey] || resolveProblemTitle(t, problemsMap);
        return {
          "S.No": idx + 1,
          "Team ID": teamCode,
          "Team Name": t.teamName || t.team_name || t.name,
          "Leader Name": t.leaderName || t.leader_name || "",
          "Problem Statement": problemTitle,
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
        const problemTitle = customTitles[teamKey] || resolveProblemTitle(t, problemsMap);
        return {
          "S.No": idx + 1,
          "Team ID": teamCode,
          "Team Name": t.teamName || t.team_name || t.name,
          "Leader Name": t.leaderName || t.leader_name || "",
          "Problem Statement": problemTitle,
          "C1: Idea and Innovation (10M)": liveScores[teamKey]?.c1 ?? "",
          "C2: Implementation (15M)": liveScores[teamKey]?.c2 ?? "",
          "C3: Demo and Functionality (10M)": liveScores[teamKey]?.c3 ?? "",
          "C4: Communication and Presentation (10M)": liveScores[teamKey]?.c4 ?? "",
          "C5: Question and Answering (5M)": liveScores[teamKey]?.c5 ?? "",
          "Total Score (Max 50)": getTeamTotal(teamKey, "judge"),
        };
      });
      downloadCsv(rows, `SIH_2026_Jury_Evaluation_${formatDate(new Date())}.csv`);
    } else {
      const rows = filteredTeams.map((t, idx) => ({
        "S.No": idx + 1,
        "Team ID": formatTeamCode(t, idx, idFormat),
        "Team Name": t.teamName || t.team_name || t.name,
        "Leader": t.leaderName || t.leader_name || "",
        "Members Count": (t.members || []).length || 6,
        "Kit Status": t.checkinStatus || t.entryStatus || "Pending",
        "Food Coupons": "Issued",
      }));
      downloadCsv(rows, `SIH_2026_Swag_Goodies_Checklist_${formatDate(new Date())}.csv`);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page {
            size: A4 ${orientation};
            margin: ${orientation === "landscape" ? "6mm 5mm 6mm 5mm" : "8mm 6mm 8mm 6mm"};
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: ${orientation === "landscape" ? "8pt" : "8.5pt"} !important;
          }
          .print-watermark-fixed {
            display: flex !important;
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: ${orientation === "landscape" ? "420px" : "340px"} !important;
            max-width: 80% !important;
            opacity: 0.07 !important;
            z-index: 0 !important;
            pointer-events: none !important;
            align-items: center !important;
            justify-content: center !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-sheet-content {
            position: relative !important;
            z-index: 1 !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
      
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
            {/* Orientation Toggle: Landscape vs Portrait */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                  orientation === "landscape"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="A4 Landscape Layout (Recommended for 10-column Jury Evaluation Matrix)"
              >
                <span className="w-3.5 h-2.5 border-2 border-current rounded-xs inline-block"></span>
                Landscape
              </button>
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                  orientation === "portrait"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="A4 Portrait Layout"
              >
                <span className="w-2.5 h-3.5 border-2 border-current rounded-xs inline-block"></span>
                Portrait
              </button>
            </div>

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
              title="Download combined Master Evaluation & Swag Kit PDF"
            >
              <Download size={14} className="text-amber-400" />
              Download Master PDF
            </a>

            <a
              href="/Goodies/SIH_2026_Final_Judge_Evaluation_ScoreSheet.pdf"
              download="SIH_2026_Final_Judge_Evaluation_ScoreSheet.pdf"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-800 transition shadow-sm"
              title="Download standalone official Jury Evaluation Sheet PDF"
            >
              <Download size={14} className="text-amber-300" />
              Download Jury PDF
            </a>

            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-2 font-black text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
              <Printer size={15} />
              Print ({orientation === "landscape" ? "Landscape" : "Portrait"})
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3.5 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search team ID, name, problem..."
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
              <option value="REG_ID">🆔 Official Registration ID (e.g. BSC-SIH-30)</option>
              <option value="DESK">🪑 Desk / Table No. (e.g. Desk-01)</option>
              <option value="SIH_FORMAT">🔢 Sequential Code (SIH-TM-101)</option>
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
      <div className="relative bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none overflow-hidden print-sheet-content">
        
        {/* Fixed Watermark for Print (Repeats across all pages in center) */}
        <div className="hidden print:flex print-watermark-fixed">
          <img
            src="/sih-logo.png"
            alt="Smart India Hackathon Watermark"
            className="w-full object-contain"
          />
        </div>

        {/* Screen Background Center Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden z-0 print:hidden opacity-[0.04] select-none">
          <img
            src="/sih-logo.png"
            alt="Smart India Hackathon Watermark"
            className="w-96 max-w-[70%] object-contain"
          />
        </div>

        {/* Relative Inner Container */}
        <div className="relative z-1">
          {/* Printable Official Header with Smart India Hackathon & Collaborative Logos */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Official Smart India Hackathon Logo */}
              <div className="shrink-0 flex items-center">
                <img
                  src="/sih-logo.png"
                  alt="Smart India Hackathon 2026 Logo"
                  className="h-16 sm:h-20 w-auto object-contain drop-shadow-xs"
                />
              </div>

              {/* Center: Collaborative Bodies & Official Hackathon Dossier Titles */}
              <div className="flex-1 text-center space-y-1">
                <div className="text-[9.5px] font-black uppercase tracking-widest text-slate-700 flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-blue-900 font-extrabold">Ministry of Education</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-700 font-extrabold">Innovation Cell (MIC)</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-800 font-extrabold">AICTE</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-700 font-bold">GTMC Campus, Nanded</span>
                </div>

                <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                  {activeSheet === "mentor" && "Mentor Evaluation & Scoring Dossier"}
                  {activeSheet === "judge" && "Grand Finale / Jury Evaluation Score Sheet"}
                  {activeSheet === "swag" && "Swag & Goodies Distribution / Verification Tracker"}
                </h1>

                <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-slate-100 border border-slate-300 rounded-full text-[10px] font-bold text-slate-800">
                  <span className="text-amber-700 font-black tracking-wide">SMART INDIA HACKATHON 2026</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-700">
                    {activeSheet === "mentor" && "Round 1 & Round 2 Mentoring Checkpoints (Max 30 Marks)"}
                    {activeSheet === "judge" && "Official 5-Criteria SIH Scoring Matrix (Max 50 Marks)"}
                    {activeSheet === "swag" && "Participant Kit Handover & Real-Time Verification Checklist"}
                  </span>
                </div>
              </div>

              {/* Right: Evaluator Metadata Stamp Box */}
              <div className="shrink-0 text-right space-y-1">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white rounded-lg text-[9.5px] font-black uppercase tracking-widest shadow-xs">
                  Official Evaluator Sheet
                </div>
                <div className="text-[9.5px] text-slate-600 font-mono font-bold">
                  Date: {formatDate(new Date())}
                </div>
                <div className="text-[9px] font-black text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-center">
                  SIH 2026 INTERNAL
                </div>
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
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 w-full">
              <span className="font-extrabold text-slate-900 text-[12px]">Official Jury Scoring Matrix (50M Total):</span>
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold text-[11px] border border-blue-200">
                <span className="font-mono">C1:</span> Idea & Innovation <b className="text-blue-700">(10M)</b>
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold text-[11px] border border-emerald-200">
                <span className="font-mono">C2:</span> Implementation <b className="text-emerald-700">(15M)</b>
              </span>
              <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-bold text-[11px] border border-indigo-200">
                <span className="font-mono">C3:</span> Demo & Functionality <b className="text-indigo-700">(10M)</b>
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold text-[11px] border border-amber-200">
                <span className="font-mono">C4:</span> Communication & Presentation <b className="text-amber-700">(10M)</b>
              </span>
              <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-bold text-[11px] border border-purple-200">
                <span className="font-mono">C5:</span> Question & Answering <b className="text-purple-700">(5M)</b>
              </span>
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
                  <th className="border border-slate-500 py-2.5 px-2 text-left">Problem Statement / Project Title</th>
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
                  const tname = team.teamName || team.team_name || team.name || "Team";
                  const resolvedTitle = customTitles[teamKey] || resolveProblemTitle(team, problemsMap);
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
                        {(team.leaderName || team.leader_name) && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            Lead: {team.leaderName || team.leader_name}
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-300 py-2 px-2 text-slate-800 text-[11px] leading-snug">
                        <div className="font-medium text-slate-900">
                          {resolvedTitle}
                        </div>
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
                  <th className="border border-slate-500 py-2.5 px-2 text-left">Problem Statement / Project Title</th>
                  <th className="border border-slate-500 py-2 px-1 w-24">C1: Idea & Innovation<br/><span className="text-[9px] font-normal text-slate-300">(10M)</span></th>
                  <th className="border border-slate-500 py-2 px-1 w-24">C2: Implementation<br/><span className="text-[9px] font-normal text-slate-300">(15M)</span></th>
                  <th className="border border-slate-500 py-2 px-1 w-24">C3: Demo & Functionality<br/><span className="text-[9px] font-normal text-slate-300">(10M)</span></th>
                  <th className="border border-slate-500 py-2 px-1 w-28">C4: Comm. & Presentation<br/><span className="text-[9px] font-normal text-slate-300">(10M)</span></th>
                  <th className="border border-slate-500 py-2 px-1 w-24">C5: Question & Answering<br/><span className="text-[9px] font-normal text-slate-300">(5M)</span></th>
                  <th className="border border-slate-500 py-2.5 px-2 w-20 bg-indigo-900">Total<br/><span className="text-[9px] font-normal text-slate-300">(/50)</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredTeams.map((team, idx) => {
                  const teamCode = formatTeamCode(team, idx, idFormat);
                  const teamKey = team.id || teamCode;
                  const tname = team.teamName || team.team_name || team.name || "Team";
                  const resolvedTitle = customTitles[teamKey] || resolveProblemTitle(team, problemsMap);
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
                        <div className="font-medium text-slate-900">
                          {resolvedTitle}
                        </div>
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
                          max="15"
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
                          max="5"
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
                  const tname = team.teamName || team.team_name || team.name || "Team";
                  const membersCount = (team.members || []).length || 6;

                  return (
                    <tr key={teamKey} className={idx % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                      <td className="border border-slate-300 py-2.5 px-2 text-center font-bold text-slate-700">{idx + 1}</td>
                      <td className="border border-slate-300 py-2.5 px-2 text-center font-mono font-black text-emerald-900 bg-emerald-50/20">
                        {teamCode}
                      </td>
                      <td className="border border-slate-300 py-2.5 px-2 font-bold text-slate-900">
                        {tname}
                        {(team.leaderName || team.leader_name) && (
                          <div className="text-[10px] text-slate-500 font-normal">
                            {team.leaderName || team.leader_name}
                          </div>
                        )}
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
    </div>
  );
}
