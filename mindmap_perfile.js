import fs from "fs";
import path from "path";

const INPUT = "deps.json";
const OUTPUT_DIR = "filemaps_mindmap";

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const data = JSON.parse(fs.readFileSync(INPUT, "utf8"));
const modules = data.modules;

for (const mod of modules) {
  if (!mod.source.match(/\.(ts|tsx)$/)) continue;
  const deps = (mod.dependencies || [])
    .map(dep => dep.resolved)
    .filter(Boolean)
    .filter(dep => dep.match(/\.(ts|tsx)$/));
  const out = {
    file: mod.source,
    dependencies: deps
  };
  const safeName = mod.source.replace(/[\/\\]/g, "_").replace(/\.[jt]sx?$/, "");
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${safeName}.json`),
    JSON.stringify(out, null, 2)
  );
  console.log(`Wrote mind map JSON for ${mod.source}`);
}