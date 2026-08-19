import { useMemo } from "react";
import { PAYMENT_STATUS, REGISTRATION_STATUS } from "../types";
import { useTeam } from "./useTeam";

export function useSelectionAccess() {
  const { team, loading } = useTeam();
  const alreadySelected = Boolean(team?.selectedProblemId);
  const paid = team?.registrationStatus === REGISTRATION_STATUS.CONFIRMED && team?.paymentStatus === PAYMENT_STATUS.SUCCESS;
  const canSelect = Boolean(paid && !alreadySelected);
  const message = useMemo(() => {
    if (!team) return "Complete registration and payment to lock a problem statement.";
    if (team.paymentStatus === PAYMENT_STATUS.PROCESSING) {
      return "Wait for organizers to confirm your payment. Then you can lock one problem statement (2 teams per problem).";
    }
    if (!paid) return "Complete the ₹300 payment before selecting a problem statement.";
    if (alreadySelected) return `Your team already locked ${team.selectedProblemTitle || "a problem statement"}.`;
    return "";
  }, [alreadySelected, paid, team]);
  return { canSelect, alreadySelected, team, loading, message };
}
