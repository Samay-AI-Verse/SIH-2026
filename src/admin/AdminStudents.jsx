import { useEffect, useState, useMemo, useCallback } from "react";
import { 
  GraduationCap, 
  Search, 
  Filter, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Building, 
  User, 
  Award, 
  Eye, 
  X, 
  CheckCircle, 
  Clock, 
  Trash2, 
  RefreshCw, 
  Pencil,
  Copy,
  Check,
  Shield
} from "lucide-react";
import { adminFetchStudents, adminFetchRegistrations, adminVerifyPayment, adminDeleteTeam, subscribeTable } from "../services/apiService";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatINR, formatDate } from "../utils/cn";
import { EditMemberModal } from "../components/ui/EditMemberModal";

export function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [streamFilter, setStreamFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null); // { teamId, member }
  const [deletingId, setDeletingId] = useState(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [studData, teamData] = await Promise.all([
        adminFetchStudents().catch(() => []),
        adminFetchRegistrations().catch(() => [])
      ]);
      setStudents(studData || []);
      setTeams(teamData || []);
    } catch (err) {
      console.error("Failed to load students data:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
    const unsubscribe = subscribeTable("all", () => {
      loadData(false);
    });
    return () => unsubscribe();
  }, [loadData]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        !search ||
        (s.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.phone || "").includes(search) ||
        (s.teamName || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.registrationId || "").toLowerCase().includes(search.toLowerCase());

      const matchesStream = streamFilter === "ALL" || (s.course || "").includes(streamFilter);
      const matchesYear = yearFilter === "ALL" || (s.year || "").includes(yearFilter);
      const matchesRole = roleFilter === "ALL" || (roleFilter === "LEADER" ? s.isLeader : !s.isLeader);
      const matchesGender = genderFilter === "ALL" || (s.gender || "").toLowerCase() === genderFilter.toLowerCase();

      return matchesSearch && matchesStream && matchesYear && matchesRole && matchesGender;
    });
  }, [students, search, streamFilter, yearFilter, roleFilter, genderFilter]);

  const stats = useMemo(() => {
    return {
      total: students.length,
      leaders: students.filter((s) => s.isLeader).length,
      femaleCount: students.filter((s) => (s.gender || "").toLowerCase() === "female").length,
      maleCount: students.filter((s) => (s.gender || "").toLowerCase() === "male").length,
      verifiedCount: students.filter((s) => s.paymentStatus === "SUCCESS" || s.paymentStatus === "CONFIRMED").length,
    };
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-web flex items-center gap-2">
            <GraduationCap className="text-spidey shrink-0" size={32} /> Student Directory & Roster Explorer
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            Comprehensive student database across {teams.length} registered teams. Search, filter by degree stream, and view individual member profiles.
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-2xl border-2 border-web/20 bg-white p-4 text-center shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Students</p>
          <p className="mt-1 font-display text-3xl text-web">{stats.total}</p>
        </div>
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4 text-center shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Team Leaders</p>
          <p className="mt-1 font-display text-3xl text-web">{stats.leaders}</p>
        </div>
        <div className="rounded-2xl border-2 border-pink-200 bg-pink-50/60 p-4 text-center shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-pink-700">Female Students</p>
          <p className="mt-1 font-display text-3xl text-pink-700">{stats.femaleCount}</p>
        </div>
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-4 text-center shadow-xs">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Male Students</p>
          <p className="mt-1 font-display text-3xl text-blue-700">{stats.maleCount}</p>
        </div>
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-4 text-center shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Verified Paid</p>
          <p className="mt-1 font-display text-3xl text-emerald-700">{stats.verifiedCount}</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-2xl border-2 border-web/20 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Student Name, Email, Mobile, Team Name, or Reg ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-2 border-web/20 bg-slate-50 py-2.5 pl-10 pr-8 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs font-bold">
          <span className="flex items-center gap-1 text-slate-500 font-black uppercase tracking-wider text-[10px] mr-1">
            <Filter size={12} /> Filters:
          </span>

          {/* Stream Filter */}
          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value)}
            className="rounded-lg border-2 border-web/20 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-web focus:outline-none"
          >
            <option value="ALL">Degree: All Streams</option>
            <option value="B.Tech">B.Tech (4 Years)</option>
            <option value="Diploma">Diploma (3 Years)</option>
            <option value="B.Voc">B.Voc (3 Years)</option>
            <option value="BCA">BCA / MCA</option>
          </select>

          {/* Year Filter */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-lg border-2 border-web/20 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-web focus:outline-none"
          >
            <option value="ALL">Study Year: All Years</option>
            <option value="1st">1st Year</option>
            <option value="2nd">2nd Year</option>
            <option value="3rd">3rd Year</option>
            <option value="4th">4th Year</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border-2 border-web/20 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-web focus:outline-none"
          >
            <option value="ALL">Role: All Members</option>
            <option value="LEADER">Team Leaders Only</option>
            <option value="MEMBER">Team Members Only</option>
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="rounded-lg border-2 border-web/20 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-web focus:outline-none"
          >
            <option value="ALL">Gender: All</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </select>

          {(streamFilter !== "ALL" || yearFilter !== "ALL" || roleFilter !== "ALL" || genderFilter !== "ALL" || search) && (
            <button
              onClick={() => {
                setStreamFilter("ALL");
                setYearFilter("ALL");
                setRoleFilter("ALL");
                setGenderFilter("ALL");
                setSearch("");
              }}
              className="rounded-lg bg-spidey/10 text-spidey px-2.5 py-1.5 text-xs font-black uppercase hover:bg-spidey hover:text-white transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Student List Table */}
      <div className="overflow-hidden rounded-2xl border-2 border-web/20 bg-white shadow-sm">
        <div className="p-4 bg-web text-white flex items-center justify-between">
          <p className="font-display text-xl sm:text-2xl tracking-wide flex items-center gap-3">
            Registered Students List ({filteredStudents.length})
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              className="inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 text-white px-3 py-1 text-xs font-bold transition"
              title="Refresh Data"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <span className="text-xs font-black uppercase tracking-wider bg-gold text-web px-3 py-1 rounded-full">
              GTMC NANDED ROSTER
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold">
            No students found matching your criteria. Try adjusting your search query or filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[1020px] divide-y divide-slate-200">
              <thead className="bg-slate-50 font-ui text-xs font-black uppercase tracking-wider text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-64">Student Name & Role</th>
                  <th className="px-4 py-3.5 w-44">Reg Date & Time</th>
                  <th className="px-4 py-3.5 w-56">Team & Reg ID</th>
                  <th className="px-4 py-3.5 w-60">Contact (Email & Phone)</th>
                  <th className="px-4 py-3.5 w-44">Degree & Branch</th>
                  <th className="px-4 py-3.5 w-28">Year</th>
                  <th className="px-4 py-3.5 w-40">Payment</th>
                  <th className="px-4 py-3.5 text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredStudents.map((s) => {
                  const targetTeam = teams.find((t) => t.id === s.teamId);
                  const regDateTime = targetTeam?.registeredAt || targetTeam?.registered_at || targetTeam?.created_at;
                  const isFemale = (s.gender || "").toLowerCase() === "female";

                  return (
                    <tr key={s.id} className="hover:bg-amber-50/40 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-ink flex items-center gap-2">
                          <span className="text-sm">{s.fullName}</span>
                          {s.isLeader ? (
                            <span className="rounded bg-gold px-1.5 py-0.5 text-[9px] font-black uppercase text-web shadow-2xs">
                              👑 Leader
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-600">
                              Member
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className={isFemale ? "text-pink-600 font-bold" : "text-blue-600 font-bold"}>
                            {s.gender}
                          </span>
                          {s.studentId && <span>• ID: {s.studentId}</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-mono font-bold text-slate-600 whitespace-nowrap">
                        {formatDate(regDateTime)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-web truncate max-w-[200px]" title={s.teamName}>{s.teamName}</div>
                        <div className="text-xs font-mono font-bold text-spidey">{s.registrationId}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                        <div className="truncate max-w-[200px]" title={s.email}>{s.email || "—"}</div>
                        <div className="text-slate-500 font-mono mt-0.5">{s.phone || "—"}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                        <div className="font-bold text-web">{s.course || "B.Tech"}</div>
                        <div className="text-slate-500">{s.branch || "CSE"}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                        {s.year || "3rd Year"}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={s.paymentStatus} />
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setEditingStudent({ teamId: s.teamId, member: s })}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500 bg-gold/20 hover:bg-gold px-2.5 py-1.5 text-xs font-bold text-web transition shadow-2xs"
                            title="Edit Student Details"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          {targetTeam && (
                            <button
                              onClick={() => setSelectedTeam(targetTeam)}
                              className="inline-flex items-center gap-1 rounded-lg border border-web/30 bg-white px-2.5 py-1.5 text-xs font-bold text-web hover:bg-web hover:text-white transition shadow-2xs"
                              title="View Full Team"
                            >
                              <Eye size={13} /> Team
                            </button>
                          )}
                          <button
                            disabled={deletingId === s.teamId}
                            onClick={async () => {
                              if (!window.confirm(`Are you sure you want to permanently delete Team '${s.teamName}' and all its members from database?`)) return;
                              setDeletingId(s.teamId);
                              try {
                                await adminDeleteTeam(s.teamId);
                                await loadData(false);
                              } catch (err) {
                                alert("Failed to delete team: " + err.message);
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            className="rounded-lg border border-red-500 bg-red-50 text-red-600 p-1.5 text-xs font-bold hover:bg-red-600 hover:text-white transition disabled:opacity-50"
                            title="Delete Team & Members"
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

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl border-3 sm:border-4 border-web bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
            {/* Sticky Header */}
            <div className="shrink-0 px-5 sm:px-6 py-4 bg-slate-900 text-white border-b-2 border-gold/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-xl border-2 border-gold bg-gold px-3 py-1 font-display text-xl sm:text-2xl text-web shrink-0 shadow-comic">
                  {selectedTeam.registrationId}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl sm:text-3xl text-gold truncate tracking-wide">{selectedTeam.teamName}</h2>
                  <p className="text-xs font-semibold text-slate-300 truncate mt-0.5">
                    {selectedTeam.college || "GTMC Nanded"} · Leader: <span className="text-gold font-bold">{selectedTeam.leaderName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTeam(null)}
                className="shrink-0 rounded-full border border-white/30 bg-white/10 p-2 text-white hover:bg-rose-600 hover:border-rose-600 transition shadow-xs"
                title="Close Profile"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
              {/* Problem Statement Details */}
              <div className="rounded-2xl border-2 border-web/15 bg-white p-4 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Selected Problem / Open Innovation</p>
                <p className="mt-1 font-bold text-web text-base">
                  {selectedTeam.isOpenInnovation
                    ? `🚀 ${selectedTeam.openInnovationTitle || "Open Innovation Project"}`
                    : selectedTeam.selectedProblemTitle || "Not Selected Yet"}
                </p>
              </div>

              {/* Roster Grid */}
              <div>
                <h3 className="font-display text-2xl text-web mb-3 flex items-center gap-2">
                  <GraduationCap className="text-spidey" size={24} /> 6-Member Student Roster ({selectedTeam.members?.length || 6})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {selectedTeam.members?.map((m, idx) => {
                    const isLeader = m.isLeader || idx === 0;
                    const isFemale = (m.gender || "").toLowerCase() === "female";
                    const memberName = m.name || m.full_name || `Member #${idx + 1}`;
                    const memberEmail = m.email || selectedTeam.email;
                    const memberPhone = m.phone || selectedTeam.phone;
                    const memberCourse = m.course || m.stream || selectedTeam.leaderCourse || "B.Tech";
                    const memberBranch = m.branch || selectedTeam.leaderBranch || "CSE";
                    const memberYear = m.year || selectedTeam.leaderYear || "3rd Year";
                    const memberGender = m.gender || (isLeader ? selectedTeam.leaderGender : "Male") || "Male";

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
                          <div className="flex items-start justify-between gap-2 pr-8">
                            <div>
                              <div className="font-bold text-ink text-sm sm:text-base leading-tight">
                                {memberName}
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

                          <button
                            type="button"
                            onClick={() => setEditingStudent({ teamId: selectedTeam.id, member: m })}
                            className="absolute right-3 top-3 rounded-lg border border-web/20 bg-white p-1.5 text-slate-600 hover:bg-gold hover:text-web transition shadow-2xs"
                            title="Edit Student Member Details"
                          >
                            <Pencil size={13} />
                          </button>

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

            {/* Sticky Footer */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
              {selectedTeam.paymentStatus !== "SUCCESS" && selectedTeam.registrationStatus !== "CONFIRMED" ? (
                <button
                  onClick={async () => {
                    await adminVerifyPayment(selectedTeam.id, "SUCCESS", "Manual Admin Approval");
                    setSelectedTeam(null);
                    await loadData(false);
                  }}
                  className="rounded-xl border-2 border-emerald-700 bg-emerald-600 px-4 py-2 font-ui text-xs sm:text-sm font-black uppercase text-white hover:bg-emerald-700 transition shadow-2xs"
                >
                  ✓ Approve & Verify Team
                </button>
              ) : (
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600">✓ Team Verified & Approved</span>
              )}
              <button
                onClick={() => setSelectedTeam(null)}
                className="rounded-xl border-2 border-slate-300 bg-slate-100 px-5 py-2 font-ui text-xs sm:text-sm font-black uppercase text-slate-700 hover:bg-slate-200 transition shadow-2xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editingStudent && (
        <EditMemberModal
          teamId={editingStudent.teamId}
          member={editingStudent.member}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => loadData(false)}
        />
      )}
    </div>
  );
}
