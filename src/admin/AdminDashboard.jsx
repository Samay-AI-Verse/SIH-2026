import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, GraduationCap, IndianRupee, ArrowDownRight, Wallet, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import { adminFetchPayments, adminFetchTeams, fetchProblems, adminFetchStats, adminFetchBudget, subscribeTable } from "../services/apiService";
import { formatINR } from "../utils/cn";

export function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [payments, setPayments] = useState([]);
  const [problems, setProblems] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [budget, setBudget] = useState(null);

  useEffect(() => {
    async function load() {
      const [nextTeams, nextPayments, nextProblems, statsData, budgetData] = await Promise.all([
        adminFetchTeams().catch(() => []),
        adminFetchPayments().catch(() => []),
        fetchProblems().catch(() => []),
        adminFetchStats().catch(() => null),
        adminFetchBudget().catch(() => null),
      ]);
      setTeams(nextTeams || []);
      setPayments(nextPayments || []);
      setProblems(nextProblems || []);
      setServerStats(statsData);
      setBudget(budgetData);
    }
    load().catch(() => undefined);
    const stops = ["teams", "payments", "problems"].map((table) => subscribeTable(table, load));
    return () => stops.forEach((stop) => stop());
  }, []);

  const stats = useMemo(() => {
    const totalTeams = serverStats?.total_teams ?? teams.length;
    // Calculate total candidate students: total members across all teams
    const totalCandidates = serverStats?.total_candidates ?? teams.reduce((sum, t) => sum + (t.members?.length || 0), 0);
    const confirmed = serverStats?.paid_teams ?? teams.filter((item) => item.registrationStatus === "CONFIRMED" || item.paymentStatus === "SUCCESS").length;
    const pending = serverStats?.pending_teams ?? payments.filter((item) => item.status === "PROCESSING" || item.status === "PENDING").length;
    const revenue = serverStats?.total_revenue ?? budget?.total_revenue ?? payments.filter((item) => item.status === "SUCCESS").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expenses = serverStats?.total_expenses ?? budget?.total_expenses ?? 0;
    const netBalance = serverStats?.net_balance ?? budget?.net_balance ?? (revenue - expenses);
    const selected = serverStats?.selected_problems_count ?? teams.filter((item) => item.selectedProblemId).length;
    const available = problems.filter((item) => item.status === "AVAILABLE" && item.id !== "OPEN_INNOVATION").length;

    return { totalTeams, totalCandidates, confirmed, pending, revenue, expenses, netBalance, selected, available };
  }, [teams, payments, problems, serverStats, budget]);

  const registrationSeries = useMemo(() => {
    const map = new Map();
    teams.forEach((team) => {
      const key = team.registeredAt ? new Date(team.registeredAt).toLocaleDateString("en-IN") : "Unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([date, count]) => ({ date, count }));
  }, [teams]);

  const popularity = useMemo(() => {
    return problems
      .filter((p) => p.id !== "OPEN_INNOVATION")
      .map((problem) => ({
        name: problem.code || problem.id,
        teams: problem.selectedCount || 0,
      }))
      .slice(0, 12);
  }, [problems]);

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl text-web comic-pop">Organizer Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-spidey px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              REAL-TIME DATA LIVE
            </span>
          </div>
          <p className="mt-1 text-xs font-bold text-ink/70">
            Real-time synchronization for candidate participants, confirmed teams, fees revenue collection, and event expenditure ledger.
          </p>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="Total Registered Candidates"
          value={stats.totalCandidates}
          subtext={`${stats.totalTeams} Registered Teams`}
          accent="border-web bg-white text-web"
        />
        <StatCard
          icon={ShieldCheck}
          label="Confirmed & Approved Teams"
          value={stats.confirmed}
          subtext="Eligible for Hackathon Finale"
          accent="border-emerald-600 bg-emerald-50 text-emerald-800"
        />
        <StatCard
          icon={IndianRupee}
          label="Total Fees Collected"
          value={formatINR(stats.revenue)}
          subtext="Online UPI + Offline Cash"
          accent="border-emerald-700 bg-emerald-600 text-white"
        />
        <StatCard
          icon={ArrowDownRight}
          label="Total Spent Money (Expenses)"
          value={formatINR(stats.expenses)}
          subtext="Recorded Operational Expenses"
          accent="border-rose-600 bg-rose-50 text-rose-800"
        />
        <StatCard
          icon={Wallet}
          label="Net Available Budget"
          value={formatINR(stats.netBalance)}
          subtext="Revenue - Spent Expenses"
          accent="border-amber-600 bg-gold/20 text-web"
        />
        <StatCard
          icon={Clock}
          label="Pending Payments Verification"
          value={stats.pending}
          subtext="Awaiting Admin Review"
          accent="border-amber-500 bg-amber-50 text-amber-900"
        />
        <StatCard
          icon={Users}
          label="Problems Selected"
          value={stats.selected}
          subtext={`Out of ${stats.totalTeams} teams`}
          accent="border-blue-600 bg-blue-50 text-blue-900"
        />
        <StatCard
          icon={AlertCircle}
          label="Available Problem Statements"
          value={stats.available}
          subtext="Open for Team Selection"
          accent="border-purple-600 bg-purple-50 text-purple-900"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Registrations Growth Over Time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={registrationSeries.length ? registrationSeries : [{ date: "Today", count: 0 }]}>
              <CartesianGrid stroke="rgba(28,20,84,0.08)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#071433" fontSize={11} fontWeight={600} />
              <YAxis stroke="#071433" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#071433", borderRadius: "12px", color: "#fff", border: "2px solid #e11d2e" }}
                itemStyle={{ color: "#ffd700", fontWeight: "bold" }}
              />
              <Line type="monotone" dataKey="count" stroke="#e11d2e" strokeWidth={3.5} dot={{ fill: "#ffd700", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Problem Statement Popularity Breakdown">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={popularity.length ? popularity : [{ name: "SIH001", teams: 0 }]}>
              <CartesianGrid stroke="rgba(28,20,84,0.08)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#071433" fontSize={11} fontWeight={600} />
              <YAxis stroke="#071433" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#071433", borderRadius: "12px", color: "#fff", border: "2px solid #ffd700" }}
                itemStyle={{ color: "#ffd700", fontWeight: "bold" }}
              />
              <Bar dataKey="teams" fill="#071433" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, accent }) {
  return (
    <article className={`rounded-2xl border-3 p-5 shadow-[4px_4px_0_#071433] transition hover:-translate-y-0.5 ${accent}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{label}</p>
        {Icon && <Icon size={20} className="shrink-0 opacity-80" />}
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {subtext && <p className="mt-1 text-[11px] font-bold opacity-75">{subtext}</p>}
    </article>
  );
}

function ChartCard({ title, children }) {
  return (
    <article className="rounded-3xl border-3 border-web bg-white p-5 shadow-[6px_6px_0_#071433]">
      <h2 className="mb-4 font-display text-lg text-web">{title}</h2>
      {children}
    </article>
  );
}

