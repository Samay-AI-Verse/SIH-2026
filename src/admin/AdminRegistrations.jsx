import { useEffect, useState, useMemo } from "react";
import { 
  Search, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Shield, 
  Mail, 
  Phone, 
  Building, 
  User, 
  RefreshCw, 
  Trash2, 
  RotateCcw, 
  Pencil, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  GraduationCap, 
  Award,
  Calendar,
  Layers,
  ChevronRight
} from "lucide-react";
import { adminCancelTeam, adminFetchTeams, adminVerifyPayment, adminDeleteTeam, adminUpdateTeamName, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate, formatINR } from "../utils/cn";
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
  const [copiedInfo, setCopiedInfo] = useState("");

  function handleCopy(text, key) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedInfo(key);
    setTimeout(() => setCopiedInfo(""), 2000);
  }

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
          <h1 className="font-display text-3xl sm:text-4xl text-web flex items-center gap-2">
            <Shield className="text-spidey shrink-0" size={32} /> Registrations & Team Roster
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            View all registered teams, inspect 6-member student roster profiles, approve payments, and manage team entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="shrink-0 text-xs font-black shadow-comic"
            onClick={() =>
              downloadCsv(
                "gtmc-sih-registrations.csv",
                teams.map((team) => ({
                  registrationId: team.registrationId,
                  teamName: team.teamName,
                  college: team.college || "GTMC Nanded",
                  leaderName: team.leaderName,
                  leaderEmail: team.email,
                  leaderPhone: team.phone,
                  membersCount: team.members?.length || 6,
                  paymentStatus: team.paymentStatus,
                  registrationStatus: team.registrationStatus,
                  problemStatement: team.selectedProblemTitle || team.selectedProblemId || "Open Innovation",
                  registeredAt: formatDate(team.registeredAt || team.registered_at || team.created_at),
                }))
              )
            }
          >
            <Download size={14} className="mr-1.5" /> Export CSV
          </Button>

          <button
            onClick={() => load()}
            className="rounded-xl border-2 border-web/20 bg-white p-2 text-slate-700 hover:bg-gold hover:text-web transition shadow-2xs"
            title="Refresh Teams"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="rounded-2xl border-2 border-web/20 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
                    : "bg-slate-100 text-slate-700 hover:bg-gold/30 hover:text-web"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Reg ID, Team, Leader, Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-2 border-web/20 bg-slate-50 py-2 pl-9 pr-8 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Teams Table Container */}
      <div className="rounded-2xl border-2 border-web/20 bg-white shadow-sm overflow-hidden">
        <div className="p-4 bg-web text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="font-display text-xl sm:text-2xl tracking-wide">
              Registered Teams Directory ({filteredTeams.length})
            </p>
          </div>
          <span className="text-xs font-black uppercase tracking-wider bg-gold text-web px-3 py-1 rounded-full w-fit">
            GTMC Nanded Official
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold flex flex-col items-center justify-center gap-2">
            <RefreshCw className="animate-spin text-spidey" size={24} />
            <span>Loading registered teams and member rosters...</span>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            No registration entries match your search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[1020px] divide-y divide-slate-200">
              <thead className="bg-slate-50 font-ui text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-64">Reg ID & Team Name</th>
                  <th className="px-4 py-3.5 w-44">Reg Date & Time</th>
                  <th className="px-4 py-3.5 w-64">College & Leader</th>
                  <th className="px-4 py-3.5 w-28 text-center">Roster</th>
                  <th className="px-4 py-3.5 w-44">Status</th>
                  <th className="px-4 py-3.5">Problem Statement</th>
                  <th className="px-4 py-3.5 text-right w-64">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTeams.map((team) => {
                  const isConfirmed = team.registrationStatus === "CONFIRMED" || team.paymentStatus === "SUCCESS";
                  const isCancelled = (team.registrationStatus || "").includes("CANCELLED") || (team.paymentStatus || "").includes("CANCELLED") || team.paymentStatus === "REFUNDED";
                  const regDateTime = team.registeredAt || team.registered_at || team.created_at;

                  return (
                    <tr key={team.id} className="hover:bg-amber-50/40 transition">
                      {/* Reg ID & Team Name */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-black text-spidey bg-spidey/10 px-2 py-0.5 rounded border border-spidey/30 inline-block mb-1">
                          {team.registrationId}
                        </span>
                        <div className="font-bold text-base text-web truncate max-w-[230px]" title={team.teamName}>
                          {team.teamName}
                        </div>
                      </td>

                      {/* Reg Date & Time */}
                      <td className="px-4 py-3.5 text-xs font-mono font-bold text-slate-600 whitespace-nowrap">
                        {formatDate(regDateTime)}
                      </td>

                      {/* College & Leader */}
                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-bold text-ink truncate max-w-[230px]" title={team.college || "GTMC Nanded"}>
                          {team.college || "GTMC Nanded"}
                        </div>
                        <div className="text-slate-600 font-semibold mt-0.5 truncate max-w-[230px]">
                          Leader: <span className="text-web font-bold">{team.leaderName}</span>
                        </div>
                      </td>

                      {/* Roster count */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-black text-slate-700">
                          <User size={12} className="text-spidey" /> {team.members?.length || 6} / 6
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <StatusBadge status={team.paymentStatus || team.registrationStatus} />
                      </td>

                      {/* Problem Statement */}
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                        {team.isOpenInnovation ? (
                          <span className="inline-flex items-center gap-1 text-spidey font-black bg-spidey/10 px-2 py-0.5 rounded border border-spidey/20">
                            🚀 Open Innovation
                          </span>
                        ) : (
                          <div className="max-w-xs truncate" title={team.selectedProblemTitle || team.selectedProblemId || "Not Selected"}>
                            {team.selectedProblemTitle || team.selectedProblemId || "—"}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {/* View Details */}
                          <button
                            onClick={() => {
                              setSelectedTeam(team);
                              setEditingTeamName(false);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-web/30 bg-white px-2.5 py-1.5 text-xs font-bold text-web hover:bg-gold hover:text-web transition shadow-2xs"
                            title="Inspect 6-Member Roster & Details"
                          >
                            <Eye size={13} /> Roster
                          </button>

                          {/* Quick Approve */}
                          {!isConfirmed && !isCancelled && (
                            <button
                              onClick={() => adminVerifyPayment(team.id, "SUCCESS", "Approved by Admin").then(load)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-700 bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                              title="Verify Payment & Confirm Team"
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                          )}

                          {/* Cancel */}
                          {!isCancelled && (
                            <button
                              onClick={() => setCancelPromptTeam(team)}
                              className="rounded-lg border border-amber-600 bg-amber-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition shadow-2xs"
                              title="Cancel registration"
                            >
                              Cancel
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => setDeletePromptTeam(team)}
                            className="rounded-lg border border-rose-700 bg-rose-600 px-2 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-2xs"
                            title="Delete team permanently"
                          >
                            <Trash2 size={13} />
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

      {/* FULL TEAM DETAILS & 6-MEMBER STUDENT ROSTER MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl border-3 sm:border-4 border-web bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="shrink-0 px-5 sm:px-6 py-4 bg-slate-900 text-white border-b-2 border-gold/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-xl border-2 border-gold bg-gold px-3 py-1 font-display text-xl sm:text-2xl text-web shrink-0 shadow-comic">
                  {selectedTeam.registrationId}
                </div>
                <div className="min-w-0">
                  {editingTeamName ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className="rounded-xl border-2 border-gold bg-white px-3 py-1 text-sm font-bold text-ink focus:outline-none"
                        placeholder="Enter new team name..."
                        autoFocus
                      />
                      <button
                        type="button"
                        disabled={savingNameBusy}
                        onClick={handleSaveTeamName}
                        className="rounded-lg border border-emerald-500 bg-emerald-600 px-3 py-1 text-xs font-black text-white hover:bg-emerald-700 transition"
                      >
                        {savingNameBusy ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTeamName(false)}
                        className="rounded-lg bg-slate-700 px-3 py-1 text-xs font-bold text-white hover:bg-slate-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-2xl sm:text-3xl text-gold truncate tracking-wide">
                        {selectedTeam.teamName}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setNewTeamName(selectedTeam.teamName || "");
                          setEditingTeamName(true);
                        }}
                        className="rounded-lg border border-white/20 bg-white/10 p-1 text-white hover:bg-gold hover:text-web transition shadow-2xs shrink-0"
                        title="Edit Team Name"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs font-semibold text-slate-300 truncate mt-0.5">
                    {selectedTeam.college || "GTMC Nanded"} · Leader: <span className="text-gold font-bold">{selectedTeam.leaderName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTeam(null);
                  setEditingTeamName(false);
                }}
                className="shrink-0 rounded-full border border-white/30 bg-white/10 p-2 text-white hover:bg-rose-600 hover:border-rose-600 transition shadow-xs"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
              {/* Payment & Verification Banner */}
              <div className="rounded-2xl border-2 border-web/15 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-2.5 mb-3 gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-web flex items-center gap-1.5">
                    <Shield size={16} className="text-spidey" /> Payment Details & Proof
                  </span>
                  <StatusBadge status={selectedTeam.paymentStatus || selectedTeam.registrationStatus} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Mode & Collector */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Payment Mode</span>
                    <span className="font-extrabold text-web text-sm block">
                      {selectedTeam.paymentMode === "OFFLINE_CASH" || selectedTeam.payment_mode === "OFFLINE_CASH"
                        ? "💵 Offline Cash Collection"
                        : "💳 Online (UPI / QR / Bank)"}
                    </span>
                    {(selectedTeam.collectorName || selectedTeam.collector_name) && (
                      <div className="text-[11px] text-slate-600 font-semibold">
                        Collected by: <span className="text-web font-bold">{selectedTeam.collectorName || selectedTeam.collector_name}</span>
                      </div>
                    )}
                    {(selectedTeam.receiptNo || selectedTeam.receipt_no) && (
                      <div className="text-[11px] font-mono text-slate-500">
                        Receipt #: {selectedTeam.receiptNo || selectedTeam.receipt_no}
                      </div>
                    )}
                  </div>

                  {/* UTR / Transaction ID */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">UTR / Transaction ID</span>
                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <span className="font-mono text-xs font-black text-spidey truncate">
                        {selectedTeam.paymentUtr || selectedTeam.payment_utr || selectedTeam.payment?.utr || selectedTeam.payment?.transaction_id || "Not Provided"}
                      </span>
                      {(selectedTeam.paymentUtr || selectedTeam.payment_utr || selectedTeam.payment?.utr || selectedTeam.payment?.transaction_id) && (
                        <button
                          type="button"
                          onClick={() => {
                            const utrVal = selectedTeam.paymentUtr || selectedTeam.payment_utr || selectedTeam.payment?.utr || selectedTeam.payment?.transaction_id;
                            handleCopy(utrVal, "utr");
                          }}
                          className="rounded bg-white border border-slate-200 p-1 text-slate-600 hover:bg-gold hover:text-web transition shrink-0"
                          title="Copy UTR"
                        >
                          {copiedInfo === "utr" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Proof Screenshot */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Payment Proof</span>
                    {(selectedTeam.paymentProofUrl || selectedTeam.payment_proof_url || selectedTeam.payment?.proof_url) ? (
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(selectedTeam.paymentProofUrl || selectedTeam.payment_proof_url || selectedTeam.payment?.proof_url)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-spidey/30 bg-spidey/10 px-2.5 py-1.5 text-xs font-black text-spidey hover:bg-spidey hover:text-white transition mt-0.5"
                      >
                        <ImageIcon size={14} /> View Screenshot / Receipt
                      </button>
                    ) : (
                      <span className="text-slate-400 font-semibold italic block pt-1">No proof uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Problem Statement Card */}
              <div className="rounded-2xl border-2 border-web/15 bg-white p-4 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Selected Problem / Idea</p>
                <p className="mt-1 font-bold text-web text-base">
                  {selectedTeam.isOpenInnovation
                    ? `🚀 ${selectedTeam.openInnovationTitle || "Open Innovation Custom Project"}`
                    : selectedTeam.selectedProblemTitle || "Not Selected Yet"}
                </p>
                {selectedTeam.isOpenInnovation && selectedTeam.openInnovationDescription && (
                  <p className="mt-2 text-xs text-slate-600 border-t border-slate-100 pt-2 leading-relaxed">
                    {selectedTeam.openInnovationDescription}
                  </p>
                )}
              </div>

              {/* 6-Member Student Roster Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-2xl text-web flex items-center gap-2">
                    <GraduationCap className="text-spidey" size={24} /> 6-Member Student Roster ({selectedTeam.members?.length || 6})
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    Click ✏️ to edit or replace student details
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {selectedTeam.members?.map((m, idx) => {
                    const isLeader = m.isLeader || idx === 0;
                    const memberName = m.name || m.full_name || `Member #${idx + 1}`;
                    const memberEmail = m.email || selectedTeam.email;
                    const memberPhone = m.phone || selectedTeam.phone;
                    const memberCourse = m.course || m.stream || selectedTeam.leaderCourse || "B.Tech";
                    const memberBranch = m.branch || selectedTeam.leaderBranch || "CSE";
                    const memberYear = m.year || selectedTeam.leaderYear || "3rd Year";
                    const memberGender = m.gender || (isLeader ? selectedTeam.leaderGender : "Male") || "Male";
                    const isFemale = memberGender.toLowerCase() === "female";

                    return (
                      <div
                        key={m.id || idx}
                        className={`rounded-2xl border-2 p-4 transition relative shadow-xs flex flex-col justify-between ${
                          isLeader 
                            ? "border-amber-400 bg-amber-50/50 hover:border-amber-500" 
                            : "border-slate-200 bg-white hover:border-web/40"
                        }`}
                      >
                        <div>
                          {/* Top Row: Name & Badges */}
                          <div className="flex items-start justify-between gap-2 pr-8">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-ink text-sm sm:text-base leading-tight">
                                  {memberName}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {isLeader ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-gold px-2 py-0.5 text-[10px] font-black text-web shadow-2xs">
                                    👑 LEADER
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-700">
                                    👤 MEMBER {idx + 1}
                                  </span>
                                )}
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                                    isFemale ? "bg-pink-100 text-pink-700 border border-pink-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                                  }`}
                                >
                                  {memberGender}
                                </span>
                                {(m.studentId || m.student_id) && (
                                  <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                    ID: {m.studentId || m.student_id}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => setEditingMember({ teamId: selectedTeam.id, member: m })}
                            className="absolute right-3 top-3 rounded-lg border border-web/20 bg-white p-1.5 text-slate-600 hover:bg-gold hover:text-web transition shadow-2xs"
                            title="Edit Student Member Details"
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Academic Details */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                            <div>
                              <span className="text-[10px] uppercase text-slate-400 block font-black">Course & Branch</span>
                              <span className="text-web font-bold truncate block">{memberCourse} · {memberBranch}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase text-slate-400 block font-black">Year</span>
                              <span className="text-slate-700 font-bold block">{memberYear}</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Quick Links */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                          {memberEmail ? (
                            <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px] truncate max-w-[180px]">
                              <Mail size={12} className="shrink-0 text-slate-400" />
                              <a href={`mailto:${memberEmail}`} className="hover:text-web hover:underline truncate">
                                {memberEmail}
                              </a>
                            </div>
                          ) : <span className="text-slate-400 text-[11px] italic">No email</span>}

                          {memberPhone && (
                            <div className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                              <Phone size={12} className="shrink-0 text-slate-400" />
                              <a href={`tel:${memberPhone}`} className="hover:text-web hover:underline">
                                {memberPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedTeam.email}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-web/20 bg-slate-50 px-3.5 py-1.5 text-xs font-black text-web hover:bg-gold transition shadow-2xs"
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
                    className="rounded-xl border-2 border-emerald-700 bg-emerald-600 px-3.5 py-1.5 text-xs font-black uppercase text-white hover:bg-emerald-700 transition shadow-2xs"
                  >
                    ✓ Approve Team
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCancelPromptTeam(selectedTeam)}
                  className="rounded-xl border-2 border-amber-700 bg-amber-600 px-3.5 py-1.5 text-xs font-black uppercase text-white hover:bg-amber-700 transition shadow-2xs"
                >
                  Cancel Team
                </button>
                <button
                  onClick={() => {
                    setSelectedTeam(null);
                    setEditingTeamName(false);
                  }}
                  className="rounded-xl border-2 border-slate-300 bg-slate-100 px-4 py-1.5 text-xs font-bold uppercase text-slate-700 hover:bg-slate-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION PROMPT MODAL */}
      {cancelPromptTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border-4 border-rose-600 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="shrink-0 px-5 sm:px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-rose-600 min-w-0">
                <AlertTriangle size={28} className="shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-display text-2xl text-rose-700 truncate">Cancel Team Registration</h3>
                  <p className="text-xs font-mono font-bold text-slate-600 truncate">
                    {cancelPromptTeam.teamName} ({cancelPromptTeam.registrationId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCancelPromptTeam(null)}
                className="shrink-0 rounded-full border-2 border-slate-300 bg-white p-2 text-ink hover:bg-rose-600 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                Cancelling this team will automatically release their claimed Problem Statement quota. Choose whether to record a fee refund in the ledger:
              </p>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">Optional Admin Notes</label>
                <input
                  type="text"
                  placeholder="Reason for cancellation..."
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  disabled={cancelBusy}
                  onClick={() => handleExecuteCancel(true)}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl border-3 border-amber-700 bg-amber-500 p-4 text-white hover:bg-amber-600 transition shadow-sm disabled:opacity-50"
                >
                  <RotateCcw size={20} />
                  <span className="font-display text-base">Cancel & Issue Refund</span>
                  <span className="text-[10px] font-bold opacity-90 text-center">
                    Deducts ₹300 from Total Revenue
                  </span>
                </button>

                <button
                  disabled={cancelBusy}
                  onClick={() => handleExecuteCancel(false)}
                  className="flex flex-col items-center justify-center gap-1 rounded-2xl border-3 border-rose-800 bg-rose-700 p-4 text-white hover:bg-rose-800 transition shadow-sm disabled:opacity-50"
                >
                  <Trash2 size={20} />
                  <span className="font-display text-base">Cancel No Refund</span>
                  <span className="text-[10px] font-bold opacity-90 text-center">
                    Retains Collected Fee
                  </span>
                </button>
              </div>
            </div>

            <div className="shrink-0 px-6 py-3 bg-slate-50 border-t border-slate-200 text-center">
              <button
                onClick={() => setCancelPromptTeam(null)}
                className="text-xs font-bold text-slate-600 hover:text-ink hover:underline"
              >
                Dismiss / Keep Team Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE MODAL */}
      {deletePromptTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 md:p-6 overflow-hidden">
          <div className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl border-4 border-red-600 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            <div className="shrink-0 px-5 sm:px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-red-600 min-w-0">
                <Trash2 size={28} className="shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-display text-2xl text-red-700 truncate">Delete Team Permanently</h3>
                  <p className="text-xs font-mono font-bold text-slate-600 truncate">
                    {deletePromptTeam.teamName} ({deletePromptTeam.registrationId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeletePromptTeam(null)}
                className="shrink-0 rounded-full border-2 border-slate-300 bg-white p-2 text-ink hover:bg-red-600 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800 leading-relaxed">
                ⚠️ WARNING: This will completely erase team '{deletePromptTeam.teamName}', all 6 members, payment receipts, and release the problem statement quota!
              </div>
            </div>

            <div className="shrink-0 px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
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
                {deleteBusy ? "Deleting..." : "PERMANENTLY DELETE"}
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
