import { useEffect, useMemo, useState } from "react";
import { 
  Trophy, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  FileSpreadsheet,
  Crown,
  Eye,
  X
} from "lucide-react";
import { adminFetchTeams, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function AdminFinalTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL"); // "ALL", "OPEN_INNO", "PS_ALLOCATED"
  const [selectedTeamModal, setSelectedTeamModal] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await adminFetchTeams();
      setTeams(data || []);
    } catch (err) {
      console.error("Failed to load final teams:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const unsubscribe = subscribeTable("teams", () => load().catch(() => undefined));
    return () => unsubscribe();
  }, []);

  // Filter ONLY final approved & confirmed teams
  const finalTeams = useMemo(() => {
    return teams.filter((t) => {
      const isConfirmed = t.payment_status === "SUCCESS" || t.registration_status === "CONFIRMED" || t.paymentStatus === "SUCCESS" || t.registrationStatus === "CONFIRMED";
      if (!isConfirmed) return false;

      const isOpenInno = Boolean(t.is_open_innovation || t.isOpenInnovation);
      const hasProb = Boolean((t.selected_problem_id || t.selectedProblemId) && !isOpenInno);

      if (categoryFilter === "OPEN_INNO") return isOpenInno;
      if (categoryFilter === "PS_ALLOCATED") return hasProb;
      return true;
    });
  }, [teams, categoryFilter]);

  // Search filter
  const filteredTeams = useMemo(() => {
    if (!query.trim()) return finalTeams;
    const q = query.toLowerCase().trim();
    return finalTeams.filter((t) => {
      return (
        (t.team_name || t.teamName || "")?.toLowerCase().includes(q) ||
        (t.registration_id || t.registrationId || "")?.toLowerCase().includes(q) ||
        (t.leader_name || t.leaderName || "")?.toLowerCase().includes(q) ||
        (t.leader_email || t.email || "")?.toLowerCase().includes(q) ||
        (t.selected_problem_code || t.selectedProblemCode || "")?.toLowerCase().includes(q) ||
        (t.selected_problem_title || t.selectedProblemTitle || "")?.toLowerCase().includes(q) ||
        (t.open_innovation_title || t.openInnovationTitle || "")?.toLowerCase().includes(q)
      );
    });
  }, [finalTeams, query]);

  // Stats calculation
  const totalMembers = useMemo(() => {
    return finalTeams.reduce((sum, t) => sum + (t.members?.length || 6), 0);
  }, [finalTeams]);

  const openInnoCount = useMemo(() => {
    return finalTeams.filter((t) => Boolean(t.is_open_innovation || t.isOpenInnovation)).length;
  }, [finalTeams]);

  const psAllocatedCount = useMemo(() => {
    return finalTeams.filter((t) => Boolean((t.selected_problem_id || t.selectedProblemId) && !(t.is_open_innovation || t.isOpenInnovation))).length;
  }, [finalTeams]);

  // CSV Export Handler
  function handleExportCsv() {
    if (!finalTeams.length) {
      alert("No final approved teams available to export.");
      return;
    }

    const exportRows = finalTeams.map((t, idx) => {
      const members = t.members || [];
      const leader = members.find((m) => m.is_leader) || members[0] || {};

      const m2 = members[1] || {};
      const m3 = members[2] || {};
      const m4 = members[3] || {};
      const m5 = members[4] || {};
      const m6 = members[5] || {};

      return {
        "S.No": idx + 1,
        "Registration ID": t.registration_id || t.registrationId,
        "Team Name": t.team_name || t.teamName,
        "College / Institution": t.college || "GTMC Nanded",
        "Problem Type": t.is_open_innovation ? "Open Innovation" : "Problem Statement",
        "Problem Code": t.is_open_innovation ? "OPEN-INNO" : (t.selected_problem_code || "N/A"),
        "Problem / Project Title": t.is_open_innovation ? (t.open_innovation_title || "Custom Innovation") : (t.selected_problem_title || "N/A"),
        "Payment Status": t.payment_status || "SUCCESS",
        "Payment Receipt / UTR": t.payment_utr || t.transaction_id || "VERIFIED",
        "Leader Name": t.leader_name || leader.name || leader.full_name || "N/A",
        "Leader Email": t.leader_email || leader.email || "N/A",
        "Leader Phone": t.leader_phone || leader.phone || "N/A",
        "Leader Gender": leader.gender || "N/A",
        "Leader Branch & Year": `${leader.branch || t.leader_branch || ''} - ${leader.year || t.leader_year || ''}`,
        "Member 2 Name": m2.name || m2.full_name || "",
        "Member 2 Gender": m2.gender || "",
        "Member 2 Branch & Year": `${m2.branch || ''} ${m2.year || ''}`.trim(),
        "Member 3 Name": m3.name || m3.full_name || "",
        "Member 3 Gender": m3.gender || "",
        "Member 3 Branch & Year": `${m3.branch || ''} ${m3.year || ''}`.trim(),
        "Member 4 Name": m4.name || m4.full_name || "",
        "Member 4 Gender": m4.gender || "",
        "Member 4 Branch & Year": `${m4.branch || ''} ${m4.year || ''}`.trim(),
        "Member 5 Name": m5.name || m5.full_name || "",
        "Member 5 Gender": m5.gender || "",
        "Member 5 Branch & Year": `${m5.branch || ''} ${m5.year || ''}`.trim(),
        "Member 6 Name": m6.name || m6.full_name || "",
        "Member 6 Gender": m6.gender || "",
        "Member 6 Branch & Year": `${m6.branch || ''} ${m6.year || ''}`.trim(),
        "Total Team Size": members.length || 6,
        "Registration Date": formatDate(t.created_at)
      };
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`SIH2026_Final_Approved_Teams_${timestamp}.csv`, exportRows);
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-0.5 text-xs font-black text-web uppercase tracking-wider">
              <Trophy size={14} className="text-spidey" /> Official Finale Roster
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-web flex items-center gap-2">
            Final Approved Teams
          </h1>
          <p className="text-xs sm:text-sm font-bold text-ink/70">
            Compact table list of confirmed finalist teams. Click any team row to inspect full roster details.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={load}
            variant="secondary"
            className="flex items-center gap-1.5 py-2.5 px-4 text-xs font-black uppercase"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>

          <Button
            onClick={handleExportCsv}
            className="flex items-center gap-2 py-2.5 px-5 text-xs sm:text-sm font-black uppercase bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-comic border-2 border-emerald-800"
          >
            <FileSpreadsheet size={16} /> Export Excel / CSV
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border-2 sm:border-3 border-web bg-gold/20 p-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-web">Confirmed Teams</p>
          <p className="font-display text-3xl sm:text-4xl text-web">{finalTeams.length}</p>
        </div>

        <div className="rounded-2xl border-2 sm:border-3 border-web bg-emerald-100 p-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-900">Total Participants</p>
          <p className="font-display text-3xl sm:text-4xl text-emerald-900">{totalMembers}</p>
        </div>

        <div className="rounded-2xl border-2 sm:border-3 border-web bg-sky-100 p-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-sky-900">Problem Allocated</p>
          <p className="font-display text-3xl sm:text-4xl text-sky-900">{psAllocatedCount}</p>
        </div>

        <div className="rounded-2xl border-2 sm:border-3 border-web bg-spidey/10 p-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-spidey">Open Innovation</p>
          <p className="font-display text-3xl sm:text-4xl text-spidey">{openInnoCount}</p>
        </div>
      </div>

      {/* Controls & Search Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border-2 border-web/20 bg-white p-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by team name, leader, reg ID, or problem code..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-web/20 bg-slate-50 pl-9 pr-4 py-2 text-xs font-bold text-ink placeholder:text-slate-400 focus:border-web focus:bg-white focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black">
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
              categoryFilter === "ALL"
                ? "bg-web text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All ({finalTeams.length})
          </button>

          <button
            onClick={() => setCategoryFilter("PS_ALLOCATED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
              categoryFilter === "PS_ALLOCATED"
                ? "bg-spidey text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Problem Statement ({psAllocatedCount})
          </button>

          <button
            onClick={() => setCategoryFilter("OPEN_INNO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
              categoryFilter === "OPEN_INNO"
                ? "bg-gold text-web shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Open Innovation ({openInnoCount})
          </button>
        </div>
      </div>

      {/* COMPACT TABLE LIST VIEW */}
      <div className="overflow-hidden rounded-3xl border-3 border-web bg-white shadow-comic">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-web text-white font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">Registration & Team</th>
                <th className="p-3.5">Institution / College</th>
                <th className="p-3.5">Problem Type & Code</th>
                <th className="p-3.5">Allocated Project / Problem Title</th>
                <th className="p-3.5">Team Leader</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-semibold">
              {filteredTeams.map((team, idx) => {
                const members = team.members || [];
                const leader = members.find((m) => m.is_leader) || members[0] || {};
                const isOpenInno = Boolean(team.is_open_innovation);
                const probTitle = isOpenInno
                  ? team.open_innovation_title || "Custom Open Innovation Project"
                  : team.selected_problem_title || "Allocated Problem Statement";

                return (
                  <tr key={team.id || idx} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-400">{idx + 1}</td>

                    {/* Reg ID & Team Name */}
                    <td className="p-3.5">
                      <div>
                        <span className="font-mono text-[10px] font-black text-spidey bg-spidey/10 px-1.5 py-0.5 rounded">
                          {team.registration_id || team.registrationId || "CONFIRMED"}
                        </span>
                        <h4 className="font-display text-base text-web leading-tight mt-0.5">
                          {team.team_name || team.teamName}
                        </h4>
                      </div>
                    </td>

                    {/* Institution */}
                    <td className="p-3.5 font-bold text-slate-700">
                      {team.college || "GTMC Nanded"}
                    </td>

                    {/* Problem Type & Code */}
                    <td className="p-3.5">
                      {isOpenInno ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-gold text-web px-2 py-0.5 rounded border border-web/20">
                          <Sparkles size={11} /> OPEN INNOVATION
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-black uppercase bg-spidey text-white px-2 py-0.5 rounded">
                          {team.selected_problem_code || "STATEMENT"}
                        </span>
                      )}
                    </td>

                    {/* Title */}
                    <td className="p-3.5">
                      <p className="font-bold text-xs text-web line-clamp-2 max-w-xs leading-snug">
                        {probTitle}
                      </p>
                    </td>

                    {/* Team Leader Contact */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1">
                        <Crown size={12} className="text-gold shrink-0" />
                        <span className="font-bold text-web">{leader.name || team.leader_name || "Leader"}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {leader.phone || team.leader_phone || leader.email || "No phone"}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedTeamModal(team)}
                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-web/30 bg-gold/20 hover:bg-gold px-3 py-1.5 text-xs font-black uppercase text-web transition shadow-xs"
                      >
                        <Eye size={13} /> Full Roster ({members.length})
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!filteredTeams.length && !loading && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500 font-bold">
                    No final approved teams found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL TEAM ROSTER INSPECTION MODAL */}
      {selectedTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border-4 border-web bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            <button
              onClick={() => setSelectedTeamModal(null)}
              className="absolute right-4 top-4 rounded-full border-2 border-web bg-slate-100 p-2 text-ink hover:bg-spidey hover:text-white transition"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="border-b border-slate-200 pb-3 mb-4">
              <span className="font-mono text-xs font-black text-spidey bg-spidey/10 px-2.5 py-0.5 rounded-md">
                {selectedTeamModal.registration_id}
              </span>
              <h3 className="font-display text-3xl text-web mt-1">
                {selectedTeamModal.team_name}
              </h3>
              <p className="text-xs font-bold text-slate-600">
                {selectedTeamModal.college || "GTMC Nanded"}
              </p>
            </div>

            {/* Problem Info */}
            <div className="rounded-2xl bg-gold/20 border-2 border-web/30 p-4 mb-4">
              <span className="text-[10px] font-black uppercase text-web block mb-1">
                {selectedTeamModal.is_open_innovation ? "Open Innovation Project Title" : "Allocated Problem Statement Title"}
              </span>
              <p className="font-bold text-sm text-web">
                {selectedTeamModal.is_open_innovation
                  ? selectedTeamModal.open_innovation_title || "Custom Open Innovation Project"
                  : selectedTeamModal.selected_problem_title}
              </p>
              {selectedTeamModal.selected_problem_code && !selectedTeamModal.is_open_innovation && (
                <span className="inline-block mt-2 font-mono font-black text-xs bg-spidey text-white px-2.5 py-0.5 rounded">
                  CODE: {selectedTeamModal.selected_problem_code}
                </span>
              )}
            </div>

            {/* Full Roster Table */}
            <div className="space-y-2">
              <h4 className="font-display text-lg text-web">Full 6-Member Team Roster</h4>
              <div className="overflow-hidden rounded-2xl border-2 border-web/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-web text-white font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Member Name</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">Branch & Year</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white font-semibold">
                    {selectedTeamModal.members?.map((mem, idx) => (
                      <tr key={mem.id || idx} className={mem.is_leader ? "bg-gold/15" : ""}>
                        <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-web">{mem.name || mem.full_name}</td>
                        <td className="p-3">
                          {mem.is_leader ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-gold px-2 py-0.5 rounded">
                              <Crown size={10} /> LEADER
                            </span>
                          ) : (
                            <span className="text-slate-500 font-bold">MEMBER</span>
                          )}
                        </td>
                        <td className="p-3 font-bold">
                          <span className={mem.gender === "Female" ? "text-pink-600" : "text-blue-600"}>
                            {mem.gender || "Male"}
                          </span>
                        </td>
                        <td className="p-3">{[mem.branch, mem.year].filter(Boolean).join(" • ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-200 flex justify-end">
              <Button
                onClick={() => setSelectedTeamModal(null)}
                className="py-2 px-6 text-xs font-black uppercase bg-web text-white"
              >
                Close Roster
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
