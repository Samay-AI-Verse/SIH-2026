import { useEffect, useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Gift,
  PackageCheck,
  QrCode,
  Printer,
  Download,
  Users,
  Building,
  GraduationCap,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  CheckSquare,
  Square,
  AlertCircle,
  X,
  Phone,
  Mail,
  Award,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Camera,
  MapPin
} from "lucide-react";
import { adminFetchTeams, adminUpdateCheckin, adminBatchCheckin, subscribeTable } from "../services/apiService";
import { downloadCsv, formatDate } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function AdminCheckinDesk() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, CHECKED_IN, PENDING_ENTRY, GOODIES_COLLECTED, GOODIES_PENDING
  const [streamFilter, setStreamFilter] = useState("ALL");
  const [selectedTeamIds, setSelectedTeamIds] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(null); // teamId or "batch"
  const [activeModalTeam, setActiveModalTeam] = useState(null);
  const [printSlipTeam, setPrintSlipTeam] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // Load teams
  async function loadData() {
    try {
      setLoading(true);
      const data = await adminFetchTeams();
      setTeams(data || []);
    } catch (err) {
      console.error("Failed to load teams:", err);
      showToast("❌ Failed to load teams list", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    return subscribeTable("teams", () => loadData().catch(() => undefined));
  }, []);

  function showToast(msg, type = "success") {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.msg === msg ? null : prev));
    }, 4000);
  }

  // Filtered teams computation
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      // Status Filter
      const isCheckedIn = t.entryStatus === "CHECKED_IN" || t.entry_status === "CHECKED_IN";
      const isGoodiesCollected = t.goodiesStatus === "COLLECTED" || t.goodies_status === "COLLECTED";

      if (statusFilter === "CHECKED_IN" && !isCheckedIn) return false;
      if (statusFilter === "PENDING_ENTRY" && isCheckedIn) return false;
      if (statusFilter === "GOODIES_COLLECTED" && !isGoodiesCollected) return false;
      if (statusFilter === "GOODIES_PENDING" && isGoodiesCollected) return false;

      // Stream Filter
      const stream = (t.leaderCourse || t.leader_course || t.stream || "B.Tech").trim();
      if (streamFilter !== "ALL" && !stream.toLowerCase().includes(streamFilter.toLowerCase())) {
        return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const membersNames = (t.members || []).map((m) => (m.name || m.full_name || "").toLowerCase()).join(" ");
        const regId = (t.registrationId || t.registration_id || "").toLowerCase();
        const teamName = (t.teamName || t.team_name || "").toLowerCase();
        const leaderName = (t.leaderName || t.leader_name || "").toLowerCase();
        const phone = (t.leaderPhone || t.leader_phone || "").toLowerCase();
        const desk = (t.deskNumber || t.desk_number || "").toLowerCase();

        return (
          regId.includes(q) ||
          teamName.includes(q) ||
          leaderName.includes(q) ||
          phone.includes(q) ||
          desk.includes(q) ||
          membersNames.includes(q)
        );
      }

      return true;
    });
  }, [teams, statusFilter, streamFilter, search]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = teams.length;
    const checkedIn = teams.filter((t) => (t.entryStatus || t.entry_status) === "CHECKED_IN").length;
    const pendingEntry = total - checkedIn;
    const goodiesCollected = teams.filter((t) => (t.goodiesStatus || t.goodies_status) === "COLLECTED").length;
    const goodiesPending = total - goodiesCollected;
    const totalKitsDistributed = teams.reduce((acc, t) => acc + (Number(t.goodiesCount || t.goodies_count) || 0), 0);
    
    // Present students
    let totalPresentStudents = 0;
    teams.forEach((t) => {
      if ((t.entryStatus || t.entry_status) === "CHECKED_IN") {
        const count = t.presentMembersCount || t.present_members_count || (t.members ? t.members.length : 6);
        totalPresentStudents += Number(count) || 0;
      }
    });

    return {
      total,
      checkedIn,
      pendingEntry,
      checkedInPercent: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
      goodiesCollected,
      goodiesPending,
      goodiesPercent: total > 0 ? Math.round((goodiesCollected / total) * 100) : 0,
      totalKitsDistributed,
      totalPresentStudents,
    };
  }, [teams]);

  // Quick 1-Click Toggle Actions
  async function handleQuickCheckin(team, targetStatus) {
    try {
      setActionLoading(team.id);
      const res = await adminUpdateCheckin(team.id, {
        entry_status: targetStatus,
        checked_in_by: "Admin Desk",
      });
      if (res?.success) {
        showToast(
          targetStatus === "CHECKED_IN"
            ? `✅ Team ${team.teamName} Checked In Successfully!`
            : `↩️ Check-in Reverted for ${team.teamName}`
        );
        await loadData();
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to update check-in status", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleQuickGoodies(team, targetStatus) {
    try {
      setActionLoading(team.id);
      const res = await adminUpdateCheckin(team.id, {
        goodies_status: targetStatus,
        goodies_count: targetStatus === "COLLECTED" ? (team.members?.length || 6) : 0,
        goodies_distributed_by: "Admin Swag Desk",
      });
      if (res?.success) {
        showToast(
          targetStatus === "COLLECTED"
            ? `🎁 Goodies Kits Issued to ${team.teamName}!`
            : `↩️ Goodies Status Reset for ${team.teamName}`
        );
        await loadData();
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to update goodies status", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBothCheckinAndGoodies(team) {
    try {
      setActionLoading(team.id);
      const res = await adminUpdateCheckin(team.id, {
        entry_status: "CHECKED_IN",
        goodies_status: "COLLECTED",
        goodies_count: team.members?.length || 6,
        checked_in_by: "Admin Desk",
        goodies_distributed_by: "Admin Desk",
      });
      if (res?.success) {
        showToast(`🎉 Team ${team.teamName} Checked In & Goodies Issued!`);
        await loadData();
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to update checkin & goodies", "error");
    } finally {
      setActionLoading(null);
    }
  }

  // Batch Selection Handlers
  function toggleSelectAll() {
    if (selectedTeamIds.size === filteredTeams.length && filteredTeams.length > 0) {
      setSelectedTeamIds(new Set());
    } else {
      setSelectedTeamIds(new Set(filteredTeams.map((t) => t.id)));
    }
  }

  function toggleSelectTeam(id) {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBatchAction(actionType) {
    if (selectedTeamIds.size === 0) return;
    try {
      setActionLoading("batch");
      const teamIds = Array.from(selectedTeamIds);
      const res = await adminBatchCheckin({
        team_ids: teamIds,
        action: actionType,
        coordinator_name: "Admin Desk",
        goodies_count: 6,
      });
      if (res?.success) {
        showToast(`⚡ Batch ${actionType} completed for ${res.updated_count} teams!`);
        setSelectedTeamIds(new Set());
        await loadData();
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Batch action failed", "error");
    } finally {
      setActionLoading(null);
    }
  }

  // Manual Scan Input Lookup
  function handleScanSubmit(e) {
    e.preventDefault();
    if (!scanInput.trim()) return;
    const term = scanInput.trim().toLowerCase();
    const match = teams.find(
      (t) =>
        (t.registrationId || t.registration_id || "").toLowerCase() === term ||
        (t.teamName || t.team_name || "").toLowerCase() === term ||
        (t.leaderPhone || t.leader_phone || "").includes(term) ||
        (t.leaderEmail || t.leader_email || "").toLowerCase() === term
    );

    if (match) {
      setActiveModalTeam(match);
      setScannerOpen(false);
      setScanInput("");
    } else {
      showToast(`⚠️ No team found matching "${scanInput}"`, "error");
    }
  }

  // Export CSV
  function handleExportCsv() {
    downloadCsv(
      "sih2026-hackathon-entry-and-goodies-log.csv",
      filteredTeams.map((t, idx) => ({
        "Sr No": idx + 1,
        "Team ID": t.registrationId || t.registration_id,
        "Team Name": t.teamName || t.team_name,
        "Leader Name": t.leaderName || t.leader_name,
        "Leader Mobile": t.leaderPhone || t.leader_phone,
        "College": t.college,
        "Stream": t.leaderCourse || t.leader_course || "B.Tech",
        "Entry Status": (t.entryStatus || t.entry_status) === "CHECKED_IN" ? "CHECKED_IN" : "PENDING",
        "Checked-In At": (t.checkedInAt || t.checked_in_at) ? formatDate(t.checkedInAt || t.checked_in_at) : "-",
        "Checked-In By": t.checkedInBy || t.checked_in_by || "-",
        "Desk / Table No": t.deskNumber || t.desk_number || "-",
        "Goodies Status": (t.goodiesStatus || t.goodies_status) === "COLLECTED" ? "COLLECTED" : "PENDING",
        "Goodies Kits Count": t.goodiesCount || t.goodies_count || 0,
        "Goodies Collected At": (t.goodiesCollectedAt || t.goodies_collected_at) ? formatDate(t.goodiesCollectedAt || t.goodies_collected_at) : "-",
        "Goodies Distributed By": t.goodiesDistributedBy || t.goodies_distributed_by || "-",
        "Present Students Count": t.presentMembersCount || t.present_members_count || 0,
        "Payment Status": t.paymentStatus || t.payment_status || "PENDING",
        "Checkin Notes": t.checkinNotes || t.checkin_notes || "",
      }))
    );
  }

  return (
    <div className="space-y-6 text-left pb-16">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3.5 shadow-2xl border-2 font-black text-sm uppercase tracking-wider flex items-center gap-3 transition-all animate-bounce ${
            toastMessage.type === "error"
              ? "bg-rose-900 border-rose-500 text-white"
              : "bg-emerald-950 border-emerald-500 text-emerald-100"
          }`}
        >
          <span>{toastMessage.msg}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/70 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-spidey/10 border border-spidey/30 text-spidey font-mono text-xs font-bold uppercase tracking-wider mb-1.5">
            <Sparkles size={13} className="animate-spin" /> Hackathon Day Operations Desk
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-web flex items-center gap-2.5">
            <PackageCheck className="text-spidey" size={36} /> Team Entry & Goodies Desk
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            Real-time physical check-in verification, ID roster confirmation, and Swag Kit / Goodies distribution management.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setScannerOpen(true)}
            className="rounded-xl border-2 border-spidey bg-spidey px-4 py-2.5 text-xs font-black uppercase text-white hover:bg-spidey/90 transition shadow-comic flex items-center gap-2 cursor-pointer"
          >
            <QrCode size={16} /> 📷 Quick QR / ID Scanner
          </button>

          <button
            onClick={handleExportCsv}
            className="rounded-xl border-2 border-slate-700 bg-white px-3.5 py-2.5 text-xs font-black uppercase text-slate-800 hover:bg-slate-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={15} /> Export Logs
          </button>

          <button
            onClick={() => loadData()}
            disabled={loading}
            className="rounded-xl border-2 border-slate-700 bg-white p-2.5 text-slate-800 hover:bg-slate-50 transition shadow-xs cursor-pointer"
            title="Refresh Teams"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* REAL-TIME KPI STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Teams Card */}
        <div className="rounded-2xl border-2 border-slate-800 bg-white p-4 sm:p-5 shadow-comic text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Total Teams</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Users size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl text-slate-900">{stats.total}</span>
            <span className="text-xs font-bold text-slate-500">Squads</span>
          </div>
          <div className="mt-2 text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <GraduationCap size={14} className="text-slate-400" /> Total Students: {stats.total * 6}
          </div>
        </div>

        {/* Checked In Teams Card */}
        <div className="rounded-2xl border-2 border-emerald-700 bg-emerald-50/70 p-4 sm:p-5 shadow-comic text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Teams Checked In</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300">
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl text-emerald-900">{stats.checkedIn}</span>
            <span className="text-xs font-bold text-emerald-700">/ {stats.total} ({stats.checkedInPercent}%)</span>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 w-full bg-emerald-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.checkedInPercent}%` }}
            />
          </div>
        </div>

        {/* Goodies Kits Distributed Card */}
        <div className="rounded-2xl border-2 border-amber-600 bg-amber-50/70 p-4 sm:p-5 shadow-comic text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">Goodies Kits Issued</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-300">
              <Gift size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl text-amber-950">{stats.goodiesCollected}</span>
            <span className="text-xs font-bold text-amber-800">Teams ({stats.goodiesPercent}%)</span>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 w-full bg-amber-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.goodiesPercent}%` }}
            />
          </div>
        </div>

        {/* Present Students in Venue Card */}
        <div className="rounded-2xl border-2 border-purple-700 bg-purple-50/70 p-4 sm:p-5 shadow-comic text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-900">Students in Venue</span>
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 border border-purple-300">
              <ShieldCheck size={18} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl text-purple-950">{stats.totalPresentStudents}</span>
            <span className="text-xs font-bold text-purple-700">Attendees</span>
          </div>
          <div className="mt-2 text-xs font-bold text-purple-700 flex items-center gap-1.5">
            <Clock size={14} className="text-purple-400" /> Pending Entry: {stats.pendingEntry} Teams
          </div>
        </div>
      </div>

      {/* SEARCH, FILTER TABS & BATCH ACTIONS */}
      <div className="rounded-2xl border-2 border-slate-800 bg-white p-4 sm:p-5 shadow-comic space-y-4">
        {/* Top Controls: Search and Stream Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Team ID, Team Name, Leader Name, Mobile, Student Name or Desk..."
              className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:border-web focus:bg-white focus:outline-hidden transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-500 shrink-0">Stream:</span>
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="rounded-xl border-2 border-slate-300 bg-slate-50 px-3 py-2 text-xs font-black uppercase text-slate-800 focus:border-web focus:outline-hidden"
            >
              <option value="ALL">All Streams</option>
              <option value="B.Tech">B.Tech</option>
              <option value="Diploma">Diploma</option>
              <option value="BCA">BCA</option>
              <option value="MCA">MCA</option>
              <option value="B.Voc">B.Voc</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {[
            { id: "ALL", label: `All Teams (${teams.length})` },
            { id: "CHECKED_IN", label: `✅ Checked In (${stats.checkedIn})` },
            { id: "PENDING_ENTRY", label: `⏳ Pending Entry (${stats.pendingEntry})` },
            { id: "GOODIES_COLLECTED", label: `🎁 Goodies Issued (${stats.goodiesCollected})` },
            { id: "GOODIES_PENDING", label: `🎒 Goodies Pending (${stats.goodiesPending})` },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === pill.id
                  ? "bg-web text-white shadow-comic border-2 border-web"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-transparent"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Batch Operations Toolbar (Visible when items selected) */}
        {selectedTeamIds.size > 0 && (
          <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900">
              <CheckSquare size={16} className="text-amber-700" />
              <span>{selectedTeamIds.size} teams selected</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBatchAction("CHECKIN_AND_GOODIES")}
                disabled={actionLoading === "batch"}
                className="rounded-lg bg-emerald-700 text-white px-3 py-1.5 text-xs font-black uppercase hover:bg-emerald-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={13} /> Batch Check-In & Goodies
              </button>

              <button
                onClick={() => handleBatchAction("CHECKIN")}
                disabled={actionLoading === "batch"}
                className="rounded-lg bg-blue-700 text-white px-3 py-1.5 text-xs font-black uppercase hover:bg-blue-800 transition cursor-pointer"
              >
                Batch Entry Only
              </button>

              <button
                onClick={() => handleBatchAction("GOODIES")}
                disabled={actionLoading === "batch"}
                className="rounded-lg bg-amber-700 text-white px-3 py-1.5 text-xs font-black uppercase hover:bg-amber-800 transition cursor-pointer"
              >
                Batch Goodies Only
              </button>

              <button
                onClick={() => handleBatchAction("RESET")}
                disabled={actionLoading === "batch"}
                className="rounded-lg bg-slate-600 text-white px-2.5 py-1.5 text-xs font-black uppercase hover:bg-slate-700 transition cursor-pointer"
              >
                Reset
              </button>

              <button
                onClick={() => setSelectedTeamIds(new Set())}
                className="rounded-lg bg-white border border-slate-300 text-slate-700 px-2 py-1.5 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TEAMS CHECK-IN TABLE / CARDS */}
      <div className="rounded-2xl border-2 border-slate-800 bg-white shadow-comic overflow-hidden">
        <div className="p-4 border-b-2 border-slate-800 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="p-1 rounded-md hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Select / Deselect All"
            >
              {selectedTeamIds.size > 0 && selectedTeamIds.size === filteredTeams.length ? (
                <CheckSquare size={18} className="text-web" />
              ) : (
                <Square size={18} className="text-slate-400" />
              )}
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">
              Showing {filteredTeams.length} of {teams.length} Teams
            </span>
          </div>

          <span className="text-xs font-bold text-slate-500">
            Click on team to inspect members & details
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw size={36} className="animate-spin text-spidey mx-auto" />
            <p className="text-sm font-black uppercase text-slate-500">Loading Event Desk Teams...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <PackageCheck size={42} className="text-slate-300 mx-auto" />
            <p className="text-base font-black text-slate-700">No teams found matching the filters</p>
            <p className="text-xs text-slate-500">Try changing your search keywords or status filter.</p>
          </div>
        ) : (
          <div className="divide-y-2 divide-slate-100">
            {filteredTeams.map((team, idx) => {
              const isCheckedIn = (team.entryStatus || team.entry_status) === "CHECKED_IN";
              const isGoodiesGiven = (team.goodiesStatus || team.goodies_status) === "COLLECTED";
              const isSelected = selectedTeamIds.has(team.id);
              const membersCount = team.members ? team.members.length : 6;
              const isPaid = (team.paymentStatus || team.payment_status) === "SUCCESS";

              return (
                <div
                  key={team.id}
                  className={`p-4 sm:p-5 transition hover:bg-slate-50/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isSelected ? "bg-amber-50/40" : isCheckedIn ? "bg-emerald-50/20" : ""
                  }`}
                >
                  {/* Left Column: Checkbox, ID, Team Name, Leader Details */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      onClick={() => toggleSelectTeam(team.id)}
                      className="mt-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare size={20} className="text-web" />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black uppercase bg-web text-white px-2.5 py-0.5 rounded-md shadow-xs">
                          {team.registrationId || team.registration_id}
                        </span>

                        <span className="font-display text-lg font-black text-slate-900 truncate">
                          {team.teamName || team.team_name}
                        </span>

                        {team.deskNumber && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-md">
                            <MapPin size={11} /> Table: {team.deskNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-semibold">
                        <span className="flex items-center gap-1 text-slate-900 font-bold">
                          👑 Leader: {team.leaderName || team.leader_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-slate-400" />
                          {team.leaderPhone || team.leader_phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building size={12} className="text-slate-400" />
                          {team.college || "GTMC Nanded"}
                        </span>
                        <span className="flex items-center gap-1 text-spidey font-bold">
                          <GraduationCap size={12} />
                          {team.leaderCourse || team.leader_course || "B.Tech"}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Entry Badge */}
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 size={13} /> Checked In{" "}
                            {team.checkedInAt ? `(${formatDate(team.checkedInAt)})` : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-300">
                            <Clock size={13} /> Entry Pending
                          </span>
                        )}

                        {/* Goodies Badge */}
                        {isGoodiesGiven ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            <Gift size={13} /> Goodies Issued ({team.goodiesCount || membersCount} Kits)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                            <Gift size={13} /> Goodies Pending
                          </span>
                        )}

                        {/* Payment Badge */}
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isPaid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {isPaid ? "Payment: Paid" : "Payment: Pending"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Quick 1-Click Both */}
                    {!isCheckedIn && !isGoodiesGiven ? (
                      <button
                        onClick={() => handleBothCheckinAndGoodies(team)}
                        disabled={actionLoading === team.id}
                        className="rounded-xl bg-spidey hover:bg-spidey/90 text-white px-3.5 py-2 text-xs font-black uppercase tracking-wider shadow-comic flex items-center gap-1.5 transition cursor-pointer"
                        title="Check-in Team & Issue Goodies in 1 click"
                      >
                        <Sparkles size={14} /> Check-In + Goodies
                      </button>
                    ) : (
                      <>
                        {/* Entry Toggle */}
                        <button
                          onClick={() => handleQuickCheckin(team, isCheckedIn ? "PENDING" : "CHECKED_IN")}
                          disabled={actionLoading === team.id}
                          className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                            isCheckedIn
                              ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          {isCheckedIn ? "Checked In ✓" : "Check In"}
                        </button>

                        {/* Goodies Toggle */}
                        <button
                          onClick={() => handleQuickGoodies(team, isGoodiesGiven ? "PENDING" : "COLLECTED")}
                          disabled={actionLoading === team.id}
                          className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                            isGoodiesGiven
                              ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                              : "bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                          }`}
                        >
                          <Gift size={14} />
                          {isGoodiesGiven ? "Goodies Given ✓" : "Give Goodies"}
                        </button>
                      </>
                    )}

                    {/* Detailed Roster & Modal Button */}
                    <button
                      onClick={() => setActiveModalTeam(team)}
                      className="rounded-xl border-2 border-slate-700 bg-white hover:bg-slate-100 text-slate-800 px-3 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1"
                      title="Inspect Team Squad Roster"
                    >
                      <Users size={14} /> Roster ({membersCount})
                    </button>

                    {/* Print Slip Button */}
                    <button
                      onClick={() => setPrintSlipTeam(team)}
                      className="rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 p-2 transition cursor-pointer"
                      title="Print Entry Slip / Badge Slip"
                    >
                      <Printer size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: DETAILED TEAM ROSTER & ATTENDANCE VERIFICATION */}
      {activeModalTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-slate-800 rounded-3xl shadow-comic max-w-2xl w-full p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-black uppercase bg-web text-white px-2.5 py-0.5 rounded-md">
                  {activeModalTeam.registrationId || activeModalTeam.registration_id}
                </span>
                <h3 className="font-display text-2xl text-slate-900 mt-1">
                  {activeModalTeam.teamName || activeModalTeam.team_name}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalTeam(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Team Info Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-700">
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-black">College</span>
                <span>{activeModalTeam.college || "GTMC Nanded"}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-black">Stream & Year</span>
                <span>{activeModalTeam.leaderCourse} ({activeModalTeam.leaderYear || "All Years"})</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-black">Leader Mobile</span>
                <span>{activeModalTeam.leaderPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-black">Assigned Desk / Table</span>
                <span className="font-bold text-web">{activeModalTeam.deskNumber || "Not Assigned"}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-black">Entry Status</span>
                <span className="font-bold text-emerald-700">
                  {(activeModalTeam.entryStatus || activeModalTeam.entry_status) === "CHECKED_IN" ? "Checked In" : "Pending"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] block font-black">Goodies Status</span>
                <span className="font-bold text-amber-700">
                  {(activeModalTeam.goodiesStatus || activeModalTeam.goodies_status) === "COLLECTED" ? "Collected" : "Pending"}
                </span>
              </div>
            </div>

            {/* 6 Squad Members Attendance List */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
                <span>Squad Members Verification (6 Members)</span>
                <span className="text-spidey">Verify ID Cards</span>
              </h4>

              <div className="divide-y divide-slate-100 border-2 border-slate-200 rounded-2xl overflow-hidden">
                {(activeModalTeam.members || []).map((m, mIdx) => (
                  <div
                    key={m.id || mIdx}
                    className="p-3 bg-white flex items-center justify-between text-xs font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 font-bold text-slate-600 flex items-center justify-center text-[11px]">
                        {mIdx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {m.name || m.full_name}
                          {m.isLeader && (
                            <span className="px-1.5 py-0.2 rounded-sm bg-gold text-slate-900 font-black text-[9px] uppercase">
                              Leader
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {m.gender} • {m.course || activeModalTeam.leaderCourse} • {m.branch || activeModalTeam.leaderBranch || "General"}
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Physical ID Verified ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-slate-100">
              <button
                onClick={() => {
                  setPrintSlipTeam(activeModalTeam);
                  setActiveModalTeam(null);
                }}
                className="rounded-xl border-2 border-slate-700 bg-white px-4 py-2.5 text-xs font-black uppercase text-slate-800 hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={15} /> Print Entry Pass
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleQuickGoodies(
                      activeModalTeam,
                      (activeModalTeam.goodiesStatus || activeModalTeam.goodies_status) === "COLLECTED"
                        ? "PENDING"
                        : "COLLECTED"
                    );
                    setActiveModalTeam(null);
                  }}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-xs font-black uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <Gift size={15} /> Toggle Goodies Kit
                </button>

                <button
                  onClick={() => {
                    handleQuickCheckin(
                      activeModalTeam,
                      (activeModalTeam.entryStatus || activeModalTeam.entry_status) === "CHECKED_IN"
                        ? "PENDING"
                        : "CHECKED_IN"
                    );
                    setActiveModalTeam(null);
                  }}
                  className="rounded-xl bg-web hover:bg-spidey text-white px-4 py-2.5 text-xs font-black uppercase shadow-comic transition cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} /> Confirm Check-In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK QR / ID CODE SCANNER DESK */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-800 rounded-3xl shadow-comic max-w-md w-full p-6 space-y-4 text-left animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-display text-xl text-slate-900 flex items-center gap-2">
                <QrCode size={22} className="text-spidey" /> Scan Team QR Pass
              </h3>
              <button
                onClick={() => setScannerOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 bg-slate-900 rounded-2xl border-2 border-dashed border-slate-700 text-center space-y-3 text-white">
              <Camera size={36} className="mx-auto text-gold animate-pulse" />
              <p className="text-xs font-bold text-slate-300">
                Point barcode scanner or enter Registration ID from student pass.
              </p>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1">
                  Registration ID / Team Name / Mobile
                </label>
                <input
                  type="text"
                  autoFocus
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="e.g. SIH26-0001 or 9876543210"
                  className="w-full rounded-xl border-2 border-slate-400 bg-slate-50 px-3.5 py-2.5 text-sm font-black text-slate-900 focus:border-web focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScannerOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-web text-white px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-spidey transition shadow-comic"
                >
                  Find Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE ENTRY PASS / CHECK-IN CONFIRMATION SLIP */}
      {printSlipTeam && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-left text-slate-900">
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-slate-400 pb-4 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-spidey block">
                SIH 2026 INTERNAL HACKATHON • GTMC NANDED
              </span>
              <h2 className="font-display text-2xl font-black tracking-tight text-slate-900">
                OFFICIAL ENTRY & SWAG PASS
              </h2>
              <div className="inline-block font-mono text-sm font-black bg-slate-900 text-white px-3 py-1 rounded-md mt-1">
                {printSlipTeam.registrationId || printSlipTeam.registration_id}
              </div>
            </div>

            {/* Slip Details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-500">Team Name:</span>
                <span className="font-black text-slate-900">{printSlipTeam.teamName || printSlipTeam.team_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-500">Team Leader:</span>
                <span className="font-black">{printSlipTeam.leaderName || printSlipTeam.leader_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-500">College:</span>
                <span className="font-semibold">{printSlipTeam.college}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-500">Assigned Desk / Table:</span>
                <span className="font-black text-web text-sm">{printSlipTeam.deskNumber || "DESK-A1"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-500">Entry Verification:</span>
                <span className="font-bold text-emerald-700">VERIFIED & CONFIRMED ✓</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="font-bold text-slate-500">Swag Kits Issued:</span>
                <span className="font-bold text-amber-700">6 Welcome Kits (Badges + T-shirts + Meal Pass)</span>
              </div>
            </div>

            {/* Squad Members Mini List */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Verified Squad Members:</span>
              <div className="grid grid-cols-2 gap-1 text-[11px] font-semibold text-slate-700">
                {(printSlipTeam.members || []).map((m, i) => (
                  <div key={i} className="truncate">
                    {i + 1}. {m.name || m.full_name}
                  </div>
                ))}
              </div>
            </div>

            {/* Signature Box */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-dashed border-slate-400 text-center text-[11px]">
              <div>
                <div className="h-10 border-b border-slate-400 mb-1" />
                <span className="font-bold text-slate-500">Team Leader Signature</span>
              </div>
              <div>
                <div className="h-10 border-b border-slate-400 mb-1" />
                <span className="font-bold text-slate-500">Desk Coordinator Stamp</span>
              </div>
            </div>

            {/* Slip Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setPrintSlipTeam(null)}
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-xl bg-web text-white px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-spidey transition shadow-comic flex items-center gap-1.5"
              >
                <Printer size={15} /> Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
