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
  GraduationCap
} from "lucide-react";
import { adminFetchTeams, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function AdminAttendanceSheet() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [streamFilter, setStreamFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("CONFIRMED"); // "CONFIRMED", "ALL"

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

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const isConfirmed = t.registrationStatus === "CONFIRMED" || t.paymentStatus === "SUCCESS" || t.payment_status === "SUCCESS";
      if (statusFilter === "CONFIRMED" && !isConfirmed) return false;

      const course = (t.leaderCourse || t.leader_course || t.stream || "B.Tech").trim();
      if (streamFilter !== "ALL" && !course.toLowerCase().includes(streamFilter.toLowerCase())) {
        return false;
      }

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
  }, [teams, statusFilter, streamFilter, search]);

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
      {/* SCREEN VIEW HEADER (Hidden in Print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-web flex items-center gap-2">
              <FileSpreadsheet className="text-spidey" size={32} /> Team Entry & Attendance Sheet
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
              Official printed verification sheet for Hackathon day entry desk with single-column squad rosters and leader signature slots.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="rounded-xl border-2 border-web bg-web px-4 py-2.5 text-xs font-black uppercase text-white hover:bg-spidey transition shadow-comic flex items-center gap-2"
              title="Print or Save as PDF"
            >
              <Printer size={16} /> 🖨️ Download / Print PDF Sheet
            </button>

            <Button
              variant="secondary"
              onClick={handleExportCsv}
              className="text-xs font-black shadow-comic flex items-center gap-1.5"
            >
              <Download size={14} /> Export CSV
            </Button>

            <button
              onClick={() => load()}
              className="rounded-xl border-2 border-web/20 bg-white p-2.5 text-slate-700 hover:bg-gold hover:text-web transition shadow-2xs"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-2xl border-2 border-web/20 bg-white p-4 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Status & Stream Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-400 mr-1">Filter:</span>
              
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setStatusFilter("CONFIRMED")}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition ${
                    statusFilter === "CONFIRMED" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-ink"
                  }`}
                >
                  Confirmed / Paid Only
                </button>
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase transition ${
                    statusFilter === "ALL" ? "bg-web text-white shadow-xs" : "text-slate-600 hover:text-ink"
                  }`}
                >
                  All Teams ({teams.length})
                </button>
              </div>

              <select
                value={streamFilter}
                onChange={(e) => setStreamFilter(e.target.value)}
                className="rounded-xl border-2 border-web/20 bg-slate-50 px-3 py-1.5 text-xs font-bold text-ink focus:border-web focus:outline-none"
              >
                <option value="ALL">All Streams / Degrees</option>
                <option value="B.Tech">B.Tech / B.E.</option>
                <option value="Diploma">Diploma</option>
                <option value="B.Voc">B.Voc</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Team, Reg ID, Leader, Member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border-2 border-web/20 bg-slate-50 py-2 pl-9 pr-3 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY OFFICIAL HEADER */}
      <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-xl font-black uppercase tracking-wider text-black">
          GTMC NANDED — SMART INDIA HACKATHON (SIH 2026)
        </h1>
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 mt-0.5">
          Internal Hackathon — Official Team Entry & Attendance Verification Sheet
        </h2>
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 mt-2 px-2">
          <span>Date: ________________________</span>
          <span>Reporting Desk / Check-in Counter</span>
          <span>Total Teams Listed: {filteredTeams.length}</span>
        </div>
      </div>

      {/* TABLE SHEET (Screen + Printable format) */}
      <div className="rounded-2xl border-2 border-web/20 bg-white shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[1000px] border-collapse divide-y divide-slate-200 print:min-w-full print:border print:border-black">
            <thead className="bg-web text-white font-black uppercase text-[10px] tracking-wider print:bg-slate-200 print:text-black print:border-b-2 print:border-black">
              <tr>
                <th className="p-3 w-12 text-center print:border print:border-black">#</th>
                <th className="p-3 w-32 print:border print:border-black">Team ID</th>
                <th className="p-3 w-48 print:border print:border-black">Team Name & College</th>
                <th className="p-3 min-w-[280px] print:border print:border-black">
                  All Team Members (6 Members Roster)
                </th>
                <th className="p-3 w-48 print:border print:border-black">Problem Statement</th>
                <th className="p-3 w-36 text-center print:border print:border-black">
                  Sign of Leader
                </th>
                <th className="p-3 w-28 text-center print:border print:border-black">
                  Verification Status
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
                    className="hover:bg-slate-50/80 transition print:break-inside-avoid print:border-b print:border-black"
                  >
                    {/* 1. Sr No */}
                    <td className="p-3 text-center font-mono font-bold text-slate-500 print:border print:border-black print:text-black">
                      {idx + 1}
                    </td>

                    {/* 2. Team ID */}
                    <td className="p-3 print:border print:border-black">
                      <span className="font-mono text-xs font-black text-spidey bg-spidey/10 px-2 py-0.5 rounded border border-spidey/20 inline-block print:text-black print:bg-transparent print:border-black">
                        {team.registrationId || team.registration_id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold block mt-1">
                        {team.leaderCourse || team.leader_course || "B.Tech"}
                      </span>
                    </td>

                    {/* 3. Team Name & College */}
                    <td className="p-3 print:border print:border-black">
                      <div className="font-display text-base text-web leading-tight print:text-black print:font-bold">
                        {team.teamName || team.team_name}
                      </div>
                      <div className="text-[10px] text-slate-600 font-semibold mt-0.5 print:text-black">
                        {team.college || "GTMC Nanded"}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 print:text-black font-mono">
                        Ph: {team.phone || team.leader_phone || "—"}
                      </div>
                    </td>

                    {/* 4. All Team Members (Single Column) */}
                    <td className="p-3 print:border print:border-black">
                      {members.length > 0 ? (
                        <div className="space-y-1 text-xs">
                          {members.map((m, mIdx) => {
                            const isLdr = m.isLeader || m.is_leader || mIdx === 0;
                            const isFemale = String(m.gender).toLowerCase() === "female";

                            return (
                              <div 
                                key={m.id || mIdx} 
                                className={`flex items-center justify-between gap-1.5 py-0.5 px-1.5 rounded ${
                                  isLdr ? "bg-amber-50 font-bold text-web border border-amber-200 print:bg-transparent print:border-none" : "text-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className="font-mono text-[10px] text-slate-400 w-4">{mIdx + 1}.</span>
                                  {isLdr && <Crown size={11} className="text-gold shrink-0 print:hidden" />}
                                  <span className="truncate">{m.name || m.full_name}</span>
                                  {isLdr && <span className="text-[9px] bg-gold text-web px-1 rounded font-black print:text-black">LDR</span>}
                                </div>

                                <div className="flex items-center gap-1 text-[10px] shrink-0 font-mono text-slate-500 print:text-black">
                                  <span className={isFemale ? "text-pink-600 font-bold print:text-black" : "text-blue-600 font-bold print:text-black"}>
                                    ({m.gender ? m.gender[0] : "M"})
                                  </span>
                                  <span>{m.branch || team.leaderBranch || ""}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-1 text-xs">
                          <div className="font-bold text-web">1. {leaderName} (Team Leader)</div>
                          <div className="text-slate-400 italic text-[10px]">Roster registered with 6 members</div>
                        </div>
                      )}
                    </td>

                    {/* 5. Problem Statement */}
                    <td className="p-3 text-xs font-bold text-slate-700 print:border print:border-black print:text-black">
                      {team.isOpenInnovation ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-spidey font-black bg-spidey/10 px-1.5 py-0.5 rounded text-[10px] print:text-black print:border print:border-black">
                            🚀 Open Innovation
                          </span>
                          <p className="text-[11px] text-web font-bold mt-1 line-clamp-2 print:text-black">
                            {team.openInnovationTitle || "Custom Innovation Project"}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="font-mono text-xs font-black text-web block print:text-black">
                            {team.selectedProblemId || "—"}
                          </span>
                          <p className="text-[11px] text-slate-600 font-semibold mt-0.5 line-clamp-2 print:text-black">
                            {team.selectedProblemTitle || "Not Selected"}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* 6. Sign of Leader (Physical Signature Line) */}
                    <td className="p-3 text-center print:border print:border-black">
                      <div className="h-12 border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-end p-1 print:border-black print:border-solid print:h-14">
                        <span className="text-[9px] text-slate-400 uppercase font-black print:text-black block border-t border-slate-200 print:border-black pt-0.5">
                          Leader Sign
                        </span>
                      </div>
                    </td>

                    {/* 7. Verification Status */}
                    <td className="p-3 text-center print:border print:border-black">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black text-emerald-800 print:text-black print:border-black">
                          <CheckCircle2 size={11} className="print:hidden" /> VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-800 print:text-black print:border-black">
                          PENDING
                        </span>
                      )}
                      <div className="mt-1 flex items-center justify-center gap-1 print:flex">
                        <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-400" />
                        <span className="text-[9px] text-slate-500 font-bold">Present</span>
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
      <div className="hidden print:flex justify-between items-end pt-12 mt-8 border-t border-black text-xs font-bold text-black px-4">
        <div className="text-center">
          <div className="w-48 border-b border-black mb-1"></div>
          <span>Check-in Officer / Student Volunteer</span>
        </div>

        <div className="text-center">
          <div className="w-48 border-b border-black mb-1"></div>
          <span>Internal SIH Coordinator</span>
        </div>

        <div className="text-center">
          <div className="w-48 border-b border-black mb-1"></div>
          <span>Principal / Head of Institution (Seal)</span>
        </div>
      </div>
    </div>
  );
}
