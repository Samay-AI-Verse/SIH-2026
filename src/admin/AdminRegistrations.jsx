import { useEffect, useState } from "react";
import { adminCancelTeam, adminFetchTeams, adminVerifyPayment, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function AdminRegistrations() {
  const [teams, setTeams] = useState([]);

  async function load() {
    setTeams(await adminFetchTeams());
  }

  useEffect(() => {
    load().catch(() => undefined);
    return subscribeTable("teams", () => load().catch(() => undefined));
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-ink">Registrations</h1>
        <Button
          variant="secondary"
          onClick={() =>
            downloadCsv(
              "sih-registrations.csv",
              teams.map((team) => ({
                registrationId: team.registrationId,
                team: team.teamName,
                college: team.college,
                leader: team.leaderName,
                members: team.members?.length || 0,
                female: team.members?.some((member) => member.gender === "Female") ? "Yes" : "No",
                payment: team.paymentStatus,
                registration: team.registrationStatus,
                problem: team.selectedProblemId || "",
                date: formatDate(team.registeredAt),
              }))
            )
          }
        >
          Export CSV
        </Button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-ink/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-[0.14em] text-ink/50">
            <tr>
              {["Registration ID", "Team", "College", "Leader", "Members", "Payment", "Registration", "Problem", "Date", "Actions"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-t border-ink/10">
                <td className="px-4 py-3 text-saffron font-bold">{team.registrationId}</td>
                <td className="px-4 py-3 font-bold text-web">{team.teamName}</td>
                <td className="px-4 py-3">{team.college}</td>
                <td className="px-4 py-3">{team.leaderName}</td>
                <td className="px-4 py-3">{team.members?.length || 0}/6</td>
                <td className="px-4 py-3 font-bold">{team.paymentStatus}</td>
                <td className="px-4 py-3">{team.registrationStatus}</td>
                <td className="px-4 py-3">{team.selectedProblemId || "—"}</td>
                <td className="px-4 py-3">{formatDate(team.registeredAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {team.registrationStatus !== "CONFIRMED" && team.paymentStatus !== "SUCCESS" ? (
                      <button
                        className="rounded-lg border border-web bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700 shadow-sm transition"
                        onClick={() => adminVerifyPayment(team.id, "SUCCESS", "Approved by Admin for Hackathon Finale").then(load)}
                      >
                        ✓ Approve for Hackathon
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-green-100 border border-green-600 px-2 py-0.5 text-xs font-black text-green-800">
                        ✓ APPROVED
                      </span>
                    )}
                    <a className="text-saffron font-bold text-xs hover:underline" href={`mailto:${team.email}`}>
                      Contact
                    </a>
                    <button className="text-rose font-bold text-xs hover:underline" onClick={() => adminCancelTeam(team.id).then(load)}>
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminTeams() {
  return <AdminRegistrations />;
}
