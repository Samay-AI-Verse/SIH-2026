import { useState } from "react";
import { ProblemExplorer } from "../components/ProblemExplorer";
import { SelectionModal } from "../components/SelectionModal";
import { useSelectionAccess } from "../hooks/useSelection";
import { selectProblem } from "../services/selectionService";

export function Problems() {
  const access = useSelectionAccess();
  const [selected, setSelected] = useState(null);
  const [phase, setPhase] = useState(null);
  const [error, setError] = useState("");

  return (
    <div className="pt-24">
      <div className="mx-auto max-w-4xl px-4 pt-10 text-center">
        {access.alreadySelected ? (
          <p className="rounded-md border-2 border-web bg-white px-4 py-3 text-sm text-ink">
            {access.team?.teamName} locked{" "}
            <strong>{access.team?.selectedProblemTitle || access.team?.selectedProblemId}</strong>. Selection is final.
          </p>
        ) : access.canSelect ? (
          <p className="rounded-md border-2 border-gold bg-gold/20 px-4 py-3 text-sm text-ink">
            {access.team?.teamName} is confirmed. Choose one problem now. Each statement is limited to <strong>2 teams</strong> and
            fills in real time.
          </p>
        ) : (
          <p className="text-ink">{access.message || "Complete your registration and payment to select a problem statement."}</p>
        )}
      </div>
      <ProblemExplorer
        canSelect={access.canSelect}
        selectedProblemId={access.team?.selectedProblemId}
        onSelect={(problem) => {
          setSelected(problem);
          setPhase("confirm");
          setError("");
        }}
      />
      <SelectionModal
        problem={selected}
        phase={phase}
        error={error}
        onCancel={() => {
          setSelected(null);
          setPhase(null);
        }}
        onConfirm={async (details = {}) => {
          if (!selected) return;
          setPhase("loading");
          try {
            await selectProblem({
              problemId: selected.id,
              teamId: access.team?.id,
              openInnovationTitle: details.openInnovationTitle,
              openInnovationDescription: details.openInnovationDescription,
              isOpenInnovation: details.isOpenInnovation || selected.id === "OPEN_INNOVATION",
            });
            setPhase("success");
          } catch (err) {
            setError(err instanceof Error ? err.message : "This problem already has two teams.");
            setPhase("error");
          }
        }}
      />
    </div>
  );
}
