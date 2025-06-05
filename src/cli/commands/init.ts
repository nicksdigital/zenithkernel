import * as p from "@clack/prompts";
import color from "picocolors";
import { onCancel } from "../utils/onCancel";
import { ensureDir, writeFileAtomic, renderTemplate } from "../utils/scaffoldUtils";
import { resolve, join } from "path";

export async function runInit() {
    console.clear();
    p.intro(`${color.bgMagenta(color.white(" zenith init "))}`);

    const responses = await p.group(
        {
            projectName: () =>
                p.text({
                    message: "Project name:",
                    placeholder: "zenith-app",
                    validate: (value) => (value.length < 2 ? "Too short." : undefined),
                }),
            language: () =>
                p.select({
                    message: "Language:",
                    options: [
                        { value: "ts", label: "TypeScript" },
                        { value: "js", label: "JavaScript" },
                    ],
                    initialValue: "ts",
                }),
            ssr: () =>
                p.confirm({
                    message: "Enable SSR (server-side rendering)?",
                    initialValue: true,
                }),
            withAdminUI: () =>
                p.confirm({
                    message: "Include admin dashboard UI?",
                    initialValue: true,
                }),
            exampleModules: () =>
                p.multiselect({
                    message: "Include example modules?",
                    options: [
                        { value: "counter", label: "Counter Module" },
                        { value: "networking", label: "Networking Module" },
                        { value: "physics", label: "Physics Module" },
                        { value: "none", label: "None", hint: "No example modules" },
                    ],
                    initialValues: ["counter"],
                    required: false,
                }),
            withTailwind: () =>
                p.confirm({
                    message: "Include TailwindCSS for styling?",
                    initialValue: true,
                }),
        },
        { onCancel }
    );

    // Normalize exampleModules
    let modules = responses.exampleModules;
    if (modules.includes("none")) modules = [];

    // Collect config
    const config = {
        projectName: responses.projectName,
        language: responses.language,
        ssr: responses.ssr,
        withAdminUI: responses.withAdminUI,
        exampleModules: modules,
        withTailwind: responses.withTailwind,
    };

    // --- SCAFFOLDING LOGIC ---
    const projectRoot = resolve(process.cwd(), config.projectName);
    const srcDir = join(projectRoot, "src");
    const modulesDir = join(srcDir, "modules");
    const islandsDir = join(srcDir, "islands");
    const adminDir = join(projectRoot, "admin-ui");

    try {
        await ensureDir(projectRoot);
        await ensureDir(srcDir);
        await ensureDir(modulesDir);
        await ensureDir(islandsDir);
        if (config.withAdminUI) {
            await ensureDir(adminDir);
            await writeFileAtomic(join(adminDir, "AdminPanel.tsx"), "<div>Welcome to Admin UI</div>\n");
        }
        // Entry file
        const entryFile = join(srcDir, `main.${config.language}`);
        let entryContent = `// Zenith entry point\n`;
        if (config.withTailwind) {
            entryContent += `import './index.css';\n`;
        }
        entryContent += `const app = document.getElementById('app');\nif (app) {\n  app.innerHTML = '<h1 style="color:#7c3aed">Welcome to ${config.projectName} 🚀</h1>'\n}\n`;
        await writeFileAtomic(entryFile, entryContent);

        // TailwindCSS scaffolding
        if (config.withTailwind) {
            // tailwind.config.js
            await writeFileAtomic(
                join(projectRoot, 'tailwind.config.js'),
                `module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: { extend: {} },
  plugins: [],
};
`
            );
            // postcss.config.js
            await writeFileAtomic(
                join(projectRoot, 'postcss.config.js'),
                `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`
            );
            // src/index.css
            await writeFileAtomic(
                join(srcDir, 'index.css'),
                `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`
            );
            // package.json (add dependencies)
            const pkgPath = join(projectRoot, 'package.json');
            let pkg: any = {};
            try {
                const fs = await import('fs/promises');
                pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
            } catch {
                pkg = { name: config.projectName, version: '0.1.0', dependencies: {}, devDependencies: {} };
            }
            pkg.dependencies = pkg.dependencies || {};
            pkg.devDependencies = pkg.devDependencies || {};
            pkg.devDependencies["tailwindcss"] = "^3.4.1";
            pkg.devDependencies["postcss"] = "^8.4.38";
            pkg.devDependencies["autoprefixer"] = "^10.4.16";
            await writeFileAtomic(pkgPath, JSON.stringify(pkg, null, 2));
        }
        // Vite config
        const viteConfigFile = join(projectRoot, `vite.config.${config.language === 'ts' ? 'ts' : 'js'}`);
        await writeFileAtomic(
            viteConfigFile,
            config.language === 'ts'
                ? `import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: { outDir: 'dist' },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
`
                : `const { defineConfig } = require('vite');
const path = require('path');

module.exports = defineConfig({
  root: '.',
  publicDir: 'public',
  build: { outDir: 'dist' },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
`
        );
        // public/index.html
        const publicDir = join(projectRoot, 'public');
        await ensureDir(publicDir);
        await writeFileAtomic(
            join(publicDir, 'index.html'),
            `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.projectName}</title>
    ${config.withTailwind ? '<link rel="stylesheet" href="/src/index.css" />' : ''}
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.${config.language}"></script>
  </body>
</html>
`
        );
        // Update package.json with scripts and vite devDependency
        const pkgPath = join(projectRoot, 'package.json');
        let pkg: any = {};
        try {
            const fs = await import('fs/promises');
            pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
        } catch {
            pkg = { name: config.projectName, version: '0.1.0', dependencies: {}, devDependencies: {} };
        }
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.dev = 'vite';
        pkg.scripts.build = 'vite build';
        pkg.scripts.preview = 'vite preview';
        pkg.devDependencies = pkg.devDependencies || {};
        pkg.devDependencies["vite"] = "^5.2.0";
        if (config.withTailwind) {
            pkg.devDependencies["tailwindcss"] = "^3.4.1";
            pkg.devDependencies["postcss"] = "^8.4.38";
            pkg.devDependencies["autoprefixer"] = "^10.4.16";
        }
        await writeFileAtomic(pkgPath, JSON.stringify(pkg, null, 2));
        // Example modules (stub)
        for (const mod of config.exampleModules) {
            const modDir = join(modulesDir, mod);
            await ensureDir(modDir);
            await writeFileAtomic(
                join(modDir, "index.ts"),
                `// Example module: ${mod}\nexport function setup() {\n  console.log('Setting up ${mod} module');\n}\n`
            );
        }

        // --- SERVER SCAFFOLDING (SSR/API) ---
        if (config.ssr) {
            const serverDir = join(projectRoot, 'server');
            await ensureDir(serverDir);
            await writeFileAtomic(
                join(serverDir, 'index.ts'),
                `import Fastify from 'fastify';
import path from 'path';
import fastifyStatic from '@fastify/static';

const fastify = Fastify();
const port = process.env.PORT || 3000;

// Serve static files from dist
fastify.register(fastifyStatic, {
  root: path.resolve(__dirname, '../dist'),
  prefix: '/',
});

// Example API route
fastify.get('/api/hello', async (request, reply) => {
  return { message: 'Hello from Zenith API!' };
});

// SSR handler (placeholder)
fastify.get('/*', async (request, reply) => {
  reply.type('text/html').send(` + "`<!DOCTYPE html><html><head><title>Zenith SSR</title></head><body><div id=\"app\">SSR not yet implemented</div></body></html>`" + `);
});

fastify.listen({ port }, (err, address) => {
  if (err) throw err;
  console.log('🚀 Zenith server running at ' + address);
});
`
            );
            // Add fastify and @fastify/static to dependencies and scripts to package.json
            const pkgPath = join(projectRoot, 'package.json');
            let pkg: any = {};
            try {
                const fs = await import('fs/promises');
                pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
            } catch {
                pkg = { name: config.projectName, version: '0.1.0', dependencies: {}, devDependencies: {}, scripts: {} };
            }
            pkg.dependencies = pkg.dependencies || {};
            pkg.dependencies["fastify"] = "^4.27.2";
            pkg.dependencies["@fastify/static"] = "^6.14.0";
            pkg.scripts = pkg.scripts || {};
            pkg.scripts.start = 'node ./server/index.js';
            pkg.scripts.serve = 'vite build && node ./server/index.js';
            await writeFileAtomic(pkgPath, JSON.stringify(pkg, null, 2));
        }

        // README
        const readmeTemplate = `# {{projectName}}\n\nWelcome to your Zenith project!\n\n- Language: {{language}}\n- SSR: {{ssr}}\n- Admin UI: {{withAdminUI}}\n- TailwindCSS: {{withTailwind}}\n- Example Modules: {{exampleModules}}\n\nGet started by editing \`src/main.{{language}}\` and exploring the \`src/modules\` and \`src/islands\` folders.\n\n{{ssrSection}}`;
        const ssrSection = config.ssr
          ? `## SSR & API\n- Run \`npm run dev\` for Vite dev server\n- Run \`npm run serve\` to build and start the SSR server\n- Example API: [http://localhost:3000/api/hello](http://localhost:3000/api/hello)\n`
          : '';
        await writeFileAtomic(
            join(projectRoot, "README.md"),
            renderTemplate(readmeTemplate, {
                projectName: config.projectName,
                language: config.language === "ts" ? "TypeScript" : "JavaScript",
                ssr: config.ssr ? "Enabled" : "Disabled",
                withAdminUI: config.withAdminUI ? "Yes" : "No",
                withTailwind: config.withTailwind ? "Yes" : "No",
                exampleModules: config.exampleModules.length ? config.exampleModules.join(", ") : "None",
                ssrSection,
            })
        );

        // --- DEPENDENCY INSTALL PROMPT ---
        const installDeps = await p.confirm({
            message: "Install dependencies now? (Bun or NPM)",
            initialValue: true,
        });
        if (installDeps) {
            const { execSync } = await import('child_process');
            let pkgManager = 'bun';
            try {
                execSync('bun --version', { stdio: 'ignore' });
            } catch {
                pkgManager = 'npm';
            }
            p.note(`Installing dependencies with ${pkgManager}...`);
            try {
                execSync(`${pkgManager} install`, { cwd: projectRoot, stdio: 'inherit' });
                if (config.withTailwind && pkgManager === 'bun') {
                    execSync(`bun add -d tailwindcss@^3.4.1 postcss@^8.4.38 autoprefixer@^10.4.16`, { cwd: projectRoot, stdio: 'inherit' });
                }
                p.outro(`✅ Dependencies installed with ${pkgManager}.`);
            } catch (err) {
                p.cancel(color.red(`Dependency installation failed: ${err}`));
            }
        }

        p.outro(`✅ Project ${color.cyan(config.projectName)} scaffolded in ${color.dim(projectRoot)}`);
    } catch (err) {
        p.cancel(color.red(`Scaffolding failed: ${err}`));
    }
}