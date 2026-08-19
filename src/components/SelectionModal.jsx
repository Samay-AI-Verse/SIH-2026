import { useState } from "react";
import { CircleCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Field, TextInput } from "./ui/Field";

export function SelectionModal({ problem, phase, error, onCancel, onConfirm }) {
  const isOpenInno = problem?.id === "OPEN_INNOVATION" || problem?.isOpenInnovation;
  const [innoTitle, setInnoTitle] = useState("");
  const [innoDesc, setInnoDesc] = useState("");
  const [localError, setLocalError] = useState("");

  function handleConfirm() {
    if (isOpenInno && !innoTitle.trim()) {
      setLocalError("Please enter your project title for Open Innovation.");
      return;
    }
    setLocalError("");
    onConfirm({
      openInnovationTitle: innoTitle.trim(),
      openInnovationDescription: innoDesc.trim(),
      isOpenInnovation: isOpenInno,
    });
  }

  return (
    <Modal open={Boolean(problem && phase)} onClose={onCancel} labelledBy="selection-title">
      {phase === "success" ? (
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}>
            <CircleCheck className="mx-auto mb-4 h-12 w-12 text-spidey" />
          </motion.div>
          <p className="text-xs font-black tracking-[0.28em] text-spidey">PROBLEM STATEMENT LOCKED</p>
          <h2 id="selection-title" className="mt-3 font-display text-3xl text-web">
            Your team has successfully selected:
          </h2>
          <p className="mt-4 font-black text-spidey">{isOpenInno ? "OPEN INNOVATION" : problem?.code}</p>
          <p className="mt-1 text-lg text-ink">{isOpenInno ? (innoTitle || "Open Innovation Project") : problem?.title}</p>
          <Button className="mt-6" onClick={onCancel}>
            Continue
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2">
            {isOpenInno ? (
              <span className="inline-flex items-center gap-1 text-xs font-black tracking-widest text-spidey bg-gold/30 px-2 py-0.5 rounded border border-web">
                <Sparkles size={13} /> OPEN INNOVATION SUBMISSION
              </span>
            ) : (
              <p className="text-xs font-black tracking-[0.28em] text-spidey">CONFIRM YOUR SELECTION</p>
            )}
          </div>

          <h2 id="selection-title" className="mt-3 font-display text-3xl text-web">
            {isOpenInno ? "Submit Your Custom Idea" : problem?.code}
          </h2>
          <p className="mt-2 text-ink/80 text-sm">{isOpenInno ? problem?.description : problem?.title}</p>

          {isOpenInno && (
            <div className="mt-4 space-y-3">
              <Field label="Project / Idea Title *" error={localError}>
                <TextInput
                  placeholder="e.g. AI Autonomous Drone for Crop Health Monitoring"
                  value={innoTitle}
                  onChange={(e) => setInnoTitle(e.target.value)}
                  required
                />
              </Field>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink">
                  Abstract / Proposed Architecture (Optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border-2 border-web/40 p-2.5 text-xs font-semibold focus:border-web focus:outline-none"
                  placeholder="Briefly describe your solution approach and technology stack..."
                  value={innoDesc}
                  onChange={(e) => setInnoDesc(e.target.value)}
                />
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-ink/60">
            {isOpenInno
              ? "Your Open Innovation project idea will be submitted to the hackathon evaluation panel."
              : "Each statement is strictly limited to 2 teams. Once locked, selections cannot be changed without admin approval."}
          </p>
          {(error || localError) ? <p className="mt-3 text-sm text-rose font-bold">{error || localError}</p> : null}
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={phase === "loading"}>
              {phase === "loading" ? "Confirming..." : (isOpenInno ? "Submit & Lock Idea" : "Confirm Selection")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
