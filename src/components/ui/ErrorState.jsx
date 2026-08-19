import { Link } from "react-router-dom";
import { Button } from "./Button";

export function ErrorState({ title, message, actionLabel, actionTo, onAction }) {
  return (
    <div className="mx-auto max-w-lg surface-card p-8 text-center">
      <h2 className="font-display text-3xl text-web comic-pop">{title}</h2>
      <p className="mt-3 text-ink/60">{message}</p>
      {actionTo ? (
        <Link to={actionTo} className="mt-6 inline-block">
          <Button>{actionLabel || "Continue"}</Button>
        </Link>
      ) : onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel || "Try again"}
        </Button>
      ) : null}
    </div>
  );
}
