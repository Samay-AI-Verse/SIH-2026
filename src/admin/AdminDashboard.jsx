import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminFetchPayments, adminFetchTeams, fetchProblems, subscribeTable } from "../services/apiService";
import { formatINR } from "../utils/cn";

export function AdminDashboard() {
  const [teams, setTeams] = useState([]);
  const [payments, setPayments] = useState([]);
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    async function load() {
      const [nextTeams, nextPayments, nextProblems] = await Promise.all([
        adminFetchTeams(),
        adminFetchPayments(),
        fetchProblems(),
      ]);
      setTeams(nextTeams);
      setPayments(nextPayments);
      setProblems(nextProblems);
    }
    load().catch(() => undefined);
    const stops = ["teams", "payments", "problems"].map((table) => subscribeTable(table, load));
    return () => stops.forEach((stop) => stop());
  }, []);

  const stats = useMemo(() => {
    const confirmed = teams.filter((item) => item.registrationStatus === "CONFIRMED").length;
    const pending = payments.filter((item) => item.status === "PROCESSING" && item.transaction_id).length;
    const failed = payments.filter((item) => item.status === "FAILED").length;
    const revenue = payments.filter((item) => item.status === "SUCCESS").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const selected = teams.filter((item) => item.selectedProblemId).length;
    const available = problems.filter((item) => item.status === "AVAILABLE").length;
    const full = problems.filter((item) => item.status === "FULL").length;
    return { confirmed, pending, failed, revenue, selected, available, full, total: teams.length };
  }, [payments, problems, teams]);

  const registrationSeries = useMemo(() => {
    const map = new Map();
    teams.forEach((team) => {
      const key = team.registeredAt ? new Date(team.registeredAt).toLocaleDateString("en-IN") : "Unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].map(([date, count]) => ({ date, count }));
  }, [teams]);

  const popularity = problems.map((problem) => ({
    name: problem.code || problem.id,
    teams: problem.selectedCount || 0,
  }));

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-4xl text-web comic-pop">Admin dashboard</h1>
        <span className="rounded-full bg-spidey px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">Live</span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total Teams" value={stats.total} />
        <Stat label="Confirmed Teams" value={stats.confirmed} />
        <Stat label="Pending Payments" value={stats.pending} />
        <Stat label="Failed Payments" value={stats.failed} />
        <Stat label="Total Revenue" value={formatINR(stats.revenue)} />
        <Stat label="Problems Selected" value={stats.selected} />
        <Stat label="Available Problems" value={stats.available} />
        <Stat label="Full Problems" value={stats.full} />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Registrations over time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={registrationSeries.length ? registrationSeries : [{ date: "—", count: 0 }]}>
              <CartesianGrid stroke="rgba(28,20,84,0.08)" />
              <XAxis dataKey="date" stroke="#1c1454" />
              <YAxis stroke="#1c1454" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#e11d2e" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Problem popularity">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={popularity}>
              <CartesianGrid stroke="rgba(28,20,84,0.08)" />
              <XAxis dataKey="name" stroke="#1c1454" />
              <YAxis stroke="#1c1454" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="teams" fill="#e11d2e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <article className="shine surface-card p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-ink/50">{label}</p>
      <p className="mt-3 font-display text-3xl text-ink">{value}</p>
    </article>
  );
}
function ChartCard({ title, children }) {
  return (
    <article className="shine surface-card p-5">
      <h2 className="mb-4 text-sm uppercase tracking-[0.18em] text-ink/60">{title}</h2>
      {children}
    </article>
  );
}
