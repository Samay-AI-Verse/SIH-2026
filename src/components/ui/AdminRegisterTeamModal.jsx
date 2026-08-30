import { useState } from "react";
import { X, UserPlus, Crown, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { adminRegisterTeam } from "../../services/apiService";
import { STREAMS_CONFIG, BRANCHES } from "../../utils/constants";

export function AdminRegisterTeamModal({ onClose, onSuccess }) {
  const [stream, setStream] = useState("B.Tech");
  const [teamName, setTeamName] = useState("");
  const [college, setCollege] = useState("GTMC Nanded");
  const [city, setCity] = useState("Nanded");
  const [state, setState] = useState("Maharashtra");

  // Leader
  const [leader, setLeader] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "Male",
    branch: "Computer Engineering",
    year: "3rd Year",
    studentId: "",
  });

  // 5 Members
  const [members, setMembers] = useState([
    { name: "", email: "", phone: "", gender: "Female", branch: "Computer Engineering", year: "3rd Year", studentId: "" },
    { name: "", email: "", phone: "", gender: "Male", branch: "Computer Engineering", year: "3rd Year", studentId: "" },
    { name: "", email: "", phone: "", gender: "Male", branch: "Computer Engineering", year: "3rd Year", studentId: "" },
    { name: "", email: "", phone: "", gender: "Male", branch: "Computer Engineering", year: "3rd Year", studentId: "" },
    { name: "", email: "", phone: "", gender: "Male", branch: "Computer Engineering", year: "3rd Year", studentId: "" },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const streamInfo = STREAMS_CONFIG[stream] || STREAMS_CONFIG["B.Tech"];

  function handleMemberChange(idx, field, val) {
    setMembers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!teamName.trim() || teamName.trim().length < 3) {
      setError("Team name must be at least 3 characters long.");
      return;
    }
    if (!leader.name.trim() || !leader.email.trim() || !leader.phone.trim()) {
      setError("Please fill all Leader required details (Name, Email, Phone).");
      return;
    }

    // Check all members
    for (let i = 0; i < members.length; i++) {
      if (!members[i].name.trim()) {
        setError(`Please enter the name for Member #${i + 1}.`);
        return;
      }
    }

    // Check female constraint
    const allMembers = [leader, ...members];
    const hasFemale = allMembers.some((m) => String(m.gender).toLowerCase() === "female");
    if (!hasFemale) {
      setError("SIH guidelines require at least 1 female team member in the 6-member squad.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        team_name: teamName.trim(),
        college: college.trim() || "GTMC Nanded",
        university: college.trim() || "GTMC Nanded",
        city: city.trim() || "Nanded",
        state: state.trim() || "Maharashtra",
        leader_name: leader.name.trim(),
        leader_email: leader.email.trim().toLowerCase(),
        leader_phone: leader.phone.trim(),
        leader_gender: leader.gender,
        leader_course: stream,
        leader_branch: leader.branch,
        leader_year: leader.year,
        leader_student_id: leader.studentId.trim(),
        members: allMembers.map((m, idx) => ({
          full_name: m.name.trim(),
          email: (m.email || (idx === 0 ? leader.email : `member${idx + 1}@gtmc.ac.in`)).trim().toLowerCase(),
          phone: (m.phone || (idx === 0 ? leader.phone : "9999999999")).trim(),
          gender: m.gender,
          college: college.trim() || "GTMC Nanded",
          course: stream,
          branch: m.branch,
          year: m.year,
          student_id: m.studentId?.trim() || "",
        })),
      };

      await adminRegisterTeam(payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register team.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 md:p-6 overflow-hidden">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border-3 border-web bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 bg-web text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-gold p-2 text-web">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-display text-2xl text-gold">Admin Direct Team Registration</h3>
              <p className="text-xs text-white/80">Manually register and approve a 6-member squad.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-rose-600 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-xl border-2 border-rose-400 bg-rose-50 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Section 1: Team & Stream */}
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 space-y-3">
            <span className="text-xs font-black uppercase text-web block">1. Team & College Info</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Stream / Degree *</label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                >
                  {Object.keys(STREAMS_CONFIG).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Team Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Cyber Guardians"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">College Name</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Leader Details */}
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4 space-y-3">
            <span className="text-xs font-black uppercase text-amber-800 flex items-center gap-1.5">
              <Crown size={14} className="text-gold" /> 2. Team Leader (Member #1)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Leader Full Name *</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={leader.name}
                  onChange={(e) => setLeader({ ...leader, name: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Leader Email *</label>
                <input
                  type="email"
                  placeholder="leader@gmail.com"
                  value={leader.email}
                  onChange={(e) => setLeader({ ...leader, email: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Leader Phone *</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={leader.phone}
                  onChange={(e) => setLeader({ ...leader, phone: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Gender *</label>
                <select
                  value={leader.gender}
                  onChange={(e) => setLeader({ ...leader, gender: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Branch</label>
                <select
                  value={leader.branch}
                  onChange={(e) => setLeader({ ...leader, branch: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                >
                  {streamInfo.branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Year</label>
                <select
                  value={leader.year}
                  onChange={(e) => setLeader({ ...leader, year: e.target.value })}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white p-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                >
                  {streamInfo.years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: 5 Team Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-web flex items-center gap-1">
                <Users size={14} className="text-spidey" /> 3. Remaining 5 Squad Members
              </span>
              <span className="text-[10px] font-bold text-slate-500">Ensure at least 1 female in team</span>
            </div>

            <div className="space-y-2.5">
              {members.map((m, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase text-web">Member #{idx + 2}</span>
                    <select
                      value={m.gender}
                      onChange={(e) => handleMemberChange(idx, "gender", e.target.value)}
                      className={`text-[10px] font-black rounded px-2 py-0.5 border ${
                        m.gender === "Female" ? "bg-pink-50 text-pink-700 border-pink-300" : "bg-blue-50 text-blue-700 border-blue-300"
                      }`}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder={`Member ${idx + 2} Full Name *`}
                      value={m.name}
                      onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-bold text-ink focus:border-web focus:outline-none"
                      required
                    />

                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={m.email}
                      onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-bold text-ink focus:border-web focus:outline-none"
                    />

                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={m.phone}
                      onChange={(e) => handleMemberChange(idx, "phone", e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-bold text-ink focus:border-web focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 text-xs font-black uppercase transition disabled:opacity-50 shadow-xs"
          >
            {saving ? "Registering Squad..." : "Create & Confirm Squad ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
