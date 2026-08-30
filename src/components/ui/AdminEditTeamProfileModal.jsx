import { useState } from "react";
import { X, Shield, Save, AlertCircle, Building, CheckCircle2, User, Hash, GraduationCap } from "lucide-react";
import { adminUpdateTeamProfile } from "../../services/apiService";
import { Button } from "./Button";

export function AdminEditTeamProfileModal({ team, onClose, onSuccess }) {
  const [form, setForm] = useState({
    registrationId: team.registrationId || team.registration_id || "",
    teamName: team.teamName || team.team_name || "",
    college: team.college || "GTMC Nanded",
    leaderCourse: team.leaderCourse || team.leader_course || team.stream || "B.Tech",
    leaderBranch: team.leaderBranch || team.leader_branch || "",
    leaderYear: team.leaderYear || team.leader_year || "3rd Year",
    leaderName: team.leaderName || team.leader_name || "",
    leaderEmail: team.email || team.leader_email || "",
    leaderPhone: team.phone || team.leader_phone || "",
    leaderGender: team.gender || team.leader_gender || "Male",
    leaderStudentId: team.studentId || team.leader_student_id || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function handleChange(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.teamName.trim()) {
      setError("Team name is required.");
      return;
    }
    if (!form.registrationId.trim()) {
      setError("Team Registration ID is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      await adminUpdateTeamProfile(team.id, {
        team_name: form.teamName.trim(),
        registration_id: form.registrationId.trim().toUpperCase(),
        college: form.college.trim(),
        leader_course: form.leaderCourse.trim(),
        leader_branch: form.leaderBranch.trim(),
        leader_year: form.leaderYear.trim(),
        leader_name: form.leaderName.trim(),
        leader_email: form.leaderEmail.trim(),
        leader_phone: form.leaderPhone.trim(),
        leader_gender: form.leaderGender,
        leader_student_id: form.leaderStudentId.trim(),
      });

      setSuccessMsg("Team profile and stream/ID updated successfully!");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err?.message || "Failed to update team profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 md:p-6 overflow-hidden">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border-3 border-web bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="shrink-0 px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-web min-w-0">
            <div className="rounded-2xl bg-gold/30 p-2.5 border-2 border-web/20 text-web shrink-0">
              <Shield size={22} className="text-spidey" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-xl sm:text-2xl text-web truncate">
                Edit Team Profile & Stream
              </h3>
              <p className="text-xs font-bold text-slate-500 truncate">
                Fix Stream (B.Tech / Diploma), Team ID, Department, Year or College
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border-2 border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition shadow-xs cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {error && (
              <div className="rounded-xl border-2 border-rose-400 bg-rose-50 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border-2 border-emerald-400 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Row 1: Team ID & Team Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                  <Hash size={13} className="text-spidey" /> Team Registration ID *
                </label>
                <input
                  type="text"
                  required
                  value={form.registrationId}
                  onChange={(e) => handleChange("registrationId", e.target.value)}
                  className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-black uppercase text-web focus:border-web focus:bg-white focus:outline-hidden font-mono"
                  placeholder="e.g. ENGG-SIH-01 / DIPLOMA-SIH-05"
                />
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Format: ENGG-SIH-XX, DIPLOMA-SIH-XX, BVOC-SIH-XX
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.teamName}
                  onChange={(e) => handleChange("teamName", e.target.value)}
                  className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-hidden"
                  placeholder="Official Squad Name..."
                />
              </div>
            </div>

            {/* Row 2: Stream / Course & Department / Branch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                  <GraduationCap size={13} className="text-spidey" /> Degree Stream / Domain *
                </label>
                <select
                  value={form.leaderCourse}
                  onChange={(e) => handleChange("leaderCourse", e.target.value)}
                  className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:outline-hidden"
                >
                  <option value="B.Tech">B.Tech / B.E. (Engineering)</option>
                  <option value="Diploma">Diploma (Polytechnic)</option>
                  <option value="B.Voc">B.Voc (Vocational)</option>
                  <option value="BCA">BCA (Computer Applications)</option>
                  <option value="MCA">MCA (Master of Computer App)</option>
                  <option value="B.Sc">B.Sc / M.Sc</option>
                  <option value="Pharmacy">Pharmacy (B.Pharm / D.Pharm)</option>
                  <option value="Other">Other Degree / Course</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Department / Branch
                </label>
                <input
                  type="text"
                  value={form.leaderBranch}
                  onChange={(e) => handleChange("leaderBranch", e.target.value)}
                  className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-hidden"
                  placeholder="e.g. CSE / IT / AIDS / Mechanical / Civil"
                />
              </div>
            </div>

            {/* Row 3: Year of Study & College */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  Study Year
                </label>
                <select
                  value={form.leaderYear}
                  onChange={(e) => handleChange("leaderYear", e.target.value)}
                  className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:outline-hidden"
                >
                  <option value="1st Year">1st Year (FE / FY)</option>
                  <option value="2nd Year">2nd Year (SE / SY)</option>
                  <option value="3rd Year">3rd Year (TE / TY)</option>
                  <option value="4th Year">4th Year (BE / Final Year)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                  <Building size={13} className="text-spidey" /> College / Institution
                </label>
                <input
                  type="text"
                  value={form.college}
                  onChange={(e) => handleChange("college", e.target.value)}
                  className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-hidden"
                  placeholder="College Name..."
                />
              </div>
            </div>

            {/* Section: Leader Info */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">
                Team Leader Contact Info
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Leader Name
                  </label>
                  <input
                    type="text"
                    value={form.leaderName}
                    onChange={(e) => handleChange("leaderName", e.target.value)}
                    className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Leader Email
                  </label>
                  <input
                    type="email"
                    value={form.leaderEmail}
                    onChange={(e) => handleChange("leaderEmail", e.target.value)}
                    className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Leader Phone
                  </label>
                  <input
                    type="text"
                    value={form.leaderPhone}
                    onChange={(e) => handleChange("leaderPhone", e.target.value)}
                    className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-slate-300 px-4 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-web hover:bg-spidey text-white px-5 py-2 text-xs font-black uppercase shadow-comic flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} /> {saving ? "Saving Changes..." : "Save Team Profile ✓"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
