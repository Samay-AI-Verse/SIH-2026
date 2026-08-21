import { useEffect, useState, useMemo } from "react";
import { Search, Eye, X, CheckCircle2, AlertTriangle, Download, Shield, Mail, Phone, Building, User, RefreshCw, Trash2, RotateCcw, Pencil, Image as ImageIcon, Copy, Check } from "lucide-react";
import { adminCancelTeam, adminFetchTeams, adminVerifyPayment, adminDeleteTeam, adminUpdateTeamName, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { EditMemberModal } from "../components/ui/EditMemberModal";
import { ImageLightbox } from "../components/ui/ImageLightbox";

export function AdminRegistrations() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, CONFIRMED, PENDING, CANCELLED
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [cancelPromptTeam, setCancelPromptTeam] = useState(null);
  const [deletePromptTeam, setDeletePromptTeam] = useState(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [cancelNotes, setCancelNotes] = useState("");
  const [editingMember, setEditingMember] = useState(null); // { teamId, member }
  const [lightboxUrl, setLightboxUrl] = useState("");

  // Team Name Edit State
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [savingNameBusy, setSavingNameBusy] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState(false);

  async function handleSaveTeamName() {
    if (!newTeamName.trim() || newTeamName.trim().length < 3) {
      alert("Team name must be at least 3 characters long");
      return;
    }
    setSavingNameBusy(true);
    try {
      await adminUpdateTeamName(selectedTeam.id, newTeamName.trim());
      setSelectedTeam((prev) => (prev ? { ...prev, teamName: newTeamName.trim(), team_name: newTeamName.trim() } : null));
      setEditingTeamName(false);
      await load();
    } catch (err) {
      alert("Failed to update team name: " + (err?.message || "Unknown error"));
    } finally {
      setSavingNameBusy(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const data = await adminFetchTeams();
      setTeams(data || []);
    } catch (err) {
      console.error("Failed to load registrations:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return subscribeTable("teams", () => load().catch(() => undefined));
  }, []);

  async function handlePermanentDelete() {
    if (!deletePromptTeam) return;
    setDeleteBusy(true);
    try {
      await adminDeleteTeam(deletePromptTeam.id);
      setTeams((prev) => prev.filter((t) => t.id !== deletePromptTeam.id));
      if (selectedTeam?.id === deletePromptTeam.id) {
        setSelectedTeam(null);
      }
      setDeletePromptTeam(null);
      await load();
    } catch (err) {
      alert("Failed to delete team: " + (err?.message || "Unknown error"));
    } finally {
      setDeleteBusy(false);
    }
  }

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (t.registrationId || "").toLowerCase().includes(q) ||
        (t.teamName || "").toLowerCase().includes(q) ||
        (t.leaderName || "").toLowerCase().includes(q) ||
        (t.email || "").toLowerCase().includes(q) ||
        (t.college || "").toLowerCase().includes(q) ||
        (t.selectedProblemTitle || "").toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === "CONFIRMED") {
        matchesStatus = t.registrationStatus === "CONFIRMED" || t.paymentStatus === "SUCCESS";
      } else if (statusFilter === "PENDING") {
        matchesStatus = t.registrationStatus === "PENDING_PAYMENT" || t.paymentStatus === "PENDING" || t.paymentStatus === "PROCESSING";
      } else if (statusFilter === "CANCELLED") {
        matchesStatus = (t.registrationStatus || "").includes("CANCELLED") || (t.paymentStatus || "").includes("CANCELLED") || t.paymentStatus === "REFUNDED";
      }

      return matchesSearch && matchesStatus;
    });
  }, [teams, search, statusFilter]);

  async function handleExecuteCancel(refund) {
    if (!cancelPromptTeam) return;
    setCancelBusy(true);
    try {
      await adminCancelTeam(cancelPromptTeam.id, refund, cancelNotes);
      setCancelPromptTeam(null);
      setCancelNotes("");
      if (selectedTeam?.id === cancelPromptTeam.id) {
        setSelectedTeam(null);
      }
      await load();
    } catch (err) {
      alert("Failed to cancel team: " + (err?.message || "Unknown error"));
    } finally {
      setCancelBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-web flex items-center gap-2">
            <Shield className="text-spidey" size={36} /> Registrations & Team Roster
          </h1>
          <p className="text-xs sm:text-sm font-bold text-ink/70">
            View all registered teams, inspect 6-member roster profiles, approve payments, and manage team cancellations.
          </p>
        </div>

        <Button
          variant="secondary"
          className="shrink-0 text-xs font-black"
          onClick={() =>
            downloadCsv(
              "gtmc-sih-registrations.csv",
              teams.map((team) => ({
                registrationId: team.registrationId,
                teamName: team.teamName,
                college: team.college,
                leaderName: team.leaderName,
                leaderEmail: team.email,
                leaderPhone: team.phone,
                membersCount: team.members?.length || 6,
                paymentStatus: team.paymentStatus,
                registrationStatus: team.registrationStatus,
                problemStatement: team.selectedProblemTitle || team.selectedProblemId || "Open Innovation",
                registeredAt: formatDate(team.registeredAt),
              }))
            )
          }
        >
          <Download size={14} className="mr-1.5" /> Export Registrations CSV
        </Button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="rounded-2xl border-3 border-web bg-white p-4 shadow-[4px_4px_0_#071433] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "ALL", label: `All Teams (${teams.length})` },
              { id: "CONFIRMED", label: "Confirmed / Paid" },
              { id: "PENDING", label: "Pending Verification" },
              { id: "CANCELLED", label: "Cancelled / Refunded" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition ${
                  statusFilter === tab.id
                    ? "bg-web text-white shadow-comic"
                    : "bg-ink/5 text-ink/70 hover:bg-gold/30 hover:text-web"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Reg ID, Team, Leader, Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-2 border-web/30 bg-slate-50 py-2 pl-9 pr-3 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Teams Table */}
      <div className="overflow-hidden rounded-2xl border-3 border-web bg-white shadow-[6px_6px_0_#071433]">
        <div className="p-4 bg-web text-white flex items-center justify-between">
          <p className="font-display text-2xl tracking-wide">
            Registered Teams Directory ({filteredTeams.length})
          </p>
          <span className="text-xs font-bold uppercase tracking-wider bg-gold text-ink px-2.5 py-0.5 rounded-full">
            GTMC Nanded Official
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold">Loading registered teams...</div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            No registration entries match your search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 font-ui text-xs font-black uppercase tracking-wider text-slate-700 border-b-2 border-web/20">
                <tr>
                  <th className="px-4 py-3">Reg ID & Team Name</th>
                  <th className="px-4 py-3">College & Leader</th>
                  <th className="px-4 py-3">Roster</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Problem Statement</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTeams.map((team) => {
                  const isConfirmed = team.registrationStatus === "CONFIRMED" || team.paymentStatus === "SUCCESS";
                  const isCancelled = (team.registrationStatus || "").includes("CANCELLED") || (team.paymentStatus || "").includes("CANCELLED") || team.paymentStatus === "REFUNDED";

                  return (
                    <tr key={team.id} className="hover:bg-amber-50/50 transition">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-black text-spidey bg-spidey/10 px-2 py-0.5 rounded border border-spidey/30 block w-fit mb-0.5">
                          {team.registrationId}
                        </span>
                        <span className="font-bold text-base text-web">{team.teamName}</span>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-bold text-ink">{team.college}</div>
                        <div className="text-slate-600 font-semibold mt-0.5">Leader: {team.leaderName}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <User size={12} /> {team.members?.length || 6} / 6
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={team.paymentStatus || team.registrationStatus} />
                      </td>

                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700 max-w-xs truncate">
                        {team.isOpenInnovation ? (
                          <span className="text-web font-black">🚀 Open Innovation</span>
                        ) : (
                          team.selectedProblemTitle || team.selectedProblemId || "—"
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {/* View Details Button */}
                          <button
                            onClick={() => {
                              setSelectedTeam(team);
                              setEditingTeamName(false);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border-2 border-web/20 bg-white px-2.5 py-1 text-xs font-black text-web hover:bg-gold transition shadow-xs"
                          >
                            <Eye size={13} /> Details
                          </button>

                          {/* Quick Approve Button */}
                          {!isConfirmed && !isCancelled && (
                            <button
                              onClick={() => adminVerifyPayment(team.id, "SUCCESS", "Approved by Admin").then(load)}
                              className="rounded-lg border-2 border-emerald-700 bg-emerald-600 px-2.5 py-1 text-xs font-black text-white hover:bg-emerald-700 transition shadow-xs"
                            >
                              ✓ Approve
                            </button>
                          )}

                          {/* Cancel Button */}
                          {!isCancelled && (
                            <button
                              onClick={() => setCancelPromptTeam(team)}
                              className="rounded-lg border-2 border-amber-700 bg-amber-600 px-2.5 py-1 text-xs font-black text-white hover:bg-amber-700 transition shadow-xs"
                            >
                              Cancel
                            </button>
                          )}

                          {/* Hard Delete Button */}
                          <button
                            onClick={() => setDeletePromptTeam(team)}
                            className="inline-flex items-center gap-1 rounded-lg border-2 border-rose-800 bg-rose-700 px-2 py-1 text-xs font-black text-white hover:bg-rose-800 transition shadow-xs"
                            title="Delete team permanently from database"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL TEAM DETAILS MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border-4 border-web bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setSelectedTeam(null);
                setEditingTeamName(false);
              }}
              className="absolute right-4 top-4 rounded-full border-2 border-web bg-slate-100 p-2 text-ink hover:bg-spidey hover:text-white transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border-2 border-web bg-gold p-3 font-display text-2xl text-web">
                {selectedTeam.registrationId}
              </div>
              <div className="flex-1">
                {editingTeamName ? (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="rounded-xl border-2 border-web bg-slate-50 px-3 py-1.5 text-base font-bold text-ink focus:bg-white focus:outline-none"
                      placeholder="Enter new team name..."
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={savingNameBusy}
                      onClick={handleSaveTeamName}
                      className="rounded-lg border-2 border-emerald-700 bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 transition"
                    >
                      {savingNameBusy ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTeamName(false)}
                      className="rounded-lg border-2 border-slate-300 bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-3xl text-web">{selectedTeam.teamName}</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setNewTeamName(selectedTeam.teamName || "");
                        setEditingTeamName(true);
                      }}
                      className="rounded-lg border border-web/30 bg-slate-100 p-1.5 text-slate-700 hover:bg-gold hover:text-web transition shadow-2xs"
                      title="Edit / Correct Team Name (As Admin)"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                )}
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  {selectedTeam.college} · Leader: {selectedTeam.leaderName}
                </p>
              </div>
            </div>

            {/* Payment Details Card (Mode, UTR & Proof Image) */}
            <div className="mt-5 rounded-2xl border-2 border-web/20 bg-amber-50/60 p-4">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2 mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-web flex items-center gap-1.5">
                  <Shield size={14} className="text-spidey" /> Payment Details & Verification
                </span>
                <StatusBadge status={selectedTeam.paymentStatus || selectedTeam.registrationStatus} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                {/* Payment Mode */}
                <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Payment Mode</span>
                  <span className="font-extrabold text-web text-sm block">
                    {selectedTeam.paymentMode === "OFFLINE_CASH" || selectedTeam.payment_mode === "OFFLINE_CASH"
                      ? "💵 Offline Cash Collection"
                      : "💳 Online (UPI / QR / Bank)"}
                  </span>
                  {(selectedTeam.collectorName || selectedTeam.collector_name) && (
                    <div className="text-[11px] text-slate-500 font-semibold">
                      Collected by: <span className="text-web">{selectedTeam.collectorName || selectedTeam.collector_name}</span>
                    </div>
                  )}
                  {(selectedTeam.receiptNo || selectedTeam.receipt_no) && (
                    <div className="text-[11px] font-mono text-slate-500">
                      Receipt #: {selectedTeam.receiptNo || selectedTeam.receipt_no}
                    </div>
                  )}
                </div>

                {/* UTR / Transaction ID */}
                <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">UTR / Transaction ID</span>
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <span className="font-mono text-xs font-black text-spidey truncate">
                      {selectedTeam.paymentUtr || selectedTeam.payment_utr || selectedTeam.payment?.utr || selectedTeam.payment?.transaction_id || "Not Provided"}
                    </span>
                    {(selectedTeam.paymentUtr || selectedTeam.payment_utr || selectedTeam.payment?.utr || selectedTeam.payment?.transaction_id) && (
                      <button
                        type="button"
                        onClick={() => {
                          const utrVal = selectedTeam.paymentUtr || selectedTeam.payment_utr || selectedTeam.payment?.utr || selectedTeam.payment?.transaction_id;
                          navigator.clipboard?.writeText(utrVal);
                          setCopiedUtr(true);
                          setTimeout(() => setCopiedUtr(false), 2000);
                        }}
                        className="rounded bg-slate-100 p-1 text-slate-600 hover:bg-gold hover:text-web transition shrink-0"
                        title="Copy UTR"
                      >
                        {copiedUtr ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment Proof Image / Screenshot */}
                <div className="rounded-xl border border-amber-200 bg-white p-3 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Proof Screenshot / Receipt</span>
                  {(selectedTeam.paymentProofUrl || selectedTeam.payment_proof_url || selectedTeam.payment?.proof_url) ? (
                    <button
                      type="button"
                      onClick={() => setLightboxUrl(selectedTeam.paymentProofUrl || selectedTeam.payment_proof_url || selectedTeam.payment?.proof_url)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-spidey/30 bg-spidey/10 px-2.5 py-1 text-xs font-black text-spidey hover:bg-spidey hover:text-white transition mt-0.5"
                    >
                      <ImageIcon size={14} /> View Screenshot
                    </button>
                  ) : (
                    <span className="text-slate-400 font-semibold italic block pt-1">No screenshot uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Problem Statement Info */}
            <div className="mt-4 rounded-2xl border-2 border-web/20 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected Problem / Open Innovation</p>
              <p className="mt-1 font-bold text-web text-base">
                {selectedTeam.isOpenInnovation
                  ? `🚀 ${selectedTeam.openInnovationTitle || "Open Innovation Custom Idea"}`
                  : selectedTeam.selectedProblemTitle || "Not Selected Yet"}
              </p>
              {selectedTeam.isOpenInnovation && selectedTeam.openInnovationDescription && (
                <p className="mt-2 text-xs text-slate-600 border-t border-slate-200 pt-2 leading-relaxed">
                  {selectedTeam.openInnovationDescription}
                </p>
              )}
            </div>

            {/* Roster Breakdown (6 Members) */}
            <div className="mt-5">
              <h3 className="font-display text-xl text-web mb-3">Team Members Roster ({selectedTeam.members?.length || 6})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTeam.members?.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className={`rounded-xl border-2 p-3 text-xs relative ${
                      m.isLeader ? "border-web bg-gold/20" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-ink pr-6">
                      <span>{m.name || m.full_name}</span>
                      {m.isLeader ? (
                        <span className="rounded bg-gold px-1.5 py-0.5 text-[9px] font-black text-web">LEADER</span>
                      ) : (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-black text-slate-700">MEMBER</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingMember({ teamId: selectedTeam.id, member: m })}
                      className="absolute right-2.5 top-2.5 rounded-lg border border-web/20 bg-white p-1 text-slate-600 hover:bg-gold hover:text-web transition shadow-2xs"
                      title="Edit Student Member Profile"
                    >
                      <Pencil size={13} />
                    </button>

                    <div className="mt-1 text-slate-600 flex items-center justify-between">
                      <span>{m.gender} • {m.year || selectedTeam.leaderYear}</span>
                      <span>{m.branch || selectedTeam.leaderBranch}</span>
                    </div>
                    {m.email && <div className="mt-1 font-mono text-[11px] text-slate-500 truncate">{m.email}</div>}
                    {m.phone && <div className="font-mono text-[11px] text-slate-500">{m.phone}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedTeam.email}`}
                  className="inline-flex items-center gap-1 rounded-xl border-2 border-web/20 bg-slate-100 px-4 py-2 text-xs font-bold text-ink hover:bg-gold transition"
                >
                  <Mail size={14} /> Contact Leader
                </a>

                {selectedTeam.registrationStatus !== "CONFIRMED" && selectedTeam.paymentStatus !== "SUCCESS" && (
                  <button
                    onClick={async () => {
                      await adminVerifyPayment(selectedTeam.id, "SUCCESS", "Approved by Admin");
                      setSelectedTeam(null);
                      await load();
                    }}
                    className="rounded-xl border-2 border-emerald-700 bg-emerald-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-emerald-700 transition"
                  >
                    ✓ Approve Team
                  </button>
                )}
              </div>

              <button
                onClick={() => setCancelPromptTeam(selectedTeam)}
                className="rounded-xl border-2 border-rose-700 bg-rose-600 px-4 py-2 text-xs font-black uppercase text-white hover:bg-rose-700 transition"
              >
                Cancel Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEAM CANCELLATION PROMPT MODAL (REFUND VS NO REFUND) */}
      {cancelPromptTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border-4 border-rose-600 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setCancelPromptTeam(null)}
              className="absolute right-4 top-4 rounded-full border-2 border-slate-300 bg-slate-100 p-2 text-ink hover:bg-rose-600 hover:text-white transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <AlertTriangle size={32} />
              <div>
                <h3 className="font-display text-2xl text-rose-700">Cancel Team Registration</h3>
                <p className="text-xs font-mono font-bold text-slate-600">
                  {cancelPromptTeam.teamName} ({cancelPromptTeam.registrationId})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-semibold mt-3 leading-relaxed">
              Cancelling this team will automatically release their claimed Problem Statement quota. Please choose whether to record a fee refund in the financial ledger:
            </p>

            <div className="mt-4">
              <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Optional Admin Notes</label>
              <input
                type="text"
                placeholder="Reason for cancellation..."
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 p-2 text-xs font-bold text-ink focus:border-rose-600 focus:outline-none"
              />
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cancel with Refund */}
              <button
                disabled={cancelBusy}
                onClick={() => handleExecuteCancel(true)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border-3 border-amber-700 bg-amber-500 p-4 text-white hover:bg-amber-600 transition shadow-sm disabled:opacity-50"
              >
                <RotateCcw size={20} />
                <span className="font-display text-base">Cancel & Issue Refund</span>
                <span className="text-[10px] font-extrabold opacity-90 text-center">
                  Deducts ₹300 from Total Revenue & Ledger
                </span>
              </button>

              {/* Cancel Without Refund */}
              <button
                disabled={cancelBusy}
                onClick={() => handleExecuteCancel(false)}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl border-3 border-rose-800 bg-rose-700 p-4 text-white hover:bg-rose-800 transition shadow-sm disabled:opacity-50"
              >
                <Trash2 size={20} />
                <span className="font-display text-base">Cancel No Refund</span>
                <span className="text-[10px] font-extrabold opacity-90 text-center">
                  Retains Collected Fee in Total Revenue
                </span>
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setCancelPromptTeam(null)}
                className="text-xs font-bold text-slate-500 hover:underline"
              >
                Dismiss / Keep Team Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE TEAM CONFIRMATION MODAL */}
      {deletePromptTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl border-4 border-red-600 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setDeletePromptTeam(null)}
              className="absolute right-4 top-4 rounded-full border-2 border-slate-300 bg-slate-100 p-2 text-ink hover:bg-red-600 hover:text-white transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-red-600 mb-2">
              <Trash2 size={32} />
              <div>
                <h3 className="font-display text-2xl text-red-700">Delete Team Permanently</h3>
                <p className="text-xs font-mono font-bold text-slate-600">
                  {deletePromptTeam.teamName} ({deletePromptTeam.registrationId})
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800 leading-relaxed">
              ⚠️ WARNING: This will completely erase team '{deletePromptTeam.teamName}', all 6 members, payment receipts, and release the problem statement quota from the database!
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletePromptTeam(null)}
                className="rounded-xl border-2 border-slate-300 px-4 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={handlePermanentDelete}
                className="rounded-xl border-2 border-red-800 bg-red-700 px-5 py-2 text-xs font-black uppercase text-white hover:bg-red-800 transition shadow-sm"
              >
                {deleteBusy ? "Deleting..." : "PERMANENTLY DELETE TEAM"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* EDIT MEMBER MODAL */}
      {editingMember && (
        <EditMemberModal
          teamId={editingMember.teamId}
          member={editingMember.member}
          onClose={() => setEditingMember(null)}
          onSuccess={() => load()}
        />
      )}

      {/* IMAGE LIGHTBOX */}
      {lightboxUrl && (
        <ImageLightbox
          imageUrl={lightboxUrl}
          onClose={() => setLightboxUrl("")}
        />
      )}
    </div>
  );
}


export function AdminTeams() {
  return <AdminRegistrations />;
}

