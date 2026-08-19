const items = ["TEAM OF 6", "ONE FEMALE MEMBER", "OPEN TO ALL BRANCHES", "₹300 / TEAM", "2–3 SEPT 2026", "GTMC NANDED", "WITH GREAT CODE COMES GREAT IMPACT"];

export function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="marquee py-3">
      <div className="marquee-track font-ui text-xl font-bold tracking-[0.2em]">
        {row.map((item, index) => (
          <span key={`${item}-${index}`}>✦ {item}</span>
        ))}
      </div>
    </div>
  );
}
