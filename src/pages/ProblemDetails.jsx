import { useState } from "react";
import { useParams } from "react-router-dom";
import { ProblemDetailsView } from "../components/ProblemDetails";
import { SelectionModal } from "../components/SelectionModal";
import { PageLoader } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { useProblems } from "../hooks/useProblems";
import { useSelectionAccess } from "../hooks/useSelection";
import { selectProblem } from "../services/selectionService";
export function ProblemDetailsPage() {
    const { problemId } = useParams();
    const { problems, loading } = useProblems();
    const access = useSelectionAccess();
    const [selected, setSelected] = useState(null);
    const [phase, setPhase] = useState(null);
    const [error, setError] = useState("");
    const problem = problems.find((item) => item.id === problemId || item.code === problemId);
    if (loading)
        return <PageLoader label="Loading problem statements..."/>;
    if (!problem) {
        return (<div className="px-4 py-28">
        <ErrorState title="Problem not found" message="This problem statement is unavailable." actionTo="/problems"/>
      </div>);
    }
    return (<div className="px-4 py-28 md:px-6">
      <ProblemDetailsView problem={problem} canSelect={access.canSelect} alreadySelected={access.alreadySelected} message={access.message} onSelect={() => {
            setSelected(problem);
            setPhase("confirm");
        }}/>
      <SelectionModal problem={selected} phase={phase} error={error} onCancel={() => {
            setSelected(null);
            setPhase(null);
            setError("");
        }} onConfirm={async () => {
            if (!selected)
                return;
            setPhase("loading");
            try {
                await selectProblem({ problemId: selected.id, teamId: access.team?.id });
                setPhase("success");
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Problem statement is already full.");
                setPhase("error");
            }
        }}/>
    </div>);
}
