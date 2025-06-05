import { Project } from "ts-morph";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Setup __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURE HERE:
const INPUT_FILE = path.resolve(__dirname, "../src/modules/Rendering/jsx-runtime.ts");
const OUTPUT_BASE = path.resolve(__dirname, "../src/modules/Rendering");
const SPLIT_MAP = {
  core: [
    "createSignalReactiveComponent",
    "createSignalBinding",
    "createSignalClassBinding",
    "createSignalStyleBinding",
    "applyStyles",
    "appendChildren",
    "appendChild",
    "flattenChildren",
    "cleanup",
    "renderToString",
    "createReactiveText"
  ],
  hydra: [
    "createHydraComponent",
    "createMetaComponent",
    "createSafeScriptComponent",
    "createCSSComponent",
    "hydra"
  ]
};

const project = new Project();
const sourceFile = project.addSourceFileAtPath(INPUT_FILE);

// Collect all imports to prepend to each file
const importStmts = sourceFile.getImportDeclarations().map(d => d.getText()).join("\n");

// Helper to write a node to a file
function writeNodeToFile(node, dir, name) {
  const outDir = path.join(OUTPUT_BASE, dir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${name}.ts`);
  let code = importStmts + "\n\n" + node.getFullText();
  // Remove duplicate imports
  code = code.replace(/(\nimport [^\n]+)+/g, match => {
    const seen = new Set();
    return match
      .split("\n")
      .filter(line => {
        if (!line.trim()) return false;
        if (seen.has(line)) return false;
        seen.add(line);
        return true;
      })
      .join("\n");
  });
  fs.writeFileSync(filePath, code.trim() + "\n");
  console.log(`Extracted: ${name} -> ${dir}/${name}.ts`);
}

// Extract and write nodes
for (const [dir, names] of Object.entries(SPLIT_MAP)) {
  for (const name of names) {
    // Corrected: use getFunctionDeclarations().find(...)
    const node =
     sourceFile.getFunctions().find(fn => fn.getName() === name) ||
      sourceFile.getVariableStatements().find(s => s.getDeclarations().some(d => d.getName() === name)) ||
      sourceFile.getInterfaces().find(i => i.getName() === name) ||
      sourceFile.getTypeAliases().find(t => t.getName() === name) ||
      sourceFile.getClasses().find(c => c.getName() === name);
    if (node) {
      writeNodeToFile(node, dir, name);
    } else {
      console.warn(`Warning: Could not find ${name}`);
    }
  }
}

console.log("Advanced extraction complete!");