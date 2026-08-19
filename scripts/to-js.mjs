import { transform } from "sucrase";
import fs from "node:fs";
import path from "node:path";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) files.push(full);
  }
  return files;
}

const roots = ["src"];
const files = roots.flatMap((root) => walk(root));

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const isTsx = file.endsWith(".tsx");
  const { code } = transform(source, {
    transforms: isTsx ? ["typescript", "jsx"] : ["typescript"],
    jsxRuntime: "automatic",
    production: false,
    disableESTransforms: true,
  });
  const out = isTsx ? file.replace(/\.tsx$/, ".jsx") : file.replace(/\.ts$/, ".js");
  fs.writeFileSync(out, code);
  if (out !== file) fs.unlinkSync(file);
  console.log(`${file} -> ${out}`);
}
