import madge from "madge";
import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(".", "src");
const OUTPUT_FILE = path.resolve(".", "orphans-ts.json");
const HOURS_24 = 12 * 60 * 60 * 1000;
const now = Date.now();

madge(ROOT_DIR, {
  excludeRegExp: [
    "^old(/|$)",
    "^vendors(/|$)",
    "node_modules"
  ],
  fileExtensions: ["ts", "tsx"]
}).then((res) => {
  const orphans = res.orphans().filter(f => 
    (f.endsWith('.ts') || f.endsWith('.tsx')) &&
    (() => {
      try {
        const stat = fs.statSync(path.join(ROOT_DIR, f));
        return (now - stat.mtimeMs) > HOURS_24;
      } catch {
        return false;
      }
    })()
  );
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(orphans, null, 2));
  console.log(`Found ${orphans.length} orphan .ts/.tsx files older than 24h. Output written to orphans-ts.json`);
}).catch((err) => {
  console.error("Madge error:", err);
});