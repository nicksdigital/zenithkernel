import madge from "madge";
import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(process.cwd(), ".");
const OUTPUT_DIR = path.resolve(process.cwd(), "filemaps");

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

madge(ROOT_DIR, {
  excludeRegExp: [
    "^old(/|$)",
    "^vendors(/|$)",
    "node_modules"
  ],
  fileExtensions: ["ts", "tsx"]
}).then(async (res) => {
  const allFiles = Object.keys(res.obj()).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  for (const file of allFiles) {
    const safeName = file.replace(/[\/\\]/g, "_").replace(/\.[jt]sx?$/, "");
    const outPath = path.join(OUTPUT_DIR, `${safeName}.svg`);
    await res.image(outPath, { 
      focus: file,
      format: "svg"
    });
    console.log(`Generated dependency image for ${file} -> ${outPath}`);
  }
}).catch((err) => {
  console.error("Madge error:", err);
});
