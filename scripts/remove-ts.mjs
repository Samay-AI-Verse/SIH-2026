import fs from "node:fs";
import path from "node:path";

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

for (const file of walk("src")) {
  if (file.endsWith(".ts") || file.endsWith(".tsx")) {
    fs.unlinkSync(file);
    console.log("removed", file);
  }
}

const env = path.join("src", "vite-env.d.js");
if (fs.existsSync(env)) fs.unlinkSync(env);
