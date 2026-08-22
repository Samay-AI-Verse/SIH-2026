import { getTeamSession } from "../lib/session";
import { selectProblem as selectProblemApi } from "./apiService";

export async function selectProblem({ problemId, problemTitle, teamId, openInnovationTitle, openInnovationDescription, isOpenInnovation }) {
  const id = teamId || getTeamSession().teamId;
  if (!id) throw new Error("Register and complete payment before selecting a problem.");
  return selectProblemApi({ problemId, problemTitle, teamId: id, openInnovationTitle, openInnovationDescription, isOpenInnovation });
}
