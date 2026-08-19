import { useState, useEffect } from "react";
import { CircleCheck, Sparkles, User, Mail, ShieldCheck, CheckCircle2, Lock, AlertCircle, ArrowRight, Building } from "lucide-react";
import { motion } from "framer-motion";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Field, TextInput } from "./ui/Field";
import { lookupDashboard } from "../services/apiService";
import { saveTeamSession } from "../lib/session";

export function SelectionModal({ problem, phase, error, team, onCancel, onConfirm, onTeamVerified }) {
  const isOpenInno = problem?.id === "OPEN_INNOVATION" || problem?.isOpenInnovation;
  const [innoTitle, setInnoTitle] = useState("");
  const [innoDesc, setInnoDesc] = useState("");
  const [leaderEmailInput, setLeaderEmailInput] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifiedTeam, setVerifiedTeam] = useState(team || null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setVerifiedTeam(team || null);
  }, [team]);

  async function handleVerifyEmail(e) {
    e?.preventDefault();
    const email = leaderEmailInput.trim();
    if (!email) {
      setLocalError("Please enter your registered Leader Email ID.");
      return;
    }
    setVerifyingEmail(true);
    setLocalError("");
    try {
      const data = await lookupDashboard(email);
      if (!data?.team) {
        throw new Error("No team found for this registered leader email.");
      }
      setVerifiedTeam(data.team);
      saveTeamSession(data.team.id, data.team.registrationId || data.team.registration_id);
      if (onTeamVerified) onTeamVerified(data.team);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Team lookup failed. Please check your email.");
    } finally {
      setVerifyingEmail(false);
    }
  }

  function handleConfirm() {
    const activeTeam = verifiedTeam || team;
    if (!activeTeam) {
      setLocalError("Please verify your registered Leader Email ID before locking a problem statement.");
      return;
    }
    if (isOpenInno && !innoTitle.trim()) {
      setLocalError("Please enter your project title for Open Innovation.");
      return;
    }
    setLocalError("");
    onConfirm({
      teamId: activeTeam.id,
      openInnovationTitle: innoTitle.trim(),
      openInnovationDescription: innoDesc.trim(),
      isOpenInnovation: isOpenInno,
    });
  }

  const currentTeam = verifiedTeam || team;

  return (
    <Modal open={Boolean(problem && phase)} onClose={onCancel} labelledBy="selection-title">
      {phase === "success" ? (
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}>
            <CircleCheck className="mx-auto mb-4 h-16 w-16 text-emerald-600 drop-shadow-md" />
          </motion.div>
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black tracking-widest text-emerald-800 uppercase">
            PROBLEM STATEMENT OFFICIALLY LOCKED
          </span>
          <h2 id="selection-title" className="mt-3 font-display text-3xl md:text-4xl text-web">
            Selection Confirmed For {currentTeam?.teamName || "Your Team"}!
          </h2>

          <div className="mt-4 rounded-2xl border-2 border-web bg-slate-50 p-4 text-left space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-500">Locked Problem Statement</p>
            <p className="font-display text-2xl text-spidey">{isOpenInno ? "OPEN INNOVATION" : problem?.code}</p>
            <p className="font-bold text-sm text-web">{isOpenInno ? (innoTitle || "Custom Innovation Project") : problem?.title}</p>
          </div>

          <Button className="mt-6 w-full" onClick={onCancel}>
            Return to Dashboard
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              {isOpenInno ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-spidey bg-gold/30 px-2.5 py-0.5 rounded-lg border border-web/30">
                  <Sparkles size={12} /> OPEN INNOVATION SUBMISSION
                </span>
              ) : (
                <span className="text-[10px] font-black tracking-[0.2em] text-spidey uppercase">CONFIRM PROBLEM SELECTION</span>
              )}
              <h2 id="selection-title" className="font-display text-3xl text-web leading-none mt-1">
                {isOpenInno ? "Submit Custom Idea" : problem?.code}
              </h2>
            </div>
            <span className="rounded-xl border-2 border-web bg-web px-3 py-1 font-mono text-xs font-black text-gold">
              {problem?.selectedCount || 0}/2 Teams
            </span>
          </div>

          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            {isOpenInno ? problem?.description : problem?.title}
          </p>

          {/* Team Identification / Leader Email Verification Box */}
          <div className="rounded-2xl border-2 border-web bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-web flex items-center gap-1">
                <ShieldCheck size={14} className="text-spidey" /> Verified Team Context
              </span>
              {currentTeam && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  <CheckCircle2 size={12} /> Identity Confirmed
                </span>
              )}
            </div>

            {currentTeam ? (
              <div className="rounded-xl border-2 border-web/20 bg-white p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl text-web">{currentTeam.teamName || currentTeam.team_name}</span>
                  <span className="font-mono font-bold text-spidey bg-spidey/10 px-2 py-0.5 rounded">
                    {currentTeam.registrationId || currentTeam.registration_id}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-semibold">
                  <User size={13} className="text-slate-400" />
                  <span>Leader: {currentTeam.leaderName || currentTeam.leader_name}</span>
                  <span className="text-slate-300">·</span>
                  <Mail size={13} className="text-slate-400" />
                  <span className="text-web font-bold">{currentTeam.leaderEmail || currentTeam.leader_email}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-bold">
                  Enter your registered Team Leader Email ID to verify your team and lock this problem statement:
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="e.g. leader@college.edu"
                    className="flex-1 rounded-xl border-2 border-web/30 bg-white px-3 py-2 text-xs font-bold text-ink focus:border-web focus:outline-none"
                    value={leaderEmailInput}
                    onChange={(e) => setLeaderEmailInput(e.target.value)}
                  />
                  <button
                    onClick={handleVerifyEmail}
                    disabled={verifyingEmail}
                    className="rounded-xl border-2 border-web bg-web px-4 py-2 text-xs font-black uppercase text-white hover:bg-spidey transition disabled:opacity-50"
                  >
                    {verifyingEmail ? "Verifying..." : "Verify Team"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Open Innovation Form Fields */}
          {isOpenInno && (
            <div className="space-y-4 rounded-2xl border-3 border-spidey/30 bg-gradient-to-b from-spidey/5 to-gold/10 p-5 shadow-inner">
              <div className="flex items-center justify-between border-b border-spidey/15 pb-2">
                <span className="font-display text-lg text-web flex items-center gap-2">
                  <Sparkles size={18} className="text-spidey animate-pulse" /> Open Innovation Project Details
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-gold text-web px-2.5 py-0.5 rounded-full">
                  Unlimited Capacity
                </span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-spidey flex items-center justify-between">
                  <span>PROJECT / IDEA TITLE *</span>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase font-mono">{innoTitle.length}/100</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI Autonomous Drone for Precision Agriculture & Crop Health Monitoring"
                  value={innoTitle}
                  onChange={(e) => setInnoTitle(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-xl border-3 border-web/40 bg-white p-3.5 text-sm sm:text-base font-bold text-web placeholder:text-slate-400 focus:border-web focus:bg-white focus:outline-none focus:ring-4 focus:ring-gold/30 shadow-xs transition"
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
                    <span>ABSTRACT / PROPOSED ARCHITECTURE</span>
                    <span className="text-[10px] font-bold text-slate-400 normal-case">(OPTIONAL BUT RECOMMENDED)</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-semibold font-mono">{innoDesc.length} chars</span>
                </div>
                <div className="mb-2 rounded-lg bg-white/70 border border-web/20 p-2 text-[11px] font-semibold text-slate-600 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-gold shrink-0" />
                  <span>Tip: Describe problem scope, solution approach, hardware/software stack, and expected impact.</span>
                </div>
                <textarea
                  rows={6}
                  className="w-full rounded-xl border-3 border-web/40 bg-white p-3.5 text-xs sm:text-sm font-medium text-ink placeholder:text-slate-400 focus:border-web focus:outline-none focus:ring-4 focus:ring-gold/30 shadow-xs transition leading-relaxed"
                  placeholder={`Briefly describe your team's custom innovation project:
• Problem Statement & Target Domain
• Proposed Technical Solution & Workflow
• Key Tech Stack (e.g. React, FastAPI, Python AI, IoT, Cloudflare)
• Innovation & Impact...`}
                  value={innoDesc}
                  onChange={(e) => setInnoDesc(e.target.value)}
                />
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500 font-medium">
            {isOpenInno
              ? "Your Open Innovation project idea will be submitted directly to the evaluation panel."
              : "Each statement is strictly limited to 2 teams. Once locked, selection is final."}
          </p>

          {(error || localError) ? (
            <div className="rounded-xl border-2 border-rose-400 bg-rose-50 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" /> {error || localError}
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1 py-3 text-xs font-black uppercase" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-wider bg-spidey text-white hover:bg-web transition shadow-comic"
              onClick={handleConfirm}
              disabled={phase === "loading" || !currentTeam}
            >
              {phase === "loading" ? "Confirming..." : `Lock For ${currentTeam?.teamName || "Team"}`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
