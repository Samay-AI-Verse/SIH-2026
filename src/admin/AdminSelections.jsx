import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Sparkles, Search, ShieldCheck, Download, AlertCircle, Building, Mail, Phone, Clock } from "lucide-react";
import { adminFetchTeams, fetchProblems, adminVerifyPayment, subscribeTable } from "../services/apiService";
import { SAMPLE_PROBLEMS } from "../utils/constants";
import { downloadCsv, formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function AdminSelections() {
  const [problems, setProblems] = useState(SAMPLE_PROBLEMS);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("SELECTED_ONLY"); // "ALL", "SELECTED_ONLY", "OPEN_INNOVATION"
  const [search, setSearch] = useState("");

  async function load() {
    try {
      const [nextProblems, nextTeams] = await Promise.all([fetchProblems(), adminFetchTeams()]);
      if (nextProblems?.length) setProblems(nextProblems);
      setTeams(nextTeams || []);
    } catch {
      // ignore error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const stops = ["teams", "problems", "payments"].map((table) => subscribeTable(table, () => load()));
    return () => stops.forEach((stop) => stop());
  }, []);

  const openInnoTeams = useMemo(() => {
    return teams.filter((t) => t.is_open_innovation || t.selectedProblemId === "OPEN_INNOVATION");
  }, [teams]);

  const allocation = useMemo(() => {
    return problems
      .filter((p) => p.id !== "OPEN_INNOVATION")
      .map((problem) => {
        const assigned = teams.filter((team) => team.selectedProblemId === problem.id);
        return { problem, teams: assigned };
      });
  }, [problems, teams]);

  const filteredAllocations = useMemo(() => {
    return allocation.filter(({ problem, teams: assigned }) => {
      if (filter === "SELECTED_ONLY" && assigned.length === 0) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesProblem =
          problem.title.toLowerCase().includes(query) ||
          (problem.code || problem.id).toLowerCase().includes(query) ||
          problem.organization.toLowerCase().includes(query);
        const matchesTeam = assigned.some(
          (t) =>
            t.teamName.toLowerCase().includes(query) ||
            t.registrationId.toLowerCase().includes(query) ||
            t.leaderName.toLowerCase().includes(query) ||
            t.college.toLowerCase().includes(query)
        );
        return matchesProblem || matchesTeam;
      }
      return true;
    });
  }, [allocation, filter, search]);

  const handleApprove = async (teamId) => {
    try {
      await adminVerifyPayment(teamId, "SUCCESS", "Approved by Admin for Hackathon Grand Finale");
      await load();
    } catch (err) {
      alert("Failed to approve team: " + (err?.message || "Unknown error"));
    }
  };

  const selectedTeamsCount = teams.filter((t) => t.selectedProblemId).length;
  const confirmedTeamsCount = teams.filter((t) => t.registrationStatus === "CONFIRMED" || t.paymentStatus === "SUCCESS").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-web/20 bg-gold/30 px-3 py-0.5 text-xs font-black text-web">
            <ShieldCheck size={14} /> ADMIN SELECTION & APPROVAL MANAGER
          </div>
          <h1 className="mt-1 font-display text-3xl text-web">Problem Selections & Team Approvals</h1>
          <p className="text-xs font-bold text-ink/70">
            Review problem statements selected by teams, inspect Open Innovation custom ideas, and grant final Hackathon Grand Finale approvals.
          </p>
        </div>

        <Button
          variant="secondary"
          className="shrink-0 text-xs font-black"
          onClick={() =>
            downloadCsv(
              "sih-problem-allocations.csv",
              allocation
                .filter(({ teams: t }) => t.length > 0)
                .map(({ problem, teams: assigned }) => ({
                  problemCode: problem.code || problem.id,
                  problemTitle: problem.title,
                  organization: problem.organization,
                  category: problem.category,
                  teamA_RegId: assigned[0]?.registrationId || "",
                  teamA_Name: assigned[0]?.teamName || "",
                  teamA_College: assigned[0]?.college || "",
                  teamA_Status: assigned[0]?.registrationStatus || "",
                  teamB_RegId: assigned[1]?.registrationId || "",
                  teamB_Name: assigned[1]?.teamName || "",
                  teamB_College: assigned[1]?.college || "",
                  teamB_Status: assigned[1]?.registrationStatus || "",
                }))
            )
          }
        >
          <Download size={14} className="mr-1.5" /> Export Allocations CSV
        </Button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border-2 border-web/20 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-ink/50 uppercase">Total Selections</p>
          <p className="mt-1 font-display text-2xl text-web">{selectedTeamsCount}</p>
          <p className="text-[11px] text-ink/60 mt-0.5">Out of {teams.length} registered teams</p>
        </div>

        <div className="rounded-2xl border-2 border-green-500/30 bg-green-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-green-700 uppercase">Hackathon Approved</p>
          <p className="mt-1 font-display text-2xl text-green-800">{confirmedTeamsCount}</p>
          <p className="text-[11px] text-green-600 mt-0.5">Eligible for Finale</p>
        </div>

        <div className="rounded-2xl border-2 border-amber-500/30 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-amber-700 uppercase">Pending Approval</p>
          <p className="mt-1 font-display text-2xl text-amber-800">{teams.length - confirmedTeamsCount}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Requires Admin Confirmation</p>
        </div>

        <div className="rounded-2xl border-2 border-gold/40 bg-gold/20 p-4 shadow-sm">
          <p className="text-xs font-bold text-web uppercase">Open Innovation</p>
          <p className="mt-1 font-display text-2xl text-web">{openInnoTeams.length}</p>
          <p className="text-[11px] text-ink/60 mt-0.5">Custom Student Ideas</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border-2 border-web/20 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "SELECTED_ONLY", label: "Selected Statements Only" },
            { id: "OPEN_INNOVATION", label: `Open Innovation (${openInnoTeams.length})` },
            { id: "ALL", label: "All 101 Problem Statements" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition ${
                filter === tab.id
                  ? "bg-web text-white shadow-comic"
                  : "bg-ink/5 text-ink/70 hover:bg-gold/30 hover:text-web"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            placeholder="Search problem or team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border-2 border-web/20 bg-cream/50 pl-9 pr-3 py-1.5 text-xs font-bold text-ink focus:border-web focus:outline-none"
          />
        </div>
      </div>

      {/* OPEN INNOVATION SUBMISSIONS SECTION */}
      {filter === "OPEN_INNOVATION" && (
        <div className="space-y-4">
          <h2 className="font-display text-xl text-web flex items-center gap-2">
            <Sparkles className="text-gold" size={20} /> Open Innovation Custom Idea Submissions
          </h2>
          {openInnoTeams.length === 0 ? (
            <p className="text-sm font-bold text-ink/60 py-8 text-center bg-white rounded-2xl border-2 border-dashed border-web/20">
              No teams have selected Open Innovation yet.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {openInnoTeams.map((team) => (
                <div key={team.id} className="rounded-2xl border-3 border-web bg-amber-50/40 p-5 shadow-comic space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-black text-web bg-gold px-2 py-0.5 rounded border border-web">
                        {team.registrationId}
                      </span>
                      <h3 className="font-display text-xl text-web mt-1">{team.teamName}</h3>
                      <p className="text-xs font-bold text-ink/70 flex items-center gap-1 mt-0.5">
                        <Building size={12} /> {team.college}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black border ${
                        team.registrationStatus === "CONFIRMED" || team.paymentStatus === "SUCCESS"
                          ? "border-green-600 bg-green-100 text-green-800"
                          : "border-amber-600 bg-amber-100 text-amber-800"
                      }`}
                    >
                      {team.registrationStatus === "CONFIRMED" || team.paymentStatus === "SUCCESS" ? (
                        <><CheckCircle2 size={12} /> FINALE APPROVED</>
                      ) : (
                        <><Clock size={12} /> PENDING APPROVAL</>
                      )}
                    </span>
                  </div>

                  <div className="rounded-xl border-2 border-web bg-white p-3.5 space-y-1">
                    <p className="text-xs font-black text-web">Project Title:</p>
                    <p className="text-sm font-bold text-ink">
                      {team.open_innovation_title || team.openInnovationTitle || "Custom Project Idea"}
                    </p>
                    {team.open_innovation_description && (
                      <p className="mt-2 text-xs text-ink/80 leading-relaxed whitespace-pre-line border-t border-web/10 pt-2">
                        {team.open_innovation_description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-web/10 text-xs">
                    <div className="space-y-0.5 text-ink/70 font-semibold">
                      <p className="flex items-center gap-1"><Mail size={12} /> {team.email || team.leaderEmail}</p>
                      <p className="flex items-center gap-1"><Phone size={12} /> {team.phone || team.leaderPhone}</p>
                    </div>

                    {team.registrationStatus !== "CONFIRMED" && team.paymentStatus !== "SUCCESS" ? (
                      <button
                        onClick={() => handleApprove(team.id)}
                        className="rounded-xl border-2 border-web bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 shadow-comic transition"
                      >
                        ✓ Approve for Hackathon
                      </button>
                    ) : (
                      <span className="text-xs font-black text-green-700 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Approved by Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STANDARD PROBLEM STATEMENT ALLOCATIONS */}
      {filter !== "OPEN_INNOVATION" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-web">
              Standard Problem Statement Allocations ({filteredAllocations.length})
            </h2>
            <span className="text-xs font-bold text-ink/60">
              Each statement accommodates max 2 teams
            </span>
          </div>

          {filteredAllocations.length === 0 ? (
            <p className="text-sm font-bold text-ink/60 py-10 text-center bg-white rounded-2xl border-2 border-dashed border-web/20">
              No problem statement allocations match your search or filter criteria.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredAllocations.map(({ problem, teams: assigned }) => (
                <div key={problem.id} className="rounded-2xl border-3 border-web bg-white p-5 shadow-comic flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-black text-spidey bg-spidey/10 px-2 py-0.5 rounded border border-spidey/30">
                        {problem.code || problem.id}
                      </span>
                      <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        assigned.length >= 2
                          ? "border-red-600 bg-red-100 text-red-800"
                          : assigned.length === 1
                          ? "border-amber-600 bg-amber-100 text-amber-800"
                          : "border-green-600 bg-green-100 text-green-800"
                      }`}>
                        {assigned.length} / {problem.maxSelections || 2} Teams Claimed
                      </span>
                    </div>

                    <h3 className="font-display text-lg text-web mt-2 line-clamp-2">{problem.title}</h3>
                    <p className="text-xs font-bold text-ink/60 mt-1">{problem.organization} • {problem.category}</p>
                  </div>

                  {/* Assigned Teams Grid */}
                  <div className="space-y-2 border-t-2 border-web/10 pt-3">
                    <p className="text-[11px] font-black text-ink/50 uppercase tracking-wider">Claimed Teams:</p>
                    
                    {assigned.length === 0 ? (
                      <p className="text-xs italic text-ink/40 py-2">No teams have locked this problem statement yet.</p>
                    ) : (
                      assigned.map((team, idx) => (
                        <div key={team.id} className="rounded-xl border-2 border-web/20 bg-cream/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-black text-web bg-gold px-1.5 py-0.2 rounded border border-web">
                                #{idx + 1} {team.registrationId}
                              </span>
                              <p className="font-display text-sm text-web">{team.teamName}</p>
                            </div>
                            <p className="text-xs text-ink/70 font-semibold mt-0.5">{team.college} • Leader: {team.leaderName}</p>
                          </div>

                          <div className="shrink-0">
                            {team.registrationStatus !== "CONFIRMED" && team.paymentStatus !== "SUCCESS" ? (
                              <button
                                onClick={() => handleApprove(team.id)}
                                className="rounded-lg border-2 border-web bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700 transition shadow-sm"
                              >
                                ✓ Approve Team
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-black text-green-700 bg-green-100 border border-green-500 px-2 py-0.5 rounded">
                                <CheckCircle2 size={12} /> APPROVED
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
