import { useEffect, useState } from "react";
import { adminFetchTeams, adminUpdateSettings, subscribeTable } from "../services/apiService";
import { useSettings } from "../hooks/useSettings";
import { Button } from "../components/ui/Button";
import { Field, TextInput } from "../components/ui/Field";

export function AdminSettings() {
  const { settings } = useSettings();
  const [fee, setFee] = useState(String(settings.fee));
  const [active, setActive] = useState(settings.isActive);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setFee(String(settings.fee));
    setActive(settings.isActive);
  }, [settings]);

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl text-ink">Settings</h1>
      <form
        className="mt-6 space-y-4 surface-card p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          await adminUpdateSettings({ fee: Number(fee), currency: "INR", is_active: active, min_members: 6, max_members: 6, female_required: true });
          setMessage("Registration settings updated.");
        }}
      >
        <Field label="Registration fee">
          <TextInput value={fee} onChange={(e) => setFee(e.target.value)} />
        </Field>
        <label className="flex items-center gap-3 text-sm text-ink/70">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Registration active
        </label>
        <Button type="submit">Save settings</Button>
        {message ? <p className="text-sm text-web">{message}</p> : null}
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
