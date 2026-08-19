import { useEffect, useState, useMemo } from "react";
import { Puzzle, Lock, Unlock, Search, Filter, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { adminSetProblemStatus, fetchProblems, adminFetchProblemsAnalytics } from "../services/apiService";
import { Skeleton } from "../components/ui/Skeleton";

export function AdminProblems() {
  const [problems, setProblems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("PROBLEMS"); // PROBLEMS / OPEN_INNOVATION

  async function loadData() {
    setLoading(true);
    try {
      const [items, stats] = await Promise.all([
        fetchProblems().catch(() => []),
        adminFetchProblemsAnalytics().catch(() => null)
      ]);
      setProblems(items || []);
      setAnalytics(stats);
    } catch (err) {
      console.error("Failed to load problem statements data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (p.id === "OPEN_INNOVATION") return false;

      const matchesSearch =
        !search ||
        (p.code || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.organization || "").toLowerCase().includes(search.toLowerCase());

      const count = p.selectedCount || 0;
      const max = p.maxSelections || 2;

      let matchesStatus = true;
      if (statusFilter === "LOCKED") matchesStatus = count >= max || p.status === "LOCKED";
      else if (statusFilter === "PARTIAL") matchesStatus = count > 0 && count < max;
      else if (statusFilter === "AVAILABLE") matchesStatus = count === 0 && p.status !== "LOCKED";

      return matchesSearch && matchesStatus;
    });
  }, [problems, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-web flex items-center gap-2">
            <Puzzle className="text-spidey" size={36} /> Problem Statement Quota & Allocations
          </h1>
          <p className="text-xs sm:text-sm font-bold text-ink/70">
            Monitor national problem statements quota (max 2 teams per problem) and manage Open Innovation project submissions.
          </p>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border-2 border-web bg-white p-4 text-center shadow-[4px_4px_0_#071433]">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Statements</p>
          <p className="mt-1 font-display text-3xl text-web">{analytics?.total_problems || problems.length - 1}</p>
        </div>
        <div className="rounded-2xl border-2 border-web bg-rose-50 p-4 text-center shadow-[4px_4px_0_#071433]">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-700">Locked (2/2 Full)</p>
          <p className="mt-1 font-display text-3xl text-rose-700">{analytics?.locked_count || 0}</p>
        </div>
        <div className="rounded-2xl border-2 border-web bg-amber-50 p-4 text-center shadow-[4px_4px_0_#071433]">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Partially Filled (1/2)</p>
          <p className="mt-1 font-display text-3xl text-amber-700">{analytics?.partial_count || 0}</p>
        </div>
        <div className="rounded-2xl border-2 border-web bg-emerald-50 p-4 text-center shadow-[4px_4px_0_#071433]">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Available (0/2)</p>
          <p className="mt-1 font-display text-3xl text-emerald-700">{analytics?.available_count || 0}</p>
        </div>
        <div className="rounded-2xl border-2 border-web bg-gold/30 p-4 text-center shadow-[4px_4px_0_#071433] col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-web font-extrabold">Open Innovation</p>
          <p className="mt-1 font-display text-3xl text-web">{analytics?.open_innovation_count || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-web/20">
        <button
          onClick={() => setActiveTab("PROBLEMS")}
          className={`px-5 py-2.5 font-display text-xl tracking-wide transition border-b-4 ${
            activeTab === "PROBLEMS"
              ? "border-spidey text-spidey font-bold"
              : "border-transparent text-slate-500 hover:text-web"
          }`}
        >
          SIH Problem Statements ({problems.length - 1})
        </button>
        <button
          onClick={() => setActiveTab("OPEN_INNOVATION")}
          className={`px-5 py-2.5 font-display text-xl tracking-wide transition border-b-4 ${
            activeTab === "OPEN_INNOVATION"
              ? "border-spidey text-spidey font-bold"
              : "border-transparent text-slate-500 hover:text-web"
          }`}
        >
          Open Innovation Submissions ({analytics?.open_innovation_count || 0})
        </button>
      </div>

      {activeTab === "PROBLEMS" ? (
        <>
          {/* Controls */}
          <div className="rounded-2xl border-3 border-web bg-white p-4 shadow-[4px_4px_0_#071433] space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by Problem Code, Title, or Ministry..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border-2 border-web/30 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border-2 border-web/30 bg-slate-50 px-3 py-2.5 text-xs font-bold text-ink focus:border-web focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="LOCKED">Locked (2/2 Quota Full)</option>
                  <option value="PARTIAL">Partially Filled (1/2)</option>
                  <option value="AVAILABLE">Available (0/2)</option>
                </select>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {loading ? (
              <Skeleton className="h-20 w-full rounded-2xl" />
            ) : filteredProblems.length === 0 ? (
              <div className="rounded-2xl border-3 border-web bg-white p-8 text-center text-slate-500 font-bold">
                No problem statements found matching your criteria.
              </div>
            ) : (
              filteredProblems.map((problem) => {
                const count = problem.selectedCount || 0;
                const max = problem.maxSelections || 2;
                const isLocked = count >= max || problem.status === "LOCKED";
                const isPartial = count > 0 && count < max;

                return (
                  <article
                    key={problem.id}
                    className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border-3 p-4 transition shadow-[4px_4px_0_#071433] ${
                      isLocked
                        ? "border-rose-300 bg-rose-50/60"
                        : isPartial
                        ? "border-amber-300 bg-amber-50/60"
                        : "border-web bg-white"
                    }`}
                  >
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-web/20 bg-web/10 px-2 py-0.5 font-mono text-xs font-black text-web">
                          {problem.code || problem.id}
                        </span>
                        {problem.organization && (
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {problem.organization}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 font-bold text-ink text-base">{problem.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs font-bold text-slate-600">
                        <span>Category: {problem.category || "Software"}</span>
                        <span>•</span>
                        <span className="font-mono text-spidey">{count}/{max} Teams Allocated</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-black text-white uppercase">
                          <Lock size={12} /> QUOTA LOCKED ({count}/{max})
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white uppercase">
                          <AlertCircle size={12} /> 1 SPOT LEFT ({count}/{max})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white uppercase">
                          <CheckCircle2 size={12} /> AVAILABLE ({count}/{max})
                        </span>
                      )}

                      <button
                        onClick={async () => {
                          const nextStatus = isLocked ? "AVAILABLE" : "LOCKED";
                          await adminSetProblemStatus(problem.id, nextStatus);
                          await loadData();
                        }}
                        className={`rounded-xl border-2 border-web px-3 py-1.5 text-xs font-black uppercase transition ${
                          isLocked
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-600 hover:text-white"
                            : "bg-rose-100 text-rose-800 hover:bg-rose-600 hover:text-white"
                        }`}
                      >
                        {isLocked ? "Manual Unlock" : "Manual Lock"}
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Open Innovation Submissions Tab */
        <div className="space-y-4">
          <div className="rounded-2xl border-3 border-web bg-gold/20 p-4 font-bold text-web text-sm">
            💡 <strong>Open Innovation Overview:</strong> Student teams can submit their custom ideas under Open Innovation if they prefer building custom solutions outside standard published problem statements.
          </div>

          {!analytics?.open_innovation_projects || analytics.open_innovation_projects.length === 0 ? (
            <div className="rounded-2xl border-3 border-web bg-white p-12 text-center text-slate-500 font-bold">
              No Open Innovation projects registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.open_innovation_projects.map((proj) => (
                <div key={proj.team_id} className="rounded-2xl border-3 border-web bg-white p-5 shadow-[4px_4px_0_#071433]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-web uppercase tracking-wider">Team: {proj.team_name}</span>
                    <span className="rounded bg-gold px-2 py-0.5 text-[10px] font-black uppercase text-ink">
                      Open Innovation
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-2xl text-web">{proj.title}</h3>
                  {proj.description && <p className="mt-1 text-xs text-ink/75 leading-relaxed">{proj.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
