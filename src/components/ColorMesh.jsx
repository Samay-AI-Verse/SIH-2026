export function ColorMesh() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-spidey/20 blur-3xl" />
      <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-web/20 blur-3xl" />
      <div className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
    </div>
  );
}
