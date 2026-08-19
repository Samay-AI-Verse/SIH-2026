import { useEffect, useMemo, useState } from "react";
import { adminFetchPayments, adminFetchTeams, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate, formatINR } from "../utils/cn";
import { Button } from "../components/ui/Button";

function decisionLabel(status) {
  if (status === "SUCCESS") return "ACCEPTED";
  if (status === "FAILED") return "REJECTED";
  return status;
}

function DecisionTable({ rows, teams }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-ink/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white text-xs uppercase tracking-[0.14em] text-ink/50">
          <tr>
            {["Registration ID", "Team", "College", "Leader", "Contact", "UTR", "Amount", "Date"].map((heading) => (
              <th key={heading} className="px-4 py-3">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const team = teams.find((row) => row.id === item.team_id);
            return (
              <tr key={item.id} className="border-t border-ink/10">
                <td className="px-4 py-3 text-saffron">{item.registration_id}</td>
                <td className="px-4 py-3">{item.team_name}</td>
                <td className="px-4 py-3">{team?.college || "—"}</td>
                <td className="px-4 py-3">{team?.leaderName || "—"}</td>
                <td className="px-4 py-3">
                  {team?.email || "—"}
                  <span className="block text-xs text-ink/50">{team?.phone || ""}</span>
                </td>
                <td className="px-4 py-3">{item.transaction_id || "—"}</td>
                <td className="px-4 py-3">{formatINR(item.amount, item.currency)}</td>
                <td className="px-4 py-3">{formatDate(item.updated_at || item.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDecisions() {
  const [payments, setPayments] = useState([]);
  const [teams, setTeams] = useState([]);

  async function load() {
    const [nextPayments, nextTeams] = await Promise.all([adminFetchPayments(), adminFetchTeams()]);
    setPayments(nextPayments);
    setTeams(nextTeams);
  }

  useEffect(() => {
    load().catch(() => undefined);
    const stops = ["payments", "teams"].map((table) => subscribeTable(table, () => load().catch(() => undefined)));
    return () => stops.forEach((stop) => stop());
  }, []);

  const accepted = useMemo(() => payments.filter((item) => item.status === "SUCCESS"), [payments]);
  const rejected = useMemo(() => payments.filter((item) => item.status === "FAILED" || item.status === "REFUNDED"), [payments]);
  const decided = [...accepted, ...rejected];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Payment decisions</h1>
          <p className="mt-2 text-sm text-ink/60">Accepted and rejected UTR requests are saved here.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            downloadCsv(
              "sih-payment-decisions.csv",
              decided.map((item) => ({
                registrationId: item.registration_id,
                team: item.team_name,
                utr: item.transaction_id || "",
                amount: item.amount,
                status: decisionLabel(item.status),
                date: formatDate(item.updated_at || item.created_at),
              }))
            )
          }
        >
          Export CSV
        </Button>
      </div>

      <h2 className="mt-8 font-display text-2xl text-web">Accepted</h2>
      <div className="mt-3">
        {accepted.length ? <DecisionTable rows={accepted} teams={teams} /> : <p className="text-sm text-ink/50">No accepted payments yet.</p>}
      </div>

      <h2 className="mt-10 font-display text-2xl text-spidey">Rejected</h2>
      <div className="mt-3">
        {rejected.length ? <DecisionTable rows={rejected} teams={teams} /> : <p className="text-sm text-ink/50">No rejected payments yet.</p>}
      </div>
    </div>
  );
}
