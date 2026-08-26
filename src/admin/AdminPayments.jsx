import { useEffect, useMemo, useState } from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  X, 
  Wallet, 
  Eye, 
  Search, 
  RefreshCw,
  Crown,
  ZoomIn
} from "lucide-react";
import { adminFetchPayments, adminFetchTeams, adminUpdatePayment, subscribeTable } from "../services/apiService";
import { formatDate, formatINR } from "../utils/cn";
import { Button } from "../components/ui/Button";
import { ImageLightbox } from "../components/ui/ImageLightbox";

export function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [acting, setActing] = useState("");
  const [error, setError] = useState("");
  const [copiedUtr, setCopiedUtr] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING"); // "PENDING", "SUCCESS", "FAILED", "ALL"
  const [query, setQuery] = useState("");

  // Inspection & Lightbox Modal State
  const [inspectItem, setInspectItem] = useState(null); // { item, team, members, isOffline, collector, receiptNum, proofUrl }
  const [activeLightboxUrl, setActiveLightboxUrl] = useState("");

  async function load() {
    try {
      const [nextPayments, nextTeams] = await Promise.all([adminFetchPayments(), adminFetchTeams()]);
      setPayments(nextPayments || []);
      setTeams(nextTeams || []);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
    const stops = ["payments", "teams"].map((table) => subscribeTable(table, () => load().catch(() => undefined)));
    return () => stops.forEach((stop) => stop());
  }, []);

  // Filter Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // Status filter
      const isPending = item.status === "PROCESSING" || item.status === "PENDING" || item.status === "SUBMITTED";
      if (statusFilter === "PENDING" && !isPending) return false;
      if (statusFilter === "SUCCESS" && item.status !== "SUCCESS") return false;
      if (statusFilter === "FAILED" && item.status !== "FAILED") return false;

      // Query filter
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const team = teams.find((t) => t.id === item.team_id);
        return (
          item.team_name?.toLowerCase().includes(q) ||
          item.registration_id?.toLowerCase().includes(q) ||
          item.transaction_id?.toLowerCase().includes(q) ||
          item.collector_name?.toLowerCase().includes(q) ||
          team?.leader_name?.toLowerCase().includes(q) ||
          team?.leader_email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, teams, statusFilter, query]);

  // Counts
  const pendingCount = useMemo(() => {
    return payments.filter((item) => item.status === "PROCESSING" || item.status === "PENDING" || item.status === "SUBMITTED").length;
  }, [payments]);

  const successCount = useMemo(() => {
    return payments.filter((item) => item.status === "SUCCESS").length;
  }, [payments]);

  const failedCount = useMemo(() => {
    return payments.filter((item) => item.status === "FAILED").length;
  }, [payments]);

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
      if (inspectItem && inspectItem.item.id === paymentId) {
        setInspectItem(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this payment request.");
    } finally {
      setActing("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-web flex items-center gap-2">
            <Wallet className="text-spidey" size={32} /> Payment Verification
          </h1>
          <p className="text-xs sm:text-sm font-bold text-ink/70">
            Compact list view of submitted UPI transaction UTRs and cash receipts. Click to verify & approve.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={load}
            variant="secondary"
            className="flex items-center gap-1.5 py-2 px-3.5 text-xs font-black uppercase"
          >
            <RefreshCw size={14} /> Refresh
          </Button>

          <div className="rounded-2xl border-2 border-web bg-gold/20 px-4 py-1.5 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-web">Pending Verification</p>
            <p className="font-display text-2xl text-web">{pendingCount}</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border-2 border-rose-500 bg-rose-50 p-3 text-xs font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border-2 border-web/20 bg-white p-3 shadow-xs">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
              statusFilter === "PENDING"
                ? "bg-spidey text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Pending Verification ({pendingCount})
          </button>

          <button
            onClick={() => setStatusFilter("SUCCESS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
              statusFilter === "SUCCESS"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Approved ({successCount})
          </button>

          <button
            onClick={() => setStatusFilter("FAILED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
              statusFilter === "FAILED"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Rejected ({failedCount})
          </button>

          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
              statusFilter === "ALL"
                ? "bg-web text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Submissions ({payments.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by team, reg ID or UTR..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-web/20 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-bold text-ink placeholder:text-slate-400 focus:border-web focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* COMPACT TABLE LIST VIEW */}
      <div className="overflow-hidden rounded-3xl border-3 border-web bg-white shadow-comic">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="bg-web text-white font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">Registration & Team</th>
                <th className="p-3.5">Payment Mode</th>
                <th className="p-3.5">Submitted UTR / Token</th>
                <th className="p-3.5">Proof Attachment</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-semibold">
              {filteredPayments.map((item, idx) => {
                const team = teams.find((row) => row.id === item.team_id);
                const members = team?.members || [];
                const isOffline = item.payment_mode === "OFFLINE_CASH" || item.payment?.payment_mode === "OFFLINE_CASH" || String(item.transaction_id || "").startsWith("OFFLINE-");
                const collector = item.collector_name || item.payment?.collector_name || "Organizing Committee";
                const receiptNum = item.receipt_no || item.payment?.receipt_no || item.transaction_id;
                const proofUrl = item.proof_url || item.payment?.proof_url || team?.payment_proof_url;
                const isPending = item.status === "PROCESSING" || item.status === "PENDING" || item.status === "SUBMITTED";

                const inspectionData = { item, team, members, isOffline, collector, receiptNum, proofUrl };

                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-400">{idx + 1}</td>

                    {/* Team Name & Reg ID */}
                    <td className="p-3.5">
                      <div>
                        <span className="font-mono text-[10px] font-black text-spidey bg-spidey/10 px-1.5 py-0.5 rounded">
                          {item.registration_id || team?.registration_id || "N/A"}
                        </span>
                        <h4 className="font-display text-base text-web leading-tight mt-0.5">
                          {item.team_name || team?.team_name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold block truncate max-w-[180px]">
                          {team?.college || "GTMC Nanded"}
                        </span>
                      </div>
                    </td>

                    {/* Payment Mode */}
                    <td className="p-3.5">
                      {isOffline ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-800">
                          💵 CASH
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 border border-sky-300 px-2 py-0.5 text-[10px] font-black text-sky-800">
                          💳 ONLINE UPI
                        </span>
                      )}
                    </td>

                    {/* Submitted UTR / Token Number */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-web bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          {receiptNum || item.transaction_id || "Not Provided"}
                        </span>
                        {receiptNum && (
                          <button
                            onClick={() => copyUtr(receiptNum || item.transaction_id)}
                            className="p-1 text-slate-400 hover:text-spidey transition"
                            title="Copy UTR Number"
                          >
                            {copiedUtr === (receiptNum || item.transaction_id) ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        )}
                      </div>
                      {isOffline && (
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-normal">
                          Collector: <strong className="text-ink">{collector}</strong>
                        </span>
                      )}
                    </td>

                    {/* Proof Screenshot Thumbnail */}
                    <td className="p-3.5">
                      {proofUrl ? (
                        <button
                          onClick={() => setInspectItem(inspectionData)}
                          className="flex items-center gap-1 text-[11px] font-bold text-spidey hover:underline"
                        >
                          <ImageIcon size={14} className="shrink-0" /> View Screenshot Proof
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 italic">No attachment</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="p-3.5 font-display text-sm text-web">
                      {formatINR(item.amount || 300, item.currency || "INR")}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      {item.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                          <CheckCircle2 size={12} /> APPROVED
                        </span>
                      ) : item.status === "FAILED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-black text-rose-800">
                          <XCircle size={12} /> REJECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black text-amber-800 animate-pulse">
                          ⏳ PENDING VERIFICATION
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending && (
                          <>
                            <button
                              disabled={Boolean(acting)}
                              onClick={() => decide(item.id, "SUCCESS")}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-black uppercase transition disabled:opacity-50 shadow-xs"
                              title="Approve Payment & Confirm Team"
                            >
                              {acting === `${item.id}-SUCCESS` ? "..." : "Approve ✓"}
                            </button>

                            <button
                              disabled={Boolean(acting)}
                              onClick={() => decide(item.id, "FAILED")}
                              className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 text-[11px] font-black uppercase transition disabled:opacity-50"
                              title="Reject Payment"
                            >
                              {acting === `${item.id}-FAILED` ? "..." : "Reject ✕"}
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setInspectItem(inspectionData)}
                          className="rounded-lg border-2 border-web/30 bg-gold/20 hover:bg-gold px-2.5 py-1 text-[11px] font-black uppercase text-web transition flex items-center gap-1"
                        >
                          <Eye size={12} /> Verify Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filteredPayments.length && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500 font-bold">
                    No payment submissions match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED VERIFICATION INSPECTION MODAL */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border-3 sm:border-4 border-web bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            {/* Sticky Header */}
            <div className="shrink-0 px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {inspectItem.isOffline ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-400 px-2 py-0.5 text-[10px] font-black text-web">
                      💵 OFFLINE CASH PAYMENT
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-gold px-2 py-0.5 text-[10px] font-black text-web">
                      💳 ONLINE UPI PAYMENT (CLOUDFLARE R2)
                    </span>
                  )}
                  <span className="font-mono text-xs font-black text-spidey bg-spidey/10 px-2 py-0.5 rounded">
                    {inspectItem.item.registration_id}
                  </span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl text-web truncate">{inspectItem.item.team_name}</h3>
                <p className="text-xs font-bold text-slate-600 truncate">
                  {inspectItem.team?.college || "GTMC Nanded"} · Fee: {formatINR(inspectItem.item.amount || 300, inspectItem.item.currency || "INR")}
                </p>
              </div>

              <button
                onClick={() => setInspectItem(null)}
                className="shrink-0 rounded-full border-2 border-slate-300 bg-white p-2 text-slate-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition shadow-xs"
                title="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* UTR & Screenshot Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* UTR Box */}
                <div className="space-y-3 rounded-2xl border-2 border-web/20 bg-slate-50 p-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                      {inspectItem.isOffline ? "Cash Receipt Token #" : "Submitted UTR / Transaction ID"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm sm:text-base text-web bg-white px-3 py-1 rounded-xl border-2 border-web/30 truncate">
                        {inspectItem.receiptNum || inspectItem.item.transaction_id || "Not Provided"}
                      </span>
                      {inspectItem.receiptNum && (
                        <button
                          onClick={() => copyUtr(inspectItem.receiptNum)}
                          className="rounded-lg border border-web/20 bg-white p-1.5 text-web hover:bg-gold transition shrink-0"
                          title="Copy UTR"
                        >
                          {copiedUtr === inspectItem.receiptNum ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {inspectItem.isOffline && (
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-800 block mb-0.5">
                        Cash Collector Name
                      </span>
                      <span className="font-bold text-sm text-web">{inspectItem.collector}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 block mb-0.5">
                      Submission Timestamp
                    </span>
                    <span className="font-bold text-xs text-slate-700">{formatDate(inspectItem.item.created_at)}</span>
                  </div>
                </div>

                {/* Screenshot Proof Box */}
                <div className="rounded-2xl border-2 border-web/20 bg-slate-50 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-spidey flex items-center gap-1">
                        <ImageIcon size={14} /> Payment Proof (Cloudflare R2)
                      </span>
                      {inspectItem.proofUrl && (
                        <span className="text-[9px] font-black uppercase text-amber-700 bg-gold/30 px-2 py-0.5 rounded">
                          🔍 Click to Zoom
                        </span>
                      )}
                    </div>
                    {inspectItem.proofUrl ? (
                      <div className="space-y-2">
                        <div
                          onClick={() => setActiveLightboxUrl(inspectItem.proofUrl)}
                          className="group relative overflow-hidden rounded-xl border-2 border-web/30 bg-slate-900 h-48 sm:h-52 flex items-center justify-center cursor-pointer transition hover:border-web"
                        >
                          <img
                            src={inspectItem.proofUrl}
                            alt="Payment Proof Screenshot"
                            className="h-full w-full object-contain group-hover:scale-105 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-black uppercase gap-1">
                            <ZoomIn size={18} /> Full Screen Preview
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => setActiveLightboxUrl(inspectItem.proofUrl)}
                            className="inline-flex items-center gap-1 text-xs font-black uppercase text-web hover:text-spidey transition"
                          >
                            <ZoomIn size={13} /> Zoom Screenshot
                          </button>
                          <a
                            href={inspectItem.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-black uppercase text-spidey hover:underline"
                          >
                            Open in Tab <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center text-slate-400 text-xs font-bold">
                        Direct UTR / Cash Verification (No Image Screenshot Attached)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Team Leader & Roster Preview */}
              <div className="rounded-2xl border-2 border-web/20 bg-white p-4">
                <span className="text-[10px] font-black uppercase text-web block mb-2">
                  Team Roster ({inspectItem.members.length || 6} Members)
                </span>
                <div className="grid gap-2 text-xs font-bold text-slate-700 sm:grid-cols-2">
                  {inspectItem.members.map((m, idx) => (
                    <div key={m.id || idx} className="rounded-lg border border-slate-200 bg-slate-50 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 truncate">
                        {m.is_leader || idx === 0 ? <Crown size={12} className="text-gold shrink-0" /> : null}
                        <span className="text-web font-bold truncate">{m.name || m.full_name}</span>
                      </div>
                      <span className={m.gender === "Female" ? "text-pink-600 text-[10px] font-black shrink-0" : "text-blue-600 text-[10px] font-black shrink-0"}>
                        {m.gender || "Male"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-slate-500">
                Carefully check UTR or cash receipt before approving.
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={Boolean(acting)}
                  onClick={() => decide(inspectItem.item.id, "FAILED")}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-black uppercase transition disabled:opacity-50 shadow-2xs"
                >
                  Reject Payment ✕
                </button>

                <button
                  disabled={Boolean(acting)}
                  onClick={() => decide(inspectItem.item.id, "SUCCESS")}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-black uppercase transition disabled:opacity-50 shadow-2xs"
                >
                  Approve & Confirm Team ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* IMAGE LIGHTBOX MODAL */}
      {activeLightboxUrl && (
        <ImageLightbox
          imageUrl={activeLightboxUrl}
          onClose={() => setActiveLightboxUrl("")}
        />
      )}
    </div>
  );
}
