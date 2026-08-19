import { useMemo } from "react";
import { useTeam } from "./useTeam";

export function useSelectionAccess() {
  const { team, loading } = useTeam();
  const alreadySelected = Boolean(team?.selectedProblemId);
  const canSelect = Boolean(team && !alreadySelected);
  const message = useMemo(() => {
    if (!team) return "Please lookup your team in Dashboard or register to choose a problem statement.";
    if (alreadySelected) return `Your team has locked: '${team.selectedProblemTitle || team.selectedProblemId}'. Selection is final.`;
    return "";
  }, [alreadySelected, team]);
  return { canSelect, alreadySelected, team, loading, message };
}
