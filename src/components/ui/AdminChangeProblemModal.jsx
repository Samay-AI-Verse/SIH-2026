import { useState, useEffect } from "react";
import { X, Search, Sparkles, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { fetchProblems, adminUpdateTeamProblemStatement } from "../../services/apiService";

export function AdminChangeProblemModal({ team, onClose, onSuccess }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [mode, setMode] = useState(
    team?.isOpenInnovation || team?.is_open_innovation ? "open_innovation" : "sih_problem"
  );
  const [search, setSearch] = useState("");
  const [selectedPsId, setSelectedPsId] = useState(team?.selectedProblemId || team?.selected_problem_id || "");
  const [customPsId, setCustomPsId] = useState("");
  const [customPsTitle, setCustomPsTitle] = useState("");
  const [openInnoTitle, setOpenInnoTitle] = useState(team?.openInnovationTitle || team?.open_innovation_title || "");
  const [openInnoDesc, setOpenInnoDesc] = useState(team?.openInnovationDescription || team?.open_innovation_description || "");

  useEffect(() => {
    fetchProblems()
      .then((res) => setProblems(res || []))
      .catch((err) => console.error("Failed to load problems:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProblems = problems.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      (p.id || "").toLowerCase().includes(q) ||
      (p.code || "").toLowerCase().includes(q) ||
      (p.title || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
  });

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      if (mode === "clear") {
        await adminUpdateTeamProblemStatement(team.id, { clear_selection: true });
      } else if (mode === "open_innovation") {
        if (!openInnoTitle.trim()) {
          setError("Please enter a title for the Open Innovation project.");
          setSaving(false);
          return;
        }
        await adminUpdateTeamProblemStatement(team.id, {
          is_open_innovation: true,
          open_innovation_title: openInnoTitle.trim(),
          open_innovation_description: openInnoDesc.trim(),
        });
      } else {
        // Official SIH problem statement
        const finalId = (customPsId.trim() || selectedPsId).trim();
        if (!finalId) {
          setError("Please select or enter a Problem Statement ID.");
          setSaving(false);
          return;
        }
        const probObj = problems.find((p) => p.id === finalId);
        const finalTitle = customPsTitle.trim() || probObj?.title || finalId;

        await adminUpdateTeamProblemStatement(team.id, {
          problem_id: finalId,
          problem_title: finalTitle,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update problem statement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 md:p-6 overflow-hidden">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border-3 border-web bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 bg-web text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black bg-gold text-web px-2 py-0.5 rounded">
                {team?.registrationId || team?.registration_id}
              </span>
              <h3 className="font-display text-2xl text-gold">Assign / Change Problem Statement</h3>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Team: <strong className="text-white">{team?.teamName || team?.team_name}</strong> · Current:{" "}
              <span className="text-gold font-bold">
                {team?.isOpenInnovation ? "🚀 Open Innovation" : team?.selectedProblemTitle || team?.selectedProblemId || "Not Selected"}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-rose-600 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="shrink-0 bg-slate-100 p-3 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("sih_problem")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition ${
              mode === "sih_problem" ? "bg-web text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-200"
            }`}
          >
            🎯 SIH Problem Statement
          </button>

          <button
            type="button"
            onClick={() => setMode("open_innovation")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition ${
              mode === "open_innovation" ? "bg-spidey text-white shadow-xs" : "bg-white text-slate-700 hover:bg-slate-200"
            }`}
          >
            🚀 Open Innovation
          </button>

          <button
            type="button"
            onClick={() => setMode("clear")}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition ${
              mode === "clear" ? "bg-rose-600 text-white shadow-xs" : "bg-white text-rose-700 hover:bg-rose-50"
            }`}
          >
            <RotateCcw size={12} className="inline mr-1" /> Clear / Reset
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-xl border-2 border-rose-400 bg-rose-50 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {mode === "sih_problem" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Option A: Search & Select from Loaded Problems
                </label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by ID (e.g. SIH1600), Title, Category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-bold text-ink focus:border-web focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {filteredProblems.slice(0, 30).map((p) => {
                  const isSelected = selectedPsId === p.id && !customPsId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPsId(p.id);
                        setCustomPsId("");
                        setCustomPsTitle("");
                      }}
                      className={`p-2.5 rounded-lg text-xs cursor-pointer border transition ${
                        isSelected
                          ? "bg-web text-white border-web font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:border-web"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-mono font-black ${isSelected ? "text-gold" : "text-spidey"}`}>
                          {p.id || p.code}
                        </span>
                        <span className="text-[10px] opacity-75 font-semibold">{p.category || "Software"}</span>
                      </div>
                      <p className="truncate font-semibold mt-0.5">{p.title}</p>
                    </div>
                  );
                })}
                {!filteredProblems.length && (
                  <p className="text-center text-xs text-slate-400 py-3">No matching problems found.</p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Option B: Or Enter Custom Problem Statement ID & Title
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="PS ID (e.g. SIH1750)"
                    value={customPsId}
                    onChange={(e) => {
                      setCustomPsId(e.target.value);
                      setSelectedPsId("");
                    }}
                    className="rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Problem Statement Title..."
                    value={customPsTitle}
                    onChange={(e) => setCustomPsTitle(e.target.value)}
                    className="sm:col-span-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {mode === "open_innovation" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Open Innovation Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI-Powered Smart Agriculture Soil Testing Kit"
                  value={openInnoTitle}
                  onChange={(e) => setOpenInnoTitle(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Project Description (Optional)
                </label>
                <textarea
                  rows={4}
                  placeholder="Brief summary of the innovation, problem addressed, and proposed technical solution..."
                  value={openInnoDesc}
                  onChange={(e) => setOpenInnoDesc(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-xs font-bold text-ink focus:border-web focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {mode === "clear" && (
            <div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 space-y-2">
              <p className="font-bold">
                ⚠️ Are you sure you want to clear this team's problem statement selection?
              </p>
              <p>
                This will release the quota slot on their previously locked problem statement. The team (or admin) will be able to select a new problem statement from the portal.
              </p>
            </div>
          )}
        </div>

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
            onClick={handleSave}
            className="rounded-xl bg-web hover:bg-spidey text-white px-6 py-2 text-xs font-black uppercase transition disabled:opacity-50 shadow-xs"
          >
            {saving ? "Saving Changes..." : "Confirm & Save PS"}
          </button>
        </div>
      </div>
    </div>
  );
}
