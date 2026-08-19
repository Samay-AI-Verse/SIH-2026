import { useEffect, useMemo, useState } from "react";
import { adminFetchTeams, fetchProblems, subscribeTable } from "../services/apiService";
import { SAMPLE_PROBLEMS } from "../utils/constants";
import { downloadCsv } from "../utils/cn";
import { Button } from "../components/ui/Button";

export function AdminSelections() {
  const [problems, setProblems] = useState(SAMPLE_PROBLEMS);
  const [teams, setTeams] = useState([]);

  async function load() {
    const [nextProblems, nextTeams] = await Promise.all([fetchProblems(), adminFetchTeams()]);
    if (nextProblems.length) setProblems(nextProblems);
    setTeams(nextTeams);
  }

  useEffect(() => {
    load().catch(() => undefined);
    const stops = ["teams", "problems", "problem_selections"].map((table) => subscribeTable(table, () => load().catch(() => undefined)));
    return () => stops.forEach((stop) => stop());
  }, []);

  const allocation = useMemo(
    () => problems.map((problem) => ({ problem, teams: teams.filter((team) => team.selectedProblemId === problem.id) })),
    [problems, teams]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Selections</h1>
        <Button
          variant="secondary"
          onClick={() =>
            downloadCsv(
              "sih-allocations.csv",
              allocation.map((item) => ({
                problem: item.problem.code || item.problem.id,
                title: item.problem.title,
                teamA: item.teams[0]?.teamName || "",
                teamB: item.teams[1]?.teamName || "",
                status: item.problem.status,
                count: `${item.problem.selectedCount}/${item.problem.maxSelections}`,
              }))
            )
          }
        >
          Export CSV
        </Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {allocation.map(({ problem, teams: assigned }) => (
          <article key={problem.id} className="rounded-3xl border border-ink/10 p-5">
            <p className="text-saffron">{problem.code || problem.id}</p>
            <p className="text-ink">{problem.title}</p>
            <p className="mt-3 text-sm text-ink/70">{assigned[0]?.teamName || "—"}</p>
            <p className="text-sm text-ink/70">{assigned[1]?.teamName || "—"}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-ink/50">
              {problem.selectedCount} / {problem.maxSelections} · {problem.status}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
