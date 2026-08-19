export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-web/10 ${className}`} />;
}

export function PageLoader({ label }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-web">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-spidey/20 border-t-spidey" />
      <p className="font-display text-xl tracking-wide">{label}</p>
    </div>
  );
}
