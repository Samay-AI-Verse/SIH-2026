import { useState } from "react";
import { User, Mail, ShieldCheck, CheckCircle2, Lock, Sparkles, Search } from "lucide-react";
import { ProblemExplorer } from "../components/ProblemExplorer";
import { SelectionModal } from "../components/SelectionModal";
import { useSelectionAccess } from "../hooks/useSelection";
import { selectProblem } from "../services/selectionService";
import { lookupDashboard } from "../services/apiService";
import { saveTeamSession } from "../lib/session";

export function Problems() {
  const access = useSelectionAccess();
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState(null);
  const [error, setError] = useState("");
  const [customTeam, setCustomTeam] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");

  const activeTeam = customTeam || access.team;
  const alreadySelected = Boolean(activeTeam?.selectedProblemId || activeTeam?.selected_problem_id);
  const canSelect = Boolean(activeTeam && !alreadySelected);

  async function handleQuickLookup(e) {
    e?.preventDefault();
    const email = emailInput.trim();
    if (!email) return;
    setLookingUp(true);
    setLookupMessage("");
    try {
      const data = await lookupDashboard(email);
      if (data?.team) {
        setCustomTeam(data.team);
        saveTeamSession(data.team.id, data.team.registrationId || data.team.registration_id);
        setLookupMessage(`Verified team '${data.team.teamName || data.team.team_name}'!`);
      } else {
        setLookupMessage("No team found for this registered email.");
      }
    } catch (err) {
      setLookupMessage("Lookup failed. Please check your leader email.");
    } finally {
      setLookingUp(false);
    }
  }

  return (
    <div className="pt-24 min-h-screen pb-16">
      {/* Top Team Verification & Header Banner */}
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <div className="rounded-3xl border-3 border-web bg-white p-6 shadow-[6px_6px_0_#071433] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-widest text-spidey uppercase">
                <Sparkles size={14} /> SIH 2026 Problem Statement Allocation
              </span>
              <h1 className="font-display text-3xl md:text-4xl text-web mt-1">
                Explore & Lock Problem Statements
              </h1>
            </div>

            {/* Active Team Context Badge */}
            {activeTeam ? (
              <div className="rounded-2xl border-2 border-web bg-web/5 p-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Active Verified Team</p>
                <p className="font-display text-2xl text-web leading-none mt-0.5">{activeTeam.teamName || activeTeam.team_name}</p>
                <p className="text-xs font-bold text-spidey mt-1">
                  Leader: {activeTeam.leaderEmail || activeTeam.leader_email} ({activeTeam.registrationId || activeTeam.registration_id})
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuickLookup} className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={15} />
                  <input
                    type="email"
                    placeholder="Enter Registered Leader Email..."
                    className="w-full rounded-xl border-2 border-web/30 bg-slate-50 pl-9 pr-3 py-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={lookingUp}
                  className="w-full sm:w-auto rounded-xl border-2 border-web bg-web px-4 py-2 text-xs font-black uppercase text-white hover:bg-spidey transition disabled:opacity-50"
                >
                  {lookingUp ? "Verifying..." : "Verify Team"}
                </button>
              </form>
            )}
          </div>

          {lookupMessage && (
            <p className="text-xs font-bold text-web bg-gold/20 px-3 py-1.5 rounded-xl border border-web/20">
              {lookupMessage}
            </p>
          )}

          {/* Status Message */}
          {alreadySelected ? (
            <div className="rounded-2xl border-2 border-web bg-emerald-50 p-4 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
              <span>
                Your team <strong className="text-web">{activeTeam?.teamName || activeTeam?.team_name}</strong> has locked problem statement:{" "}
                <strong className="text-spidey">{activeTeam?.selectedProblemTitle || activeTeam?.selectedProblemId || activeTeam?.selected_problem_title}</strong>. Selection is final.
              </span>
            </div>
          ) : canSelect ? (
            <div className="rounded-2xl border-2 border-web bg-gold/20 p-4 text-xs font-bold text-web flex items-center gap-2">
              <ShieldCheck size={18} className="text-spidey flex-shrink-0" />
              <span>
                Team <strong className="text-web">{activeTeam?.teamName || activeTeam?.team_name}</strong> is verified! Click <strong>"Select Problem Statement"</strong> on any available statement card below to lock it for your team. Each problem statement is capped at max 2 teams.
              </span>
            </div>
          ) : (
            <p className="text-xs font-bold text-slate-600 bg-slate-100 p-3 rounded-xl border border-slate-200">
              {access.message || "Enter your registered Leader Email above to verify your team and lock a problem statement."}
            </p>
          )}
        </div>
      </div>

      {/* Problem Statements Cards Explorer */}
      <ProblemExplorer
        canSelect={canSelect || !activeTeam}
        selectedProblemId={activeTeam?.selectedProblemId || activeTeam?.selected_problem_id}
        onSelect={(problem) => {
          setSelected(problem);
          setPhase("confirm");
          setError("");
        }}
      />

      {/* Selection Confirmation Modal */}
      <SelectionModal
        problem={selected}
        phase={phase}
        error={error}
        team={activeTeam}
        onTeamVerified={(vTeam) => setCustomTeam(vTeam)}
        onCancel={() => {
          setSelected(null);
          setPhase(null);
        }}
        onConfirm={async (details = {}) => {
          if (!selected) return;
          setPhase("loading");
          try {
            const targetTeamId = details.teamId || activeTeam?.id;
            await selectProblem({
              problemId: selected.id,
              teamId: targetTeamId,
              openInnovationTitle: details.openInnovationTitle,
              openInnovationDescription: details.openInnovationDescription,
              isOpenInnovation: details.isOpenInnovation || selected.id === "OPEN_INNOVATION",
            });
            setPhase("success");
          } catch (err) {
            setError(err instanceof Error ? err.message : "This problem statement has already reached its maximum quota of 2 teams.");
            setPhase("error");
          }
        }}
      />
    </div>
  );
}
