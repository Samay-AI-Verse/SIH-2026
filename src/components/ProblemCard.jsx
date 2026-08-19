import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { PROBLEM_STATUS } from "../types";
import { StatusBadge } from "./ui/StatusBadge";
import { Button } from "./ui/Button";

function availability(problem, selectedProblemId) {
  const max = problem.maxSelections || 2;
  const count = Math.min(Number(problem.selectedCount || 0), max);
  const yours = selectedProblemId && selectedProblemId === problem.id;
  if (yours) {
    return { tone: "green", label: "YOUR TEAM", locked: true, selectable: false, count };
  }
  if (problem.status === PROBLEM_STATUS.LOCKED || problem.status === PROBLEM_STATUS.INACTIVE) {
    return { tone: "slate", label: "LOCKED", locked: true, selectable: false, count };
  }
  if (problem.status === PROBLEM_STATUS.FULL || count >= max) {
    return { tone: "red", label: "FULL · 2 / 2", locked: true, selectable: false, count };
  }
  if (count === 1) {
    return { tone: "yellow", label: "1 / 2 TEAMS", locked: false, selectable: true, count };
  }
  return { tone: "green", label: "AVAILABLE · 0 / 2", locked: false, selectable: true, count };
}

export function ProblemCard({ problem, onSelect, canSelect, selectedProblemId }) {
  const state = availability(problem, selectedProblemId);
  const max = problem.maxSelections || 2;
  const countLabel = `${state.count} / ${max} Teams`;
  return (
    <motion.article
      className="shine surface-card flex h-full flex-col p-5"
      whileHover={{ y: -8, rotate: 0.4 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-black tracking-[0.24em] text-spidey">{problem.code || problem.id}</p>
        <StatusBadge tone={state.tone}>
          {state.locked ? <Lock size={12} /> : <span className="h-2 w-2 rounded-full bg-current" />}
          {state.label}
        </StatusBadge>
      </div>
      <h3 className="mt-4 font-display text-xl text-ink">{problem.title}</h3>
      <p className="mt-2 text-sm text-ink/55">{problem.organization}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.14em] text-ink/55">
        <span className="rounded-md bg-web/10 px-2.5 py-1 text-web">{problem.category}</span>
        <span className="rounded-md bg-gold/30 px-2.5 py-1 text-ink">{problem.difficulty}</span>
        <span className="rounded-md bg-spidey/10 px-2.5 py-1 text-spidey">{countLabel}</span>
      </div>
      <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-ink/60">{problem.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(problem.technologies || []).slice(0, 4).map((tech) => (
          <span key={tech} className="rounded-full border border-ink/10 px-2 py-1 text-[11px] text-ink/70">
            {tech}
          </span>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <Link to={`/problems/${problem.id}`} className="flex-1">
          <Button variant="secondary" className="w-full">
            View Details
          </Button>
        </Link>
        <Button className="flex-1" disabled={!state.selectable || !canSelect} onClick={() => onSelect?.(problem)}>
          {state.locked ? (state.count >= max ? "Full" : "Locked") : "Select Problem"}
        </Button>
      </div>
    </motion.article>
  );
}
