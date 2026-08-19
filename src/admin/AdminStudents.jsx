import { useEffect, useState, useMemo } from "react";
import { GraduationCap, Search, Filter, ShieldCheck, Mail, Phone, Building, User, Award, Eye, X, CheckCircle, Clock } from "lucide-react";
import { adminFetchStudents, adminFetchRegistrations, adminVerifyPayment } from "../services/apiService";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatINR } from "../utils/cn";

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

  useEffect(() => {
    async function loadData() {
      setLoading(true);
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
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
      verifiedCount: students.filter((s) => s.paymentStatus === "SUCCESS").length,
    };
  }, [students]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-web flex items-center gap-2">
            <GraduationCap className="text-spidey" size={36} /> Student Directory & Roster Explorer
          </h1>
          <p className="text-xs sm:text-sm font-bold text-ink/70">
            Comprehensive student database across all {teams.length} registered teams. Search, filter by degree stream, and view individual member profiles.
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border-2 border-web bg-white p-4 text-center shadow-[4px_4px_0_#071433]">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Students</p>
          <p className="mt-1 font-display text-3xl text-web">{stats.total}</p>
        </div>
        <div className="rounded-2xl border-2 border-web bg-gold/20 p-4 text-center shadow-[4px_4px_0_#071433]">
          <p className="text-[10px] font-black uppercase tracking-wider text-web font-extrabold">Team Leaders</p>
          <p className="mt-1 font-display text-3xl text-web">{stats.leaders}</p>
        </div>
        <div className="rounded-2xl border-2 border-web bg-pink-50 p-4 text-center shadow-[4px_4px_0_#071433]">
          <p className="text-[10px] font-black uppercase tracking-wider text-pink-700">Female Participants</p>
          <p className="mt-1 font-display text-3xl text-pink-700">{stats.femaleCount}</p>
        </div>
        <div className="rounded-2xl border-2 border-web bg-blue-50 p-4 text-center shadow-[4px_4px_0_#071433]">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Male Participants</p>
          <p className="mt-1 font-display text-3xl text-blue-700">{stats.maleCount}</p>
        </div>
        <div className="rounded-2xl border-2 border-web bg-emerald-50 p-4 text-center shadow-[4px_4px_0_#071433] col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Verified Paid</p>
          <p className="mt-1 font-display text-3xl text-emerald-700">{stats.verifiedCount}</p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="rounded-2xl border-3 border-web bg-white p-4 shadow-[4px_4px_0_#071433] space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Student Name, Email, Mobile, Team Name, or Reg ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border-2 border-web/30 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
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
      <div className="overflow-hidden rounded-2xl border-3 border-web bg-white shadow-[6px_6px_0_#071433]">
        <div className="p-4 bg-web text-white flex items-center justify-between">
          <p className="font-display text-2xl tracking-wide">
            Registered Students List ({filteredStudents.length})
          </p>
          <span className="text-xs font-bold uppercase tracking-wider bg-gold text-ink px-2.5 py-0.5 rounded-full">
            GTMC Nanded Roster
          </span>
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
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 font-ui text-xs font-black uppercase tracking-wider text-slate-700 border-b-2 border-web/20">
                <tr>
                  <th className="px-4 py-3">Student Name & Role</th>
                  <th className="px-4 py-3">Team & Reg ID</th>
                  <th className="px-4 py-3">Contact (Email & Phone)</th>
                  <th className="px-4 py-3">Degree & Branch</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.map((s) => {
                  const targetTeam = teams.find((t) => t.id === s.teamId);
                  return (
                    <tr key={s.id} className="hover:bg-amber-50/50 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-ink flex items-center gap-2">
                          <span>{s.fullName}</span>
                          {s.isLeader ? (
                            <span className="rounded bg-gold px-1.5 py-0.5 text-[9px] font-black uppercase text-ink shadow-xs">
                              Leader
                            </span>
                          ) : (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-slate-700">
                              Member
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className={s.gender === "Female" ? "text-pink-600 font-bold" : "text-blue-600 font-bold"}>
                            {s.gender}
                          </span>
                          {s.studentId && <span>• ID: {s.studentId}</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-web">{s.teamName}</div>
                        <div className="text-xs font-mono font-bold text-slate-500">{s.registrationId}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                        <div>{s.email || "—"}</div>
                        <div className="text-slate-500 font-mono">{s.phone || "—"}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                        <div>{s.course || "B.Tech"}</div>
                        <div className="text-slate-500">{s.branch || "CSE"}</div>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                        {s.year || "3rd Year"}
                      </td>

                      <td className="px-4 py-3.5">
                        <StatusBadge status={s.paymentStatus} />
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {targetTeam && (
                          <button
                            onClick={() => setSelectedTeam(targetTeam)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-web bg-web/10 px-3 py-1.5 text-xs font-black uppercase text-web hover:bg-web hover:text-white transition"
                          >
                            <Eye size={13} /> View Team
                          </button>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border-4 border-web bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedTeam(null)}
              className="absolute right-4 top-4 rounded-full border-2 border-web bg-slate-100 p-2 text-ink hover:bg-spidey hover:text-white transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border-2 border-web bg-gold p-3 font-display text-2xl text-web">
                {selectedTeam.registrationId}
              </div>
              <div>
                <h2 className="font-display text-3xl text-web">{selectedTeam.teamName}</h2>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {selectedTeam.college} · {selectedTeam.leaderCourse} ({selectedTeam.members?.length || 6} Members)
                </p>
              </div>
            </div>

            {/* Problem Statement Details */}
            <div className="mt-5 rounded-2xl border-2 border-web/20 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected Problem / Open Innovation</p>
              <p className="mt-1 font-bold text-web text-base">
                {selectedTeam.isOpenInnovation
                  ? `🚀 ${selectedTeam.openInnovationTitle || "Open Innovation Project"}`
                  : selectedTeam.selectedProblemTitle || "Not Selected Yet"}
              </p>
            </div>

            {/* Roster Grid */}
            <div className="mt-6">
              <h3 className="font-display text-xl text-web mb-3">6-Member Roster Roster Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedTeam.members?.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className={`rounded-xl border-2 p-3 text-xs ${
                      m.isLeader ? "border-web bg-gold/20" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-ink">
                      <span>{m.name}</span>
                      {m.isLeader && <span className="rounded bg-gold px-1.5 py-0.5 text-[9px] font-black text-web">LEADER</span>}
                    </div>
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

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              {selectedTeam.paymentStatus !== "SUCCESS" ? (
                <button
                  onClick={async () => {
                    await adminVerifyPayment(selectedTeam.id, "SUCCESS", "Manual Admin Approval");
                    setSelectedTeam(null);
                    const [studData, teamData] = await Promise.all([
                      adminFetchStudents().catch(() => []),
                      adminFetchRegistrations().catch(() => [])
                    ]);
                    setStudents(studData || []);
                    setTeams(teamData || []);
                  }}
                  className="rounded-xl border-2 border-emerald-700 bg-emerald-600 px-5 py-2 font-ui text-xs sm:text-sm font-black uppercase text-white hover:bg-emerald-700 transition"
                >
                  ✓ Approve & Verify Team
                </button>
              ) : (
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600">✓ Team Verified & Approved</span>
              )}
              <button
                onClick={() => setSelectedTeam(null)}
                className="rounded-xl border-2 border-web bg-web px-6 py-2 font-ui text-xs sm:text-sm font-black uppercase text-white hover:bg-spidey transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
