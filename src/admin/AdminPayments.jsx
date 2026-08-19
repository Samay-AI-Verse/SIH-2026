import { useEffect, useMemo, useState } from "react";
import { CreditCard, CheckCircle2, XCircle, ExternalLink, Image as ImageIcon, Copy, Check, X, ShieldCheck, User, Calendar, Wallet, Eye } from "lucide-react";
import { adminFetchPayments, adminFetchTeams, adminUpdatePayment, subscribeTable } from "../services/apiService";
import { formatDate, formatINR } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [acting, setActing] = useState("");
  const [error, setError] = useState("");
  const [copiedUtr, setCopiedUtr] = useState("");
  const [previewProof, setPreviewProof] = useState(null); // { url, teamName, utr }

  async function load() {
    const [nextPayments, nextTeams] = await Promise.all([adminFetchPayments(), adminFetchTeams()]);
    setPayments(nextPayments || []);
    setTeams(nextTeams || []);
  }

  useEffect(() => {
    load().catch(() => undefined);
    const stops = ["payments", "teams"].map((table) => subscribeTable(table, () => load().catch(() => undefined)));
    return () => stops.forEach((stop) => stop());
  }, []);

  const pending = useMemo(
    () => payments.filter((item) => item.status === "PROCESSING" && (item.transaction_id || item.proof_url)),
    [payments]
  );

  function copyUtr(utr) {
    if (utr && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(utr);
      setCopiedUtr(utr);
      setTimeout(() => setCopiedUtr(""), 2000);
    }
  }

  async function decide(paymentId, status) {
    setActing(`${paymentId}-${status}`);
    setError("");
    try {
      await adminUpdatePayment(paymentId, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this payment request.");
    } finally {
      setActing("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-web flex items-center gap-2">
            <Wallet className="text-spidey" size={36} /> Payment Proof Verification
          </h1>
          <p className="text-xs sm:text-sm font-bold text-ink/70">
            Verify submitted UTR transaction numbers and Cloudflare R2 payment screenshots before approving team registration status.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-web bg-gold/20 px-4 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-web">Pending Verification</p>
          <p className="font-display text-3xl text-web">{pending.length}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border-2 border-rose-500 bg-rose-50 p-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        {pending.map((item) => {
          const team = teams.find((row) => row.id === item.team_id);
          const members = team?.members || [];
          const leader = members.find((member) => member.isLeader);
          const isOffline = item.payment_mode === "OFFLINE_CASH" || item.payment?.payment_mode === "OFFLINE_CASH" || String(item.transaction_id || "").startsWith("OFFLINE-");
          const collector = item.collector_name || item.payment?.collector_name || "Organizing Committee";
          const receiptNum = item.receipt_no || item.payment?.receipt_no || item.transaction_id;
          const proofUrl = item.proof_url || item.payment?.proof_url || team?.payment_proof_url;

          return (
            <article key={item.id} className="overflow-hidden rounded-3xl border-3 border-web bg-white shadow-[6px_6px_0_#071433]">
              {/* Header Banner */}
              <header className="flex flex-wrap items-center justify-between gap-3 bg-web px-6 py-4 text-white">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isOffline ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-web">
                        💵 OFFLINE CASH PAYMENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-gold px-2.5 py-0.5 text-[10px] font-black text-web">
                        💳 ONLINE UPI PAYMENT (CLOUDFLARE R2)
                      </span>
                    )}
                  </div>
                  <h2 className="font-display text-3xl leading-none text-gold">{item.team_name}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/80 font-bold">
                    Reg ID: {item.registration_id} · {team?.college || "GTMC Nanded"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl text-gold">{formatINR(item.amount, item.currency)}</p>
                  <p className="text-[10px] font-black uppercase text-white/70">Registration Fee</p>
                </div>
              </header>

              {/* Main Content Body */}
              <div className="grid gap-6 p-6 md:grid-cols-2">
                {/* UTR & Transaction Info */}
                <div className="space-y-4 rounded-2xl border-2 border-web/20 bg-slate-50 p-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      {isOffline ? "Cash Receipt Token #" : "Submitted UTR / Transaction ID"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg text-web bg-white px-3 py-1 rounded-xl border-2 border-web/30 shadow-xs">
                        {receiptNum || item.transaction_id || "Not Provided"}
                      </span>
                      {receiptNum && (
                        <button
                          onClick={() => copyUtr(receiptNum || item.transaction_id)}
                          className="rounded-xl border border-web/20 bg-white p-2 text-web hover:bg-gold transition"
                          title="Copy UTR Number"
                        >
                          {copiedUtr === (receiptNum || item.transaction_id) ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isOffline && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-1">
                        Cash Collector Name
                      </span>
                      <span className="font-bold text-sm text-web">{collector}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                      Submission Timestamp
                    </span>
                    <span className="font-bold text-xs text-slate-700">{formatDate(item.created_at)}</span>
                  </div>
                </div>

                {/* Cloudflare R2 Screenshot Proof Box */}
                <div className="rounded-2xl border-2 border-web/20 bg-slate-50 p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-spidey block mb-1 flex items-center gap-1">
                      <ImageIcon size={14} /> Cloudflare R2 Screenshot Proof
                    </span>
                    {proofUrl ? (
                      <div className="mt-2 space-y-2">
                        <div
                          onClick={() => setPreviewProof({ url: proofUrl, teamName: item.team_name, utr: receiptNum })}
                          className="group relative cursor-pointer overflow-hidden rounded-xl border-2 border-web/30 bg-black/5 h-32 flex items-center justify-center transition hover:border-spidey"
                        >
                          <img
                            src={proofUrl}
                            alt="Payment Proof Screenshot"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white font-bold text-xs uppercase gap-1">
                            <Eye size={16} /> Click to Zoom Screenshot
                          </div>
                        </div>

                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-black uppercase text-spidey hover:underline"
                        >
                          Open Original R2 Attachment <ExternalLink size={12} />
                        </a>
                      </div>
                    ) : (
                      <div className="mt-2 rounded-xl border-2 border-dashed border-slate-300 bg-white p-6 text-center text-slate-400 text-xs font-bold">
                        No image screenshot uploaded (Direct UTR Number verification)
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Roster Summary */}
                <div className="md:col-span-2 rounded-2xl border-2 border-web/20 bg-white p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-web block mb-2">
                    Team Leader & Roster ({members.length || 6} Members)
                  </span>
                  <div className="text-xs font-bold text-ink mb-3 pb-2 border-b border-slate-100">
                    Leader: <span className="text-web font-black">{leader?.name || team?.leaderName}</span> ({leader?.email || team?.email} · {leader?.phone || team?.phone})
                  </div>
                  <ul className="grid gap-2 text-xs font-bold text-slate-700 sm:grid-cols-2">
                    {members.map((member, idx) => (
                      <li key={member.id || idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2 flex items-center justify-between">
                        <div>
                          <span className="text-ink font-bold">{member.name}</span>
                          <span className="text-[10px] font-normal text-slate-500 block">{member.email || "No email"}</span>
                        </div>
                        <span className={member.gender === "Female" ? "text-pink-600 font-bold" : "text-blue-600 font-bold"}>
                          {member.gender}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-web/10 bg-slate-100 px-6 py-4">
                <span className="text-xs font-bold text-slate-600">
                  Carefully verify UTR number or R2 screenshot proof before approving.
                </span>

                <div className="flex items-center gap-3">
                  <button
                    disabled={Boolean(acting)}
                    onClick={() => decide(item.id, "FAILED")}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-700 bg-rose-600 px-5 py-2 font-ui text-xs font-black uppercase text-white hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    <XCircle size={15} />
                    {acting === `${item.id}-FAILED` ? "Rejecting..." : "Reject Payment"}
                  </button>

                  <button
                    disabled={Boolean(acting)}
                    onClick={() => decide(item.id, "SUCCESS")}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-emerald-700 bg-emerald-600 px-6 py-2 font-ui text-xs font-black uppercase text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-xs"
                  >
                    <CheckCircle2 size={15} />
                    {acting === `${item.id}-SUCCESS` ? "Approving..." : "Approve & Confirm Team"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!pending.length ? (
          <div className="rounded-3xl border-3 border-web bg-white p-12 text-center text-slate-500 font-bold">
            No pending payment verification requests at the moment. All submitted UTRs are processed!
          </div>
        ) : null}
      </div>

      {/* High-Resolution Cloudflare R2 Screenshot Preview Modal */}
      {previewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl border-4 border-web bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setPreviewProof(null)}
              className="absolute right-4 top-4 rounded-full border-2 border-web bg-slate-100 p-2 text-ink hover:bg-spidey hover:text-white transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <ImageIcon className="text-spidey" size={28} />
              <div>
                <h3 className="font-display text-2xl text-web">{previewProof.teamName} — Payment Proof</h3>
                <p className="text-xs font-mono font-bold text-slate-500">UTR / Receipt Token: {previewProof.utr}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border-2 border-web bg-slate-900 flex items-center justify-center max-h-[75vh]">
              <img
                src={previewProof.url}
                alt="Cloudflare R2 Payment Proof"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
              <a
                href={previewProof.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-web bg-gold px-4 py-2 text-xs font-black uppercase text-web hover:bg-white transition"
              >
                Open Full Original Resolution <ExternalLink size={14} />
              </a>

              <button
                onClick={() => setPreviewProof(null)}
                className="rounded-xl border-2 border-web bg-web px-6 py-2 text-xs font-black uppercase text-white hover:bg-spidey transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
