import { useEffect, useMemo, useState } from "react";
import { adminFetchPayments, adminFetchTeams, adminUpdatePayment, subscribeTable } from "../services/apiService";
import { formatDate, formatINR } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [acting, setActing] = useState("");
  const [error, setError] = useState("");

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

  const pending = useMemo(
    () => payments.filter((item) => item.status === "PROCESSING" && item.transaction_id),
    [payments]
  );

  async function decide(paymentId, status) {
    setActing(`${paymentId}-${status}`);
    setError("");
    try {
      await adminUpdatePayment(paymentId, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this request.");
    } finally {
      setActing("");
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Payment requests</h1>
      <p className="mt-2 text-sm text-ink/60">Teams that submitted a UTR. Accept or reject each request.</p>
      {error ? <p className="mt-3 text-sm text-spidey">{error}</p> : null}
      <div className="mt-6 space-y-5">
        {pending.map((item) => {
          const team = teams.find((row) => row.id === item.team_id);
          const members = team?.members || [];
          const leader = members.find((member) => member.isLeader);
          const isOffline = item.payment_mode === "OFFLINE_CASH" || item.payment?.payment_mode === "OFFLINE_CASH" || String(item.transaction_id || "").startsWith("OFFLINE-");
          const collector = item.collector_name || item.payment?.collector_name || "Organizing Committee";
          const receiptNum = item.receipt_no || item.payment?.receipt_no || item.transaction_id;
          const proofUrl = item.proof_url || item.payment?.proof_url;

          return (
            <article key={item.id} className="overflow-hidden rounded-3xl border-2 border-web bg-white">
              <header className="flex flex-wrap items-center justify-between gap-3 bg-web px-5 py-4 text-white">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isOffline ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black text-web">
                        💵 OFFLINE CASH PAYMENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-gold px-2 py-0.5 text-[10px] font-black text-web">
                        💳 ONLINE UPI PAYMENT
                      </span>
                    )}
                  </div>
                  <p className="font-display text-3xl leading-none">{item.team_name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold">
                    {item.registration_id} · {team?.college || "—"}
                  </p>
                </div>
                <p className="text-sm font-bold">{formatINR(item.amount, item.currency)}</p>
              </header>
              <div className="grid gap-4 px-5 py-4 md:grid-cols-2">
                <p className="text-sm">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-ink/40">
                    {isOffline ? "Cash Slip / Token #" : "UTR / Transaction ID"}
                  </span>
                  <br />
                  <span className="font-semibold text-ink">{receiptNum || item.transaction_id}</span>
                </p>

                {isOffline && (
                  <p className="text-sm">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-amber-700 font-bold">
                      Cash Collected By (Committee Member)
                    </span>
                    <br />
                    <span className="font-bold text-web">{collector}</span>
                  </p>
                )}

                <p className="text-sm">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-ink/40">Submitted Date</span>
                  <br />
                  {formatDate(item.created_at)}
                </p>

                {proofUrl && (
                  <p className="text-sm">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-spidey">Receipt / Proof Photo</span>
                    <br />
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-0.5 text-xs font-bold text-spidey underline"
                    >
                      View Proof Attachment ↗
                    </a>
                  </p>
                )}

                <p className="text-sm md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-spidey">Team leader</span>
                  <br />
                  {leader?.name || team?.leaderName} · {leader?.email || team?.email} · {leader?.phone || team?.phone} ·{" "}
                  {leader?.gender || team?.leaderGender}
                </p>
                <div className="md:col-span-2">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-web">All members</p>
                  <ul className="mt-2 grid gap-1 text-sm text-ink/80 sm:grid-cols-2">
                    {members.map((member) => (
                      <li key={member.id || member.email}>
                        {member.name} · {member.gender} · {member.studentId}
                        <span className="block text-xs text-ink/50">
                          {member.email} · {member.phone}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-ink/10 px-5 py-4">
                <Button disabled={Boolean(acting)} onClick={() => decide(item.id, "SUCCESS")}>
                  {acting === `${item.id}-SUCCESS` ? "Accepting..." : "Accept"}
                </Button>
                <Button variant="danger" disabled={Boolean(acting)} onClick={() => decide(item.id, "FAILED")}>
                  {acting === `${item.id}-FAILED` ? "Rejecting..." : "Reject"}
                </Button>
              </div>
            </article>
          );
        })}
        {!pending.length ? <p className="text-sm text-ink/50">No pending payment requests.</p> : null}
      </div>
    </div>
  );
}
