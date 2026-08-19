import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { PageLoader } from "../components/ui/Skeleton";
import { useTeam } from "../hooks/useTeam";
import { useProblems } from "../hooks/useProblems";
export function MySelection() {
    const { team, loading } = useTeam();
    const { problems } = useProblems();
    const problem = problems.find((item) => item.id === team?.selectedProblemId);
    if (loading)
        return <PageLoader label="Loading dashboard..."/>;
    if (!team?.selectedProblemId) {
        return (<div className="surface-card p-8">
        <h1 className="font-display text-4xl text-web comic-pop">No selection yet</h1>
        <p className="mt-3 text-ink/60">Your team has not locked a problem statement.</p>
        <Link to="/problems" className="mt-6 inline-block">
          <Button>Explore Problem Statements</Button>
        </Link>
      </div>);
    }
    return (<div className="surface-card p-8">
      <p className="text-xs font-black tracking-[0.28em] text-spidey">LOCKED</p>
      <h1 className="mt-3 font-display text-4xl text-web comic-pop">{problem?.title || team.selectedProblemTitle}</h1>
      <p className="mt-3 font-black text-spidey">{team.selectedProblemId}</p>
      <p className="mt-4 max-w-2xl text-ink/60">{problem?.description}</p>
      <p className="mt-6 text-sm text-ink/50">Your team has already selected a problem statement. Only an admin can reset this allocation.</p>
      <Link to={`/problems/${team.selectedProblemId}`} className="mt-6 inline-block">
        <Button variant="secondary">View details</Button>
      </Link>
    </div>);
}
