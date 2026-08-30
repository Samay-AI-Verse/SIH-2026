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
  Building, 
  Sparkles,
  ShieldCheck,
  GraduationCap,
  SlidersHorizontal,
  PenTool,
  CheckSquare
} from "lucide-react";
import { adminFetchTeams, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function getShortBranch(branchStr) {
  if (!branchStr) return "CSE";
  const s = String(branchStr).trim();
  
  // Extract parentheses first
  const match = s.match(/\(([^)]+)\)/);
  const textToCheck = (match && match[1] ? match[1] : s).toLowerCase().replace(/[^a-z0-9]/g, "");

  if (textToCheck.includes("computer") || textToCheck.includes("cse") || textToCheck === "cs" || textToCheck.includes("software")) return "CSE";
  if (textToCheck.includes("information") || textToCheck === "it") return "IT";
  if (textToCheck.includes("aiml") || textToCheck.includes("aids") || textToCheck.includes("artificial") || textToCheck.includes("datascience")) return "AIDS/AIML";
  if (textToCheck.includes("electronic") || textToCheck.includes("etc") || textToCheck.includes("extc") || textToCheck.includes("entc")) return "E&TC";
  if (textToCheck.includes("electrical") || textToCheck === "ee") return "EE";
  if (textToCheck.includes("mechanical") || textToCheck.includes("mech") || textToCheck === "me") return "ME";
  if (textToCheck.includes("civil") || textToCheck === "ce") return "CE";
  if (textToCheck.includes("pharm") || textToCheck.includes("dmlt")) return "PHARM/DMLT";
  if (textToCheck.includes("bvoc") || textToCheck.includes("vocat")) return "BVOC";
  if (textToCheck.includes("bca")) return "BCA";
  if (textToCheck.includes("mca")) return "MCA";
  if (textToCheck.includes("bsc") || textToCheck.includes("science")) return "BSC";
  if (textToCheck.includes("other")) return "OTHER";

  if (s.length <= 6) return s.toUpperCase();
  return s.split(/[\s-]+/).map(w => w[0]).join('').toUpperCase().slice(0, 4);
}

export function getNormalizedStream(team) {
  const s = String(team.leaderCourse || team.leader_course || team.stream || "B.Tech").toLowerCase();
  if (s.includes("dip") || s.includes("poly")) return "Diploma";
  if (s.includes("voc")) return "B.Voc";
  if (s.includes("bca")) return "BCA";
  if (s.includes("mca")) return "MCA";
  if (s.includes("bsc") || s.includes("science")) return "B.Sc";
  return "B.Tech";
}

export function getNormalizedYear(team) {
  const y = String(team.leaderYear || team.leader_year || "3rd Year").toLowerCase();
  if (y.includes("1") || y.includes("first") || y.includes("fy") || y.includes("fe")) return "1st Year";
  if (y.includes("2") || y.includes("second") || y.includes("sy") || y.includes("se")) return "2nd Year";
  if (y.includes("3") || y.includes("third") || y.includes("ty") || y.includes("te")) return "3rd Year";
  if (y.includes("4") || y.includes("four") || y.includes("final") || y.includes("be")) return "4th Year";
  return "3rd Year";
}

export function AdminAttendanceSheet() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [streamFilter, setStreamFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("CONFIRMED"); // "CONFIRMED", "ALL"
  const [printOrientation, setPrintOrientation] = useState("portrait"); // "portrait" or "landscape"

  async function load() {
    setLoading(true);
    try {
      const data = await adminFetchTeams();
      setTeams(data || []);
    } catch (err) {
      console.error("Failed to load attendance teams:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return subscribeTable("teams", () => load().catch(() => undefined));
  }, []);

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
    return teams.filter((t) => {
      const isConfirmed = t.registrationStatus === "CONFIRMED" || t.paymentStatus === "SUCCESS" || t.payment_status === "SUCCESS";
      if (statusFilter === "CONFIRMED" && !isConfirmed) return false;

      const stream = getNormalizedStream(t);
      const branch = getShortBranch(t.leaderBranch || t.leader_branch);
      const year = getNormalizedYear(t);

      if (streamFilter !== "ALL" && stream !== streamFilter) return false;
      if (branchFilter !== "ALL" && branch !== branchFilter) return false;
      if (yearFilter !== "ALL" && year !== yearFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const membersStr = (t.members || []).map((m) => m.name || m.full_name || "").join(" ").toLowerCase();
        return (
          (t.registrationId || t.registration_id || "").toLowerCase().includes(q) ||
          (t.teamName || t.team_name || "").toLowerCase().includes(q) ||
          (t.leaderName || t.leader_name || "").toLowerCase().includes(q) ||
          (t.selectedProblemTitle || t.selectedProblemId || "").toLowerCase().includes(q) ||
          membersStr.includes(q)
        );
      }
      return true;
    });
  }, [teams, statusFilter, streamFilter, branchFilter, yearFilter, search]);

  function handlePrint() {
    window.print();
  }

  function handleExportCsv() {
    downloadCsv(
      "sih2026-team-attendance-entry-sheet.csv",
      filteredTeams.map((team, idx) => {
        const membersList = (team.members && team.members.length) 
          ? team.members.map((m, mIdx) => `${mIdx + 1}. ${m.name || m.full_name || ""} (${m.gender || "M"}) [${m.branch || team.leaderBranch || ""}]`).join(" | ")
          : `1. ${team.leaderName} (Leader)`;

        return {
          "Sr No": idx + 1,
          "Team ID": team.registrationId || team.registration_id,
          "Team Name": team.teamName || team.team_name,
          "College": team.college || "GTMC Nanded",
          "Stream": team.leaderCourse || team.leader_course || "B.Tech",
          "Leader Name": team.leaderName || team.leader_name,
          "Leader Contact": `${team.email || ""} / ${team.phone || ""}`,
          "All 6 Squad Members": membersList,
          "Problem Statement": team.isOpenInnovation ? `Open Innovation: ${team.openInnovationTitle || ""}` : (team.selectedProblemTitle || team.selectedProblemId || "Not Selected"),
          "Payment Status": team.paymentStatus || team.payment_status || "PENDING",
          "Leader Signature": "____________________",
          "Entry Check-in": "Pending / Verified",
        };
      })
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* INLINE CSS FOR FLAWLESS A4 PRINTING & ZERO COLUMN CUTOFF */}
      <style>{`
        @media print {
          @page {
            size: ${printOrientation === "landscape" ? "A4 landscape" : "A4 portrait"};
            margin: 6mm 5mm 6mm 5mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 8.5pt !important;
          }
          .print-full-table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          .print-full-table th, 
          .print-full-table td {
            border: 1px solid #0f172a !important;
            padding: 4px 4px !important;
            font-size: 8pt !important;
            line-height: 1.2 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          .print-avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-header-repeat {
            display: table-header-group !important;
          }
        }
      `}</style>

      {/* SCREEN VIEW HEADER (Hidden in Print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spidey/10 border border-spidey/30 text-spidey font-mono text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sparkles size={13} /> Official Event Day Entry Sheet
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-web flex items-center gap-2">
              <FileSpreadsheet className="text-spidey" size={32} /> Team Entry & Attendance Sheet
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
              Printable PDF verification roster with enlarged SIH emblem, 6-member single-column roster, Problem Statement codes, and physical Leader Signature slots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Orientation Switcher */}
            <div className="flex bg-slate-200 p-1 rounded-xl border border-slate-300 text-xs font-black uppercase">
              <button
                onClick={() => setPrintOrientation("portrait")}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  printOrientation === "portrait" ? "bg-web text-white shadow-xs" : "text-slate-700 hover:text-ink"
                }`}
                title="Portrait A4 (Default)"
              >
                📄 Portrait
              </button>
              <button
                onClick={() => setPrintOrientation("landscape")}
                className={`px-2.5 py-1.5 rounded-lg transition ${
                  printOrientation === "landscape" ? "bg-web text-white shadow-xs" : "text-slate-700 hover:text-ink"
                }`}
                title="Landscape A4 (Extra Wide)"
              >
                📑 Landscape
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="rounded-xl border-2 border-spidey bg-spidey px-4 py-2.5 text-xs font-black uppercase text-white hover:bg-spidey/90 transition shadow-comic flex items-center gap-2 cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer size={16} /> 🖨️ Print PDF Sheet
            </button>

            <button
              onClick={handleExportCsv}
              className="rounded-xl border-2 border-slate-700 bg-white px-3.5 py-2.5 text-xs font-black uppercase text-slate-800 hover:bg-slate-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} /> Export CSV
            </button>

            <button
              onClick={() => load()}
              className="rounded-xl border-2 border-slate-300 bg-white p-2.5 text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Multi-Dimensional Analytics Breakdown Bar (Stream, Branch & Year) */}
        <div className="rounded-3xl border-2 border-slate-800 bg-white p-4 shadow-comic space-y-3">
          {/* Stream Row */}
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

          {/* Branch Row */}
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

          {/* Year Row */}
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

        {/* Filter Controls Bar */}
        <div className="rounded-2xl border-2 border-slate-800 bg-white p-4 shadow-comic space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Status Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-500 mr-1">Status:</span>
              
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setStatusFilter("CONFIRMED")}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                    statusFilter === "CONFIRMED" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-ink"
                  }`}
                >
                  Confirmed / Paid Only
                </button>
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                    statusFilter === "ALL" ? "bg-web text-white shadow-xs" : "text-slate-600 hover:text-ink"
                  }`}
                >
                  All Teams ({teams.length})
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Team, Reg ID, Leader, Member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL HEADER WITH ENLARGED SIH LOGO */}
      <div className="hidden print:block border-b-2 border-black pb-3 mb-3">
        <div className="flex items-center justify-between gap-4">
          {/* Large Official SIH Logo */}
          <div className="shrink-0">
            <img
              src="/sih-logo.png"
              alt="Smart India Hackathon Logo"
              className="h-16 w-auto object-contain drop-shadow-sm"
            />
          </div>

          {/* Central Institution & Event Titles */}
          <div className="flex-1 text-center space-y-0.5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800">
              GRAMIN TECHNICAL & MANAGEMENT CAMPUS (GTMC), NANDED
            </h3>
            <h1 className="text-lg font-black uppercase tracking-tight text-black leading-tight">
              SMART INDIA HACKATHON (SIH 2026) — INTERNAL HACKATHON
            </h1>
            <h2 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-900 bg-slate-100 py-0.5 px-3 rounded inline-block border border-slate-300">
              Official Team Entry & Squad Attendance Verification Sheet
            </h2>
          </div>

          {/* Right Meta Stamp Box */}
          <div className="shrink-0 border border-black rounded p-1.5 text-[9px] font-bold text-right leading-tight bg-slate-50">
            <div>Desk: <span className="font-mono font-black">DESK-01</span></div>
            <div>Date: <span className="font-mono">____/____/2026</span></div>
            <div>Teams: <span className="font-mono font-black">{filteredTeams.length} Squads</span></div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[9.5px] font-bold text-black mt-2 pt-1 border-t border-dashed border-slate-400">
          <span>Reporting Desk / Check-in Counter: _________________________</span>
          <span>Time: 08:00 AM onwards</span>
          <span>Stream: {streamFilter === "ALL" ? "All Degree Streams" : streamFilter}</span>
          <span>Verified By: _________________________</span>
        </div>
      </div>

      {/* TABLE SHEET (Screen + Printable format with 100% Fixed Columns) */}
      <div className="rounded-2xl border-2 border-slate-800 bg-white shadow-comic overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px] border-collapse divide-y divide-slate-200 print:min-w-full print:w-full print-full-table">
            <thead className="bg-web text-white font-black uppercase text-[10px] tracking-wider print:bg-slate-200 print:text-black print-header-repeat">
              <tr>
                {/* 1. Sr No (3%) */}
                <th className="p-2.5 text-center w-[3%] print:w-[3%]">#</th>

                {/* 2. Team ID (10%) */}
                <th className="p-2.5 w-[10%] print:w-[10%]">Team ID</th>

                {/* 3. Team Name & College (16%) */}
                <th className="p-2.5 w-[16%] print:w-[16%]">Team Name & College</th>

                {/* 4. Squad Members (38%) */}
                <th className="p-2.5 w-[38%] print:w-[38%]">
                  All Team Members (6 Squad Members)
                </th>

                {/* 5. Problem Statement (16%) */}
                <th className="p-2.5 w-[16%] print:w-[16%]">Problem Statement</th>

                {/* 6. Sign of Leader (11%) */}
                <th className="p-2.5 text-center w-[11%] print:w-[11%]">
                  Sign of Leader
                </th>

                {/* 7. Verification Status (6%) */}
                <th className="p-2.5 text-center w-[6%] print:w-[6%]">
                  Desk Check
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-semibold print:divide-black">
              {filteredTeams.map((team, idx) => {
                const members = team.members || [];
                const leaderName = team.leaderName || team.leader_name;
                const isPaid = team.paymentStatus === "SUCCESS" || team.payment_status === "SUCCESS" || team.registrationStatus === "CONFIRMED";

                return (
                  <tr 
                    key={team.id || idx} 
                    className="hover:bg-slate-50/80 transition print-avoid-break print:border-b print:border-black"
                  >
                    {/* 1. Sr No */}
                    <td className="p-2 text-center font-mono font-bold text-slate-600 print:text-black align-top">
                      {idx + 1}
                    </td>

                    {/* 2. Team ID */}
                    <td className="p-2 align-top">
                      <div className="font-mono text-xs font-black text-web bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 inline-block print:text-black print:bg-transparent print:border-black print:text-[9.5px]">
                        {team.registrationId || team.registration_id}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold block mt-1 print:text-black print:text-[8px]">
                        {team.leaderCourse || team.leader_course || "B.Tech"}
                      </div>
                    </td>

                    {/* 3. Team Name & College */}
                    <td className="p-2 align-top">
                      <div className="font-display text-sm text-slate-900 leading-tight print:text-black print:font-black print:text-[10px]">
                        {team.teamName || team.team_name}
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium mt-0.5 print:text-black print:text-[8.5px] truncate">
                        {team.college || "GTMC Nanded"}
                      </div>
                      <div className="text-[10px] text-slate-700 mt-0.5 print:text-black font-mono font-bold print:text-[8.5px]">
                        Ph: {team.leaderPhone || team.phone || "—"}
                      </div>
                    </td>

                    {/* 4. All 6 Squad Members (Full Un-truncated Names) */}
                    <td className="p-2.5 align-top">
                      {members.length > 0 ? (
                        <div className="space-y-1 text-xs print:text-[9.5px]">
                          {members.map((m, mIdx) => {
                            const isLdr = m.isLeader || m.is_leader || mIdx === 0;
                            const isFemale = String(m.gender || "").toLowerCase() === "female";
                            const mName = m.name || m.full_name || `Member #${mIdx + 1}`;

                            return (
                              <div 
                                key={m.id || mIdx} 
                                className={`flex items-center justify-between gap-1.5 py-0.5 px-1 rounded leading-tight ${
                                  isLdr ? "bg-amber-50 font-bold text-web border border-amber-200 print:bg-transparent print:border-none print:text-black" : "text-slate-800 print:text-black font-semibold"
                                }`}
                              >
                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                  <span className="font-mono text-[10px] text-slate-400 print:text-black w-4 shrink-0 font-bold">{mIdx + 1}.</span>
                                  {isLdr && <Crown size={11} className="text-gold shrink-0 print:hidden" />}
                                  <span className="whitespace-normal break-words font-bold">
                                    {mName}
                                  </span>
                                  {isLdr && (
                                    <span className="text-[8px] bg-gold text-web px-1 rounded font-black print:text-black print:border print:border-black shrink-0">
                                      LDR
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 shrink-0 font-mono text-[9px] print:text-[8.5px] font-bold text-slate-600 print:text-black">
                                  <span className={isFemale ? "text-pink-600 print:text-black" : "text-blue-600 print:text-black"}>
                                    ({m.gender ? m.gender[0] : "M"})
                                  </span>
                                  <span className="font-black text-slate-700 print:text-black bg-slate-100 px-1 py-0.2 rounded print:bg-transparent print:p-0">
                                    {getShortBranch(m.branch || team.leaderBranch || team.leader_branch)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-1 text-xs">
                          <div className="font-bold text-web print:text-black">1. {leaderName} (Team Leader)</div>
                          <div className="text-slate-400 italic text-[10px] print:text-black">6 members squad registered</div>
                        </div>
                      )}
                    </td>

                    {/* 5. Problem Statement (Properly Wrapped with Title & Code) */}
                    <td className="p-2 align-top text-xs print:text-[8.5px]">
                      {team.isOpenInnovation ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-spidey font-black bg-spidey/10 px-1 py-0.2 rounded text-[9px] print:text-black print:border print:border-black">
                            🚀 Open Innovation
                          </span>
                          <p className="text-[10px] text-slate-900 font-bold mt-0.5 print:text-black leading-tight break-words">
                            {team.openInnovationTitle || "Custom Innovation Project"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono text-[10px] font-black text-web block print:text-black">
                            {team.selectedProblemId || team.selected_problem_id || "—"}
                          </span>
                          <p className="text-[10px] text-slate-700 font-semibold mt-0.5 leading-tight print:text-black break-words">
                            {team.selectedProblemTitle || team.selected_problem_title || "Not Selected"}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* 6. Sign of Leader (Signature Box) */}
                    <td className="p-2 text-center align-middle">
                      <div className="h-10 border border-slate-300 rounded flex flex-col justify-end p-0.5 print:border-black print:h-11 bg-slate-50/50 print:bg-transparent">
                        <span className="text-[7.5px] text-slate-400 uppercase font-bold print:text-black block border-t border-dashed border-slate-300 print:border-black pt-0.2">
                          Sign
                        </span>
                      </div>
                    </td>

                    {/* 7. Verification / Goodies Status */}
                    <td className="p-2 text-center align-middle">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <input type="checkbox" className="h-3 w-3 rounded border-slate-400 print:border-black" />
                          <span className="text-[8px] font-black uppercase text-slate-600 print:text-black">Entry</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <input type="checkbox" className="h-3 w-3 rounded border-slate-400 print:border-black" />
                          <span className="text-[8px] font-black uppercase text-slate-600 print:text-black">Swag</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filteredTeams.length && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400 font-bold">
                    No teams match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL FOOTER SIGNATURES */}
      <div className="hidden print:flex justify-between items-end pt-10 mt-6 border-t-2 border-black text-xs font-bold text-black px-2">
        <div className="text-center">
          <div className="w-40 border-b border-black mb-1"></div>
          <span className="text-[9px]">Check-in Officer / Volunteer</span>
        </div>

        <div className="text-center">
          <div className="w-40 border-b border-black mb-1"></div>
          <span className="text-[9px]">SIH Internal Coordinator</span>
        </div>

        <div className="text-center">
          <div className="w-40 border-b border-black mb-1"></div>
          <span className="text-[9px]">Principal / Head of Institution (Seal)</span>
        </div>
      </div>
    </div>
  );
}
