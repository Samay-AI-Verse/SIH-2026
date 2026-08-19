import { Link } from "react-router-dom";
import { PROBLEM_STATUS } from "../types";
import { StatusBadge } from "./ui/StatusBadge";
import { Button } from "./ui/Button";

export function ProblemDetailsView({ problem, canSelect, alreadySelected, message, onSelect }) {
  const full = problem.status === PROBLEM_STATUS.FULL || problem.selectedCount >= problem.maxSelections;
  const locked = problem.status === PROBLEM_STATUS.LOCKED || problem.status === PROBLEM_STATUS.INACTIVE;
  return (
    <article className="mx-auto max-w-4xl">
      <p className="text-xs font-black tracking-[0.28em] text-spidey">{problem.code}</p>
      <h1 className="mt-3 font-display text-5xl text-web comic-pop">{problem.title}</h1>
      <p className="mt-3 text-ink/55">{problem.organization}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <StatusBadge tone={locked ? "slate" : full ? "red" : problem.selectedCount === 1 ? "yellow" : "green"}>
          {locked ? "LOCKED" : full ? "FULL · 2 / 2" : problem.selectedCount === 1 ? "1 / 2 TEAMS" : "AVAILABLE · 0 / 2"}
        </StatusBadge>
        <StatusBadge tone="blue">
          {problem.selectedCount} / {problem.maxSelections} Teams
        </StatusBadge>
        <StatusBadge tone="slate">{problem.category}</StatusBadge>
        <StatusBadge tone="slate">{problem.difficulty}</StatusBadge>
      </div>
      <section className="mt-10 space-y-8 text-ink/70">
        <Block title="Description" body={problem.description} />
        <Block title="Background" body={problem.background} />
        <Block title="Expected solution" body={problem.expectedSolution} />
        <List title="Technical requirements" items={problem.technicalRequirements} />
        <List title="Recommended technologies" items={problem.technologies} />
        <List title="Constraints" items={problem.constraints} />
        <List title="Evaluation criteria" items={problem.evaluationCriteria} />
      </section>
      {message ? (
        <p className="mt-8 rounded-2xl border border-gold/40 bg-gold/15 p-4 text-sm text-ink">{message}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        {alreadySelected ? (
          <Button disabled>Problem locked for your team</Button>
        ) : (
          <Button onClick={onSelect} disabled={!canSelect || full || locked}>
            Select This Problem
          </Button>
        )}
        <Link to="/problems">
          <Button variant="secondary">Back to explorer</Button>
        </Link>
      </div>
    </article>
  );
}

function Block({ title, body }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <p className="mt-3 leading-7">{body}</p>
    </div>
  );
}

function List({ title, items }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        {(items || []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
