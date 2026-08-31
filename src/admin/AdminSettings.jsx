import { useEffect, useState } from "react";
import { adminFetchTeams, adminUpdateSettings, subscribeTable } from "../services/apiService";
import { useSettings } from "../hooks/useSettings";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";
import { Settings as SettingsIcon, ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, ShieldCheck, IndianRupee } from "lucide-react";

export function AdminSettings() {
  const { settings, reload } = useSettings();
  const [fee, setFee] = useState(String(settings.fee || 300));
  const [active, setActive] = useState(settings.isActive !== false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setFee(String(settings.fee || 300));
    setActive(settings.isActive !== false);
  }, [settings]);

  async function handleSave(e) {
    e?.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await adminUpdateSettings({
        fee: Number(fee) || 300,
        currency: "INR",
        is_active: active,
        isActive: active,
        min_members: 6,
        max_members: 6,
        female_required: true,
      });
      if (reload) reload();
      setMessage("Registration settings updated and applied instantly across the portal.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6 text-left">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-web flex items-center gap-2">
          <SettingsIcon className="text-spidey" size={32} /> Portal & Registration Settings
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
          Configure public team registration availability, registration fees, and tournament constraints.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 text-xs font-bold text-rose-900 flex items-center gap-2 shadow-xs">
          <AlertTriangle size={18} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Public Registration Status Toggle */}
        <div className="rounded-3xl border-3 border-web bg-white p-6 shadow-comic space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Portal Gatekeeper</span>
              <h3 className="font-display text-2xl text-web mt-0.5">Public Team Registrations</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Toggle whether new students and teams can register via the public website.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border ${
                  active
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse"
                    : "bg-rose-100 text-rose-800 border-rose-300"
                }`}
              >
                {active ? "🟢 Registrations OPEN" : "🔴 Registrations CLOSED"}
              </span>

              <button
                type="button"
                onClick={() => setActive(!active)}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  active ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    active ? "translate-x-9 shadow-md" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1">
            <p className="font-bold text-web flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-spidey" />
              {active
                ? "Public registration is currently active. Students can submit team details on /register."
                : "Public registration is closed. The public register form is locked, but Administrators can still register teams via the Admin panel (+ New Registration)."}
            </p>
          </div>
        </div>

        {/* Card 2: Timeline & 2-Day Schedule Management */}
        <div className="rounded-3xl border-3 border-web bg-white p-6 shadow-comic space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Public Website Display</span>
              <h3 className="font-display text-2xl text-web mt-0.5">Hackathon Timeline & Schedule</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Customize rounds, milestones, reporting hours, and push/publish the live 2-day schedule to the website.
              </p>
            </div>

            <a
              href="/admin/timeline"
              className="inline-flex items-center gap-2 rounded-xl bg-spidey px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-web transition shadow-comic shrink-0"
            >
              Manage & Push Timeline
            </a>
          </div>
        </div>

        {/* Card 3: Fee & Rules */}
        <div className="rounded-3xl border-3 border-web bg-white p-6 shadow-comic space-y-4">
          <h3 className="font-display text-2xl text-web">Registration Fee & Currency</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Team Registration Fee (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 pl-8 pr-3 py-2 text-sm font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Required Squad Size
              </label>
              <input
                type="text"
                disabled
                value="Exactly 6 Members (Leader + 5)"
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-web hover:bg-spidey text-white px-8 py-3 text-xs font-black uppercase shadow-comic"
            >
              {saving ? "Saving Settings..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function AdminUsers() {
  const [teams, setTeams] = useState([]);

  async function load() {
    setTeams(await adminFetchTeams());
  }

  useEffect(() => {
    load().catch(() => undefined);
    const stops = ["teams", "members"].map((table) => subscribeTable(table, () => load().catch(() => undefined)));
    return () => stops.forEach((stop) => stop());
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Members</h1>
      <p className="mt-2 text-sm text-ink/60">{teams.length} teams · grouped by squad</p>
      <div className="mt-6 space-y-6">
        {teams.map((team) => {
          const leader = team.members.find((member) => member.isLeader) || {
            name: team.leaderName,
            email: team.email,
            gender: team.leaderGender,
            studentId: "—",
          };
          const others = team.members.filter((member) => !member.isLeader);
          return (
            <article key={team.id} className="overflow-hidden rounded-3xl border-2 border-web bg-white">
              <header className="flex flex-wrap items-center justify-between gap-3 bg-web px-5 py-4 text-white">
                <div>
                  <p className="font-display text-3xl leading-none">{team.teamName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold">
                    {team.registrationId} · {team.college}
                  </p>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/70">
                  {team.members.length}/6 · {team.paymentStatus}
                </p>
              </header>

              <div className="border-b-2 border-gold bg-gold/20 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-spidey">Team leader</p>
                <div className="mt-2 grid gap-1 sm:grid-cols-4">
                  <p className="font-semibold text-ink">{leader.name}</p>
                  <p className="text-sm text-ink/70">{leader.email}</p>
                  <p className="text-sm text-ink/70">{leader.gender || "—"}</p>
                  <p className="text-sm text-ink/70">{leader.studentId || "—"}</p>
                </div>
              </div>

              <div className="px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-web">Team members</p>
                {others.length ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-[0.14em] text-ink/40">
                        <tr>
                          <th className="py-2 pr-4">Name</th>
                          <th className="py-2 pr-4">Email</th>
                          <th className="py-2 pr-4">Gender</th>
                          <th className="py-2">Student ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {others.map((member) => (
                          <tr key={member.id || member.email} className="border-t border-ink/10">
                            <td className="py-2 pr-4 font-medium text-ink">{member.name}</td>
                            <td className="py-2 pr-4 text-ink/70">{member.email}</td>
                            <td className="py-2 pr-4 text-ink/70">{member.gender}</td>
                            <td className="py-2 text-ink/70">{member.studentId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-ink/50">No other members listed.</p>
                )}
              </div>
            </article>
          );
        })}
        {!teams.length ? <p className="text-sm text-ink/50">No teams registered yet.</p> : null}
      </div>
    </div>
  );
}
