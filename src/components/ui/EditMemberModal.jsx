import { useState } from "react";
import { X, UserCheck, Save, AlertCircle } from "lucide-react";
import { updateTeamMember } from "../../services/apiService";
import { Button } from "./Button";

export function EditMemberModal({ teamId, member, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: member.name || member.full_name || "",
    email: member.email || "",
    phone: member.phone || "",
    gender: member.gender || "Male",
    course: member.course || member.stream || "B.Tech",
    branch: member.branch || "",
    year: member.year || "3rd Year",
    studentId: member.studentId || member.student_id || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Member full name cannot be empty.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateTeamMember(teamId, member.id, {
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        course: formData.course.trim(),
        branch: formData.branch.trim(),
        year: formData.year.trim(),
        student_id: formData.studentId.trim(),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to update member details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border-4 border-web bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border-2 border-slate-300 bg-slate-100 p-2 text-ink hover:bg-spidey hover:text-white transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 text-web mb-4">
          <div className="rounded-2xl bg-gold/30 p-3 border-2 border-web/20 text-web">
            <UserCheck size={24} />
          </div>
          <div>
            <h3 className="font-display text-2xl text-web">Edit Student Member Profile</h3>
            <p className="text-xs font-bold text-slate-500">
              Update spelling errors, contact details, or replace team roster member
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border-2 border-rose-400 bg-rose-50 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Member Name */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
              Full Student Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
              placeholder="Full Name..."
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                placeholder="10-digit Mobile..."
              />
            </div>
          </div>

          {/* Gender & Degree */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Degree Stream
              </label>
              <select
                value={formData.course}
                onChange={(e) => handleChange("course", e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:outline-none"
              >
                <option value="B.Tech">B.Tech</option>
                <option value="Diploma">Diploma</option>
                <option value="B.Voc">B.Voc</option>
                <option value="BCA">BCA / MCA</option>
              </select>
            </div>
          </div>

          {/* Branch & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Branch / Specialization
              </label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => handleChange("branch", e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                placeholder="e.g. CSE / IT / AIDS / ME"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                Year of Study
              </label>
              <select
                value={formData.year}
                onChange={(e) => handleChange("year", e.target.value)}
                className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:outline-none"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          {/* Student ID / Roll Number */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
              Student ID / PRN Number (Optional)
            </label>
            <input
              type="text"
              value={formData.studentId}
              onChange={(e) => handleChange("studentId", e.target.value)}
              className="w-full rounded-xl border-2 border-web/30 bg-slate-50 p-2.5 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
              placeholder="e.g. 2024101920"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-slate-300 px-4 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 py-2 px-5 text-xs font-black uppercase bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Save size={14} /> {saving ? "Saving..." : "Save Member Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
