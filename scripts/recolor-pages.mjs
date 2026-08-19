import fs from "node:fs";
import path from "node:path";

const replacements = [
  [/text-white/g, "text-ink"],
  [/text-slate-400/g, "text-ink/60"],
  [/text-slate-300/g, "text-ink/70"],
  [/text-slate-500/g, "text-ink/50"],
  [/text-slate-200/g, "text-ink/80"],
  [/border-white\/10/g, "border-ink/10"],
  [/bg-white\/5/g, "bg-white"],
  [/hover:bg-white\/5/g, "hover:bg-saffron/10"],
  [/text-cyan-300/g, "text-saffron"],
  [/text-cyan-200/g, "text-teal"],
  [/text-emerald-300/g, "text-teal"],
  [/text-emerald-400/g, "text-teal"],
  [/text-amber-200/g, "text-ink"],
  [/text-rose-300/g, "text-rose"],
  [/bg-navy-800\/80/g, "bg-white"],
  [/bg-navy-800/g, "bg-white"],
  [/bg-navy\/80/g, "bg-ink/40"],
  [/min-h-svh bg-navy/g, "min-h-svh"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (full.endsWith(".jsx") || full.endsWith(".js")) files.push(full);
  }
  return files;
}

for (const file of [...walk("src/pages"), ...walk("src/admin")]) {
  let source = fs.readFileSync(file, "utf8");
  const original = source;
  for (const [pattern, next] of replacements) source = source.replace(pattern, next);
  if (source !== original) {
    fs.writeFileSync(file, source);
    console.log("updated", file);
  }
}
