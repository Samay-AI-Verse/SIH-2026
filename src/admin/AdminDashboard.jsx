import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, GraduationCap, IndianRupee, ArrowDownRight, Wallet, ShieldCheck, Clock, AlertCircle, Calendar, Filter } from "lucide-react";
import { adminFetchPayments, adminFetchTeams, fetchProblems, adminFetchStats, adminFetchBudget, adminFetchDailyAnalytics, subscribeTable } from "../services/apiService";
import { formatINR, formatDate, formatDateOnly } from "../utils/cn";

export function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [payments, setPayments] = useState([]);
  const [problems, setProblems] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [budget, setBudget] = useState(null);
  const [dailyAnalytics, setDailyAnalytics] = useState(null);
  const [dateFilter, setDateFilter] = useState("ALL"); // ALL, TODAY, LAST7, LAST30

  useEffect(() => {
    async function load() {
      const [nextTeams, nextPayments, nextProblems, statsData, budgetData, dailyData] = await Promise.all([
        adminFetchTeams().catch(() => []),
        adminFetchPayments().catch(() => []),
        fetchProblems().catch(() => []),
        adminFetchStats().catch(() => null),
        adminFetchBudget().catch(() => null),
        adminFetchDailyAnalytics().catch(() => null),
      ]);
      setTeams(nextTeams || []);
      setPayments(nextPayments || []);
      setProblems(nextProblems || []);
      setServerStats(statsData);
      setBudget(budgetData);
      setDailyAnalytics(dailyData);
    }
    load().catch(() => undefined);
    const stops = ["teams", "payments", "problems"].map((table) => subscribeTable(table, load));
    return () => stops.forEach((stop) => stop());
  }, []);

  const stats = useMemo(() => {
    const totalTeams = serverStats?.total_teams ?? teams.length;
    const totalCandidates = serverStats?.total_candidates ?? teams.reduce((sum, t) => sum + (t.members?.length || 6), 0);
    const confirmed = serverStats?.paid_teams ?? teams.filter((item) => item.registrationStatus === "CONFIRMED" || item.paymentStatus === "SUCCESS").length;
    const pending = serverStats?.pending_teams ?? payments.filter((item) => item.status === "PROCESSING" || item.status === "PENDING").length;
    const revenue = confirmed * 300;
    const expenses = serverStats?.total_expenses ?? budget?.total_expenses ?? 0;
    const netBalance = revenue - expenses;
    const selected = serverStats?.selected_problems_count ?? teams.filter((item) => item.selectedProblemId).length;
    const available = problems.filter((item) => item.status === "AVAILABLE" && item.id !== "OPEN_INNOVATION").length;

    return { totalTeams, totalCandidates, confirmed, pending, revenue, expenses, netBalance, selected, available };
  }, [teams, payments, problems, serverStats, budget]);

  // Date-wise analytics breakdown with filtering
  const filteredDailyBreakdown = useMemo(() => {
    const rawList = dailyAnalytics?.daily_breakdown || [];
    if (!rawList.length && teams.length) {
      // Fallback calculation from teams
      const dateMap = {};
      teams.forEach((t) => {
        const rawDate = t.registeredAt || t.registered_at || t.created_at || "Unknown";
        const dateStr = rawDate && rawDate.length >= 10 ? rawDate.slice(0, 10) : "Unknown";
        if (!dateMap[dateStr]) {
          dateMap[dateStr] = { date: dateStr, teams_count: 0, students_count: 0, confirmed_teams: 0, pending_teams: 0 };
        }
        dateMap[dateStr].teams_count += 1;
        dateMap[dateStr].students_count += t.members?.length || 6;
        if (t.registrationStatus === "CONFIRMED" || t.paymentStatus === "SUCCESS") {
          dateMap[dateStr].confirmed_teams += 1;
        } else {
          dateMap[dateStr].pending_teams += 1;
        }
      });
      const list = Object.values(dateMap).sort((a, b) => b.date.localeCompare(a.date));
      return applyDateFilter(list, dateFilter);
    }
    return applyDateFilter(rawList, dateFilter);
  }, [dailyAnalytics, teams, dateFilter]);

  function applyDateFilter(list, filter) {
    if (filter === "ALL") return list;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (filter === "TODAY") {
      return list.filter((item) => item.date === todayStr);
    }

    const pastDate = new Date();
    if (filter === "LAST7") pastDate.setDate(now.getDate() - 7);
    else if (filter === "LAST30") pastDate.setDate(now.getDate() - 30);
    const limitStr = pastDate.toISOString().slice(0, 10);

    return list.filter((item) => item.date >= limitStr);
  }

  // Summary counts for filtered dates
  const filteredDailyStats = useMemo(() => {
    const totalTeams = filteredDailyBreakdown.reduce((sum, d) => sum + (d.teams_count || 0), 0);
    const totalStudents = filteredDailyBreakdown.reduce((sum, d) => sum + (d.students_count || 0), 0);
    const confirmedTeams = filteredDailyBreakdown.reduce((sum, d) => sum + (d.confirmed_teams || 0), 0);
    const pendingTeams = filteredDailyBreakdown.reduce((sum, d) => sum + (d.pending_teams || 0), 0);
    return { totalTeams, totalStudents, confirmedTeams, pendingTeams };
  }, [filteredDailyBreakdown]);

  const registrationSeries = useMemo(() => {
    return filteredDailyBreakdown
      .map((item) => ({
        date: formatDateOnly(item.date),
        teams: item.teams_count,
        students: item.students_count,
      }))
      .reverse();
  }, [filteredDailyBreakdown]);

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
            Real-time synchronization for candidate participants, confirmed teams, fees revenue collection, and date-wise registration analytics.
          </p>
        </div>

        <a
          href="/admin/checkin"
          className="rounded-2xl border-2 border-spidey bg-spidey px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-spidey/90 transition shadow-comic flex items-center justify-center gap-2 self-start sm:self-auto shrink-0"
        >
          <span>🎒 Event Day Check-in & Goodies Desk</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">LIVE</span>
        </a>
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

      {/* SECTION: DATE-WISE REGISTRATION ANALYTICS & ROSTER BREAKDOWN */}
      <div className="rounded-3xl border-3 border-web bg-white p-5 shadow-[6px_6px_0_#071433] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="font-display text-2xl text-web flex items-center gap-2">
              <Calendar className="text-spidey" size={24} /> Date-Wise Registration Analytics & Daily Trends
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Track exactly when and how many students & teams registered each day ("Kab and roj kitne candidates register hue").
            </p>
          </div>

          {/* Date Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "All Time" },
              { id: "TODAY", label: "Today" },
              { id: "LAST7", label: "Last 7 Days" },
              { id: "LAST30", label: "Last 30 Days" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id)}
                className={`rounded-xl px-3 py-1 text-xs font-black uppercase transition ${
                  dateFilter === tab.id
                    ? "bg-web text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-gold/30 hover:text-web"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border-2 border-web bg-amber-50 p-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Teams Registered</p>
            <p className="font-display text-2xl sm:text-3xl text-web">{filteredDailyStats.totalTeams}</p>
          </div>
          <div className="rounded-2xl border-2 border-web bg-gold/20 p-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-web font-extrabold">Students Registered</p>
            <p className="font-display text-2xl sm:text-3xl text-web">{filteredDailyStats.totalStudents}</p>
          </div>
          <div className="rounded-2xl border-2 border-web bg-emerald-50 p-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Confirmed Paid Teams</p>
            <p className="font-display text-2xl sm:text-3xl text-emerald-700">{filteredDailyStats.confirmedTeams}</p>
          </div>
          <div className="rounded-2xl border-2 border-web bg-amber-100 p-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-900">Pending Verification</p>
            <p className="font-display text-2xl sm:text-3xl text-amber-900">{filteredDailyStats.pendingTeams}</p>
          </div>
        </div>

        {/* Date-Wise Breakdown Table */}
        <div className="overflow-x-auto rounded-2xl border-2 border-web/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-web text-white font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Registration Date</th>
                <th className="p-3">Teams Count</th>
                <th className="p-3">Total Students Count</th>
                <th className="p-3">Confirmed Teams</th>
                <th className="p-3">Pending Teams</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-semibold">
              {filteredDailyBreakdown.map((row) => (
                <tr key={row.date} className="hover:bg-amber-50/50 transition">
                  <td className="p-3 font-mono font-bold text-web text-xs flex items-center gap-2">
                    <Calendar size={14} className="text-spidey" />
                    {formatDateOnly(row.date)} ({row.date})
                  </td>
                  <td className="p-3 font-bold text-slate-800">
                    <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 font-mono font-black text-web">
                      {row.teams_count} Teams
                    </span>
                  </td>
                  <td className="p-3 font-bold text-web">
                    <span className="rounded bg-gold/20 px-2 py-0.5 font-mono font-black text-web">
                      {row.students_count} Candidates
                    </span>
                  </td>
                  <td className="p-3 font-bold text-emerald-700">
                    {row.confirmed_teams} Confirmed
                  </td>
                  <td className="p-3 font-bold text-amber-700">
                    {row.pending_teams} Pending
                  </td>
                </tr>
              ))}

              {!filteredDailyBreakdown.length && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 font-bold">
                    No registrations recorded for the selected date filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Daily Student & Team Registration Trends">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={registrationSeries.length ? registrationSeries : [{ date: "Today", teams: 0, students: 0 }]}>
              <CartesianGrid stroke="rgba(28,20,84,0.08)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#071433" fontSize={11} fontWeight={600} />
              <YAxis stroke="#071433" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#071433", borderRadius: "12px", color: "#fff", border: "2px solid #e11d2e" }}
                itemStyle={{ color: "#ffd700", fontWeight: "bold" }}
              />
              <Line type="monotone" dataKey="students" name="Students" stroke="#e11d2e" strokeWidth={3.5} dot={{ fill: "#ffd700", r: 5 }} />
              <Line type="monotone" dataKey="teams" name="Teams" stroke="#071433" strokeWidth={2.5} dot={{ fill: "#071433", r: 4 }} />
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


