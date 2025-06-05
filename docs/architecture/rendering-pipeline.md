# Building a Superfast JIT Hydra (Islands) Rendering Module with TypeScript

This document outlines the architecture and implementation details for creating a high-performance, Just-In-Time (JIT) rendering module for "Hydra Components" (Islands Architecture) using TypeScript. We'll leverage TypeScript's strong typing for robust development and focus on minimizing JavaScript payloads and maximizing rendering efficiency by bypassing traditional Virtual DOM overhead where appropriate.

## 1. Core Concepts Recap

* **Islands Architecture (Hydra Components):** Most of your web page is static HTML, with isolated "islands" of interactivity. These islands are your Hydra Components. They load and hydrate independently.
* **JIT Hydration:** JavaScript for each island is loaded and executed only when needed (e.g., when the island becomes visible or a user interacts with it).
* **TSX without React Runtime:** We use TypeScript's TSX syntax for a familiar developer experience in defining components, but compile it to direct DOM manipulations or calls to a lightweight custom rendering/hyperscript function, avoiding the React runtime.
* **Performance Goals:**
    * Minimal First Contentful Paint (FCP) and Largest Contentful Paint (LCP) by serving static HTML.
    * Low Total Blocking Time (TBT) by deferring JS execution.
    * Small JavaScript bundles per island.
    * Fast updates within hydrated islands.

## 2. Project Setup & Tooling

### 2.2. `tsconfig.json`

Crucially, you need to configure TypeScript to use your custom TSX factory.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "jsx": "react-jsx", // Or "preserve" if your build tool handles JSX transformation separately
    "jsxImportSource": "./src/runtime", // Points to where jsx-runtime.ts is resolvable
    // If using "react-jsx", tsconfig 5.0+ might try to find jsx-dev-runtime too.
    // You might need to map it or ensure your custom runtime handles both.
    // For older setups or "jsx": "react"
    // "jsxFactory": "h",
    // "jsxFragmentFactory": "Fragment",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@framework/*": ["src/framework/*"],
      "@islands/*": ["src/islands/*"],
      "@components/*": ["src/components/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}


// src/runtime/jsx-runtime.ts

// For "jsx": "react-jsx" in tsconfig.json
// File should be named jsx-runtime.js or jsx-runtime.ts (if your bundler handles .ts extension resolution)
// and located where `jsxImportSource` can find it.

export namespace JSX {
  export interface IntrinsicElements {
    [elemName: string]: any; // Allow any HTML element and custom attributes
  }
  export interface ElementChildrenAttribute { children?: {}; }
  // If you want to type children more strictly:
  // type Element = HTMLElement | DocumentFragment;
  // interface ElementChildrenAttribute { children?: Node | Node[] | string | (Node | string)[]; }
}

type Child = HTMLElement | DocumentFragment | string | number | null | undefined;
type Children = Child | Child[];

interface Attributes {
  [key: string]: any;
  children?: Children;
}

// `jsx` is for single elements, `jsxs` is for elements with multiple children (optimization)
// However, for simplicity, you can often just implement `jsx` and have `jsxs` be an alias or similar.

export function jsx(type: string | ((props: any) => HTMLElement | DocumentFragment), props: Attributes, key?: string): HTMLElement | DocumentFragment {
  // `key` is provided by TSX transform but we might not use it directly here unless building a VDOM
  const { children, ...restProps } = props;

  if (typeof type === 'function') {
    // This handles functional components if you choose to support them at this level
    return type({ ...restProps, children });
  }

  const element = document.createElement(type as string);

  for (const [key, value] of Object.entries(restProps)) {
    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else if (key === 'className' || key === 'class') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (typeof value === 'boolean') {
      if (value) {
        element.setAttribute(key, ''); // For boolean attributes like 'disabled'
      }
    } else if (value != null) { // Ensure value is not null or undefined
      element.setAttribute(key, String(value));
    }
  }

  appendChildren(element, children);
  return element;
}

// `jsxs` is typically an optimized version for multiple children.
// For simplicity, we can make it an alias or handle it similarly.
export const jsxs = jsx;

export function Fragment(props: { children?: Children }): DocumentFragment {
  const fragment = document.createDocumentFragment();
  if (props.children) {
    appendChildren(fragment, props.children);
  }
  return fragment;
}

function appendChildren(parent: HTMLElement | DocumentFragment, children: Children) {
  if (Array.isArray(children)) {
    children.forEach(child => appendChildren(parent, child));
  } else if (children instanceof Node) {
    parent.appendChild(children);
  } else if (typeof children === 'string' || typeof children === 'number') {
    parent.appendChild(document.createTextNode(String(children)));
  }
  // null, undefined, or boolean children are ignored (common JSX behavior)
}

// If using older "jsxFactory": "h" approach:
/*
export function h(type: string | ((props: any) => HTMLElement), props: Attributes | null, ...children: Children[]): HTMLElement | DocumentFragment {
  const { ...restProps } = props || {}; // Handle null props

  if (typeof type === 'function') {
    return type({ ...restProps, children: children.flat() });
  }

  const element = document.createElement(type as string);
  // ... (attribute handling similar to jsx function above) ...

  children.flat().forEach(child => {
    if (child instanceof Node) {
      element.appendChild(child);
    } else if (child != null) {
      element.appendChild(document.createTextNode(String(child)));
    }
  });
  return element;
}

export function Fragment(props: null, ...children: Children[]): DocumentFragment {
  const fragment = document.createDocumentFragment();
  children.flat().forEach(child => {
     if (child instanceof Node) {
      fragment.appendChild(child);
    } else if (child != null) {
      fragment.appendChild(document.createTextNode(String(child)));
    }
  });
  return fragment;
}
*/

Constructing the Outline

I'm currently structuring a detailed Markdown outline for the "superfast JIT Hydra component (islands) rendering module" in TypeScript. My goal is to break down the development into logical sections, starting with the core concepts and moving toward practical implementation details. The structure will emphasize a step-by-step approach, ensuring clarity and ease of understanding for expert users.

Refining the Structure

My current focus is on building out the Markdown outline. I'm actively integrating the user's feedback into the directory structure and the details of Hydra Islands.  I am finalizing the structure of the "Defining Hydra Islands" section to ensure it clearly articulates how TypeScript interfaces and client-side logic are handled in the module. I'm also ensuring the "JSX Configuration" covers how the custom h function translates into DOM interactions.

Developing the Structure

My current approach is to structure the document as a detailed guide. I'm focusing on "Defining Hydra Islands" and "JSX Configuration," working through specific examples and TypeScript code snippets. I'm exploring the nuances of creating a custom h function within the TypeScript context. The goal is a highly practical, code-focused document that users can easily implement.  I'm also considering the best way to address "Efficient Rendering/Updating" which will be critical to the fast JIT rendering.

Formulating the Blueprint

My focus is on structuring the Markdown document into clear sections. I'm prioritizing the order the user suggested, starting with a core concepts recap and concluding with example islands and build process overview. I am now incorporating TypeScript examples for the custom h function, and how it translates to DOM elements. The directory structure will need to be thoughtfully organized to make sense.

Structuring the Document

I'm now building the Markdown document, using Markdown formatting for clarity. I'm prioritizing the outlined sections and TypeScript examples. The focus is on a comprehensive, illustrative guide that avoids being a complete, runnable framework, but provides a solid blueprint. This is crucial as I will not be able to test code. I'm now crafting the "Core Concepts Recap" section.

Okay, here's a detailed Markdown document outlining how to build a superfast JIT Hydra Component (Islands) rendering module using TypeScript.

Markdown

# Building a Superfast JIT Hydra (Islands) Rendering Module with TypeScript

This document outlines the architecture and implementation details for creating a high-performance, Just-In-Time (JIT) rendering module for "Hydra Components" (Islands Architecture) using TypeScript. We'll leverage TypeScript's strong typing for robust development and focus on minimizing JavaScript payloads and maximizing rendering efficiency by bypassing traditional Virtual DOM overhead where appropriate.

## 1. Core Concepts Recap

* **Islands Architecture (Hydra Components):** Most of your web page is static HTML, with isolated "islands" of interactivity. These islands are your Hydra Components. They load and hydrate independently.
* **JIT Hydration:** JavaScript for each island is loaded and executed only when needed (e.g., when the island becomes visible or a user interacts with it).
* **TSX without React Runtime:** We use TypeScript's TSX syntax for a familiar developer experience in defining components, but compile it to direct DOM manipulations or calls to a lightweight custom rendering/hyperscript function, avoiding the React runtime.
* **Performance Goals:**
    * Minimal First Contentful Paint (FCP) and Largest Contentful Paint (LCP) by serving static HTML.
    * Low Total Blocking Time (TBT) by deferring JS execution.
    * Small JavaScript bundles per island.
    * Fast updates within hydrated islands.

## 2. Project Setup & Tooling

### 2.1. Directory Structure (Example)

.
├── src/
│   ├── components/             # Reusable UI pieces (can be static or parts of islands)
│   │   └── Button.tsx
│   ├── islands/                # Hydra Components (Islands of interactivity)
│   │   ├── CounterIsland.tsx
│   │   └── UserProfileIsland.tsx
│   ├── framework/              # Core Hydra framework logic
│   │   ├── jsx-runtime.ts      # Custom TSX factory functions (h, Fragment)
│   │   ├── hydra-loader.ts     # Client-side script to discover and hydrate islands
│   │   └── reactivity.ts       # Optional: Lightweight reactivity system
│   ├── styles/                 # Global styles and island-specific styles
│   ├── main.ts                 # Main client-side entry point (imports hydra-loader)
│   └── server.ts               # Example server-side rendering logic (Node.js/Express)
├── public/                     # Static assets
│   └── index.html              # Base HTML structure (if not fully SSR)
├── tsconfig.json
├── package.json
└── build-tools/                # Build scripts (e.g., esbuild scripts)


### 2.2. `tsconfig.json`

Crucially, you need to configure TypeScript to use your custom TSX factory.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "jsx": "react-jsx", // Or "preserve" if your build tool handles JSX transformation separately
    "jsxImportSource": "./src/framework", // Points to where jsx-runtime.ts is resolvable
    // If using "react-jsx", tsconfig 5.0+ might try to find jsx-dev-runtime too.
    // You might need to map it or ensure your custom runtime handles both.
    // For older setups or "jsx": "react"
    // "jsxFactory": "h",
    // "jsxFragmentFactory": "Fragment",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@framework/*": ["src/framework/*"],
      "@islands/*": ["src/islands/*"],
      "@components/*": ["src/components/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
Note on jsxImportSource vs jsxFactory:

"jsx": "react-jsx" with "jsxImportSource" is the more modern approach, aligning with how React 17+ handles JSX. TypeScript will expect jsx-runtime.js (or .ts) in the specified source to export jsx and jsxs.
Older setups might use "jsx": "react" with "jsxFactory": "h" and "jsxFragmentFactory": "Fragment".
2.3. Build Tools
Choose a fast bundler that supports TypeScript, TSX, code splitting, and tree-shaking.

esbuild: Extremely fast, good for bundling, minification, and TS/TSX transformation.
SWC: Similar to esbuild, also very fast. Can be used as a Rust-based compiler within other tools.
Vite: Uses esbuild during development and Rollup for production builds. Excellent DX.
Parcel: Zero-config, good for smaller projects.
Webpack: Highly configurable but can be more complex to set up. Use ts-loader or @babel/plugin-transform-typescript with @babel/preset-react (configured for your custom pragma).
Example esbuild script snippet (build.mjs):

JavaScript

// build.mjs
import * as esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';

const islandDir = 'src/islands';
const outDir = 'dist/islands';

async function build() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  const islandFiles = (await fs.readdir(islandDir))
    .filter(file => file.endsWith('.tsx'))
    .map(file => path.join(islandDir, file));

  // Build islands separately for code splitting
  await Promise.all(islandFiles.map(islandPath =>
    esbuild.build({
      entryPoints: [islandPath],
      bundle: true,
      outfile: path.join(outDir, path.basename(islandPath).replace('.tsx', '.js')),
      format: 'esm',
      minify: true,
      sourcemap: true,
      treeShaking: true,
      jsxImportSource: './src/framework', // Ensure esbuild uses your custom JSX runtime
      // or:
      // jsxFactory: 'h',
      // jsxFragmentFactory: 'Fragment',
      loader: { '.tsx': 'tsx' },
      tsconfig: 'tsconfig.json',
    })
  ));

  // Build the main hydra-loader
  await esbuild.build({
    entryPoints: ['src/framework/hydra-loader.ts'],
    bundle: true,
    outfile: 'dist/framework/hydra-loader.js',
    format: 'esm',
    minify: true,
    sourcemap: true,
    treeShaking: true,
    loader: { '.ts': 'ts' },
    tsconfig: 'tsconfig.json',
  });

  console.log('Build complete!');
}

build().catch(e => {
  console.error(e);
  process.exit(1);
});
3. Custom TSX Runtime (src/framework/jsx-runtime.ts)
This is where you define how TSX expressions are converted into actual DOM elements or instructions for your renderer.

TypeScript

// src/framework/jsx-runtime.ts

// For "jsx": "react-jsx" in tsconfig.json
// File should be named jsx-runtime.js or jsx-runtime.ts (if your bundler handles .ts extension resolution)
// and located where `jsxImportSource` can find it.

export namespace JSX {
  export interface IntrinsicElements {
    [elemName: string]: any; // Allow any HTML element and custom attributes
  }
  export interface ElementChildrenAttribute { children?: {}; }
  // If you want to type children more strictly:
  // type Element = HTMLElement | DocumentFragment;
  // interface ElementChildrenAttribute { children?: Node | Node[] | string | (Node | string)[]; }
}

type Child = HTMLElement | DocumentFragment | string | number | null | undefined;
type Children = Child | Child[];

interface Attributes {
  [key: string]: any;
  children?: Children;
}

// `jsx` is for single elements, `jsxs` is for elements with multiple children (optimization)
// However, for simplicity, you can often just implement `jsx` and have `jsxs` be an alias or similar.

export function jsx(type: string | ((props: any) => HTMLElement | DocumentFragment), props: Attributes, key?: string): HTMLElement | DocumentFragment {
  // `key` is provided by TSX transform but we might not use it directly here unless building a VDOM
  const { children, ...restProps } = props;

  if (typeof type === 'function') {
    // This handles functional components if you choose to support them at this level
    return type({ ...restProps, children });
  }

  const element = document.createElement(type as string);

  for (const [key, value] of Object.entries(restProps)) {
    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), value);
    } else if (key === 'className' || key === 'class') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (typeof value === 'boolean') {
      if (value) {
        element.setAttribute(key, ''); // For boolean attributes like 'disabled'
      }
    } else if (value != null) { // Ensure value is not null or undefined
      element.setAttribute(key, String(value));
    }
  }

  appendChildren(element, children);
  return element;
}

// `jsxs` is typically an optimized version for multiple children.
// For simplicity, we can make it an alias or handle it similarly.
export const jsxs = jsx;

export function Fragment(props: { children?: Children }): DocumentFragment {
  const fragment = document.createDocumentFragment();
  if (props.children) {
    appendChildren(fragment, props.children);
  }
  return fragment;
}

function appendChildren(parent: HTMLElement | DocumentFragment, children: Children) {
  if (Array.isArray(children)) {
    children.forEach(child => appendChildren(parent, child));
  } else if (children instanceof Node) {
    parent.appendChild(children);
  } else if (typeof children === 'string' || typeof children === 'number') {
    parent.appendChild(document.createTextNode(String(children)));
  }
  // null, undefined, or boolean children are ignored (common JSX behavior)
}

// If using older "jsxFactory": "h" approach:
/*
export function h(type: string | ((props: any) => HTMLElement), props: Attributes | null, ...children: Children[]): HTMLElement | DocumentFragment {
  const { ...restProps } = props || {}; // Handle null props

  if (typeof type === 'function') {
    return type({ ...restProps, children: children.flat() });
  }

  const element = document.createElement(type as string);
  // ... (attribute handling similar to jsx function above) ...

  children.flat().forEach(child => {
    if (child instanceof Node) {
      element.appendChild(child);
    } else if (child != null) {
      element.appendChild(document.createTextNode(String(child)));
    }
  });
  return element;
}

export function Fragment(props: null, ...children: Children[]): DocumentFragment {
  const fragment = document.createDocumentFragment();
  children.flat().forEach(child => {
     if (child instanceof Node) {
      fragment.appendChild(child);
    } else if (child != null) {
      fragment.appendChild(document.createTextNode(String(child)));
    }
  });
  return fragment;
}
*/
4. Defining Hydra Islands
Islands are regular TSX components but with a specific role: they are entry points for client-side interactivity.

4.1. Island Props and Structure
TypeScript

// src/islands/CounterIsland.tsx
// Ensure you import your custom JSX runtime if not using jsxImportSource
// import { jsx, Fragment } from '@framework/jsx-runtime'; // if using jsxFactory

export interface CounterIslandProps {
  initialCount?: number;
  label: string;
}

// This is the function that will be called on the client-side to hydrate/render the island
export function mount(element: HTMLElement, props: CounterIslandProps) {
  let count = props.initialCount || 0;

  const updateText = () => {
    // Assuming the server rendered HTML structure for the button and text
    const textElement = element.querySelector<HTMLSpanElement>('.count-text');
    if (textElement) {
      textElement.textContent = `${props.label}: ${count}`;
    }
  };

  const button = element.querySelector<HTMLButtonElement>('button');
  if (button) {
    button.addEventListener('click', () => {
      count++;
      updateText();
    });
  }
  updateText(); // Initial render of text
  console.log(`CounterIsland mounted on:`, element, `with props:`, props);
}

// Optional: If you want to use TSX to define the *initial* structure
// that the server would render, or that `mount` would create if hydrating an empty div.
// This is more for developer convenience if the island's HTML is complex.
export function CounterIslandView(props: CounterIslandProps): HTMLElement {
  // Note: This function is for defining structure. The actual event listeners
  // and state logic are in `mount`.
  // The `mount` function would then query selectors based on this structure.
  return (
    <div class="counter-island">
      <span class="count-text">{props.label}: {props.initialCount || 0}</span>
      <button type="button">Increment</button>
      <p><small>Hydrated Island</small></p>
    </div>
  ) as HTMLElement;
}
5. Server-Side Rendering (SSR) / Static Site Generation (SSG)
The server (or build process) needs to render the static HTML for islands and embed information for client-side hydration.

TypeScript

// src/server.ts (Example using Node.js and a hypothetical TSX-to-string renderer)
import http from 'http';
// For a real SSR solution, you'd use a more robust TSX-to-string renderer
// or your custom jsx-runtime could be adapted to output strings.
// For this example, we'll manually construct the HTML for islands.
// Or, you could use CounterIslandView if it returns a string or DOM structure that can be serialized.
import { CounterIslandView, CounterIslandProps } from './islands/CounterIsland'; // Assuming CounterIslandView is adapted for SSR

// A simple TSX to string function (very basic, not for production)
function renderTSXToString(element: HTMLElement): string {
  return element.outerHTML;
}

function renderPageWithIslands(): string {
  const counterProps: CounterIslandProps = { initialCount: 5, label: "Votes" };
  
  // If CounterIslandView directly returns an HTMLElement:
  // const counterIslandHTML = renderTSXToString(CounterIslandView(counterProps));

  // For simplicity, let's assume a pre-defined structure for the island's HTML
  // that the `mount` function expects.
  const counterIslandHTML = `
    <div class="counter-island">
      <span class="count-text">${counterProps.label}: ${counterProps.initialCount || 0}</span>
      <button type="button">Increment</button>
      <p><small>Static HTML - awaiting hydration</small></p>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hydra Islands Demo</title>
      <link rel="stylesheet" href="/styles/main.css">
    </head>
    <body>
      <h1>Welcome to Hydra Islands</h1>
      <p>Some static content here.</p>

      <section class="island-container"
               data-hydra-island="CounterIsland"
               data-props="${JSON.stringify(counterProps).replace(/"/g, '&quot;')}">
        ${counterIslandHTML}
      </section>

      <p>More static content.</p>
      
      <script src="/framework/hydra-loader.js" type="module" async defer></script>
    </body>
    </html>
  `;
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    const pageHtml = renderPageWithIslands();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(pageHtml);
  } else if (req.url === '/styles/main.css') {
    // Serve CSS (implement this)
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end('/* styles here */');
  } else if (req.url?.startsWith('/islands/') || req.url?.startsWith('/framework/')) {
    // Serve island JS bundles (implement this, ideally with proper routing and fs)
    // This would be handled by your static file server or bundler in dev mode.
    // For example, if using esbuild serve:
    // `esbuild src/islands/CounterIsland.tsx --bundle --outfile=dist/islands/CounterIsland.js --format=esm ...`
    // `esbuild src/framework/hydra-loader.ts --bundle --outfile=dist/framework/hydra-loader.js --format=esm ...`
    res.writeHead(404);
    res.end();
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log("Ensure your build process has created 'dist/islands/*.js' and 'dist/framework/hydra-loader.js'");
});
6. Client-Side JIT Hydration Logic (src/framework/hydra-loader.ts)
This script runs on the client, discovers islands, and hydrates them JIT.

TypeScript

// src/framework/hydra-loader.ts

interface IslandModule {
  mount: (element: HTMLElement, props: any) => void;
  // You could add other exports like `unmount` if needed
}

const islandsToHydrate: Array<{element: HTMLElement, name: string, props: any}> = [];

function discoverIslands() {
  const islandElements = document.querySelectorAll<HTMLElement>('[data-hydra-island]');
  islandElements.forEach(element => {
    const islandName = element.dataset.hydraIsland;
    const propsString = element.dataset.props;
    
    if (!islandName) {
      console.warn('Found an element with data-hydra-island but no island name.', element);
      return;
    }

    let props = {};
    if (propsString) {
      try {
        props = JSON.parse(propsString);
      } catch (e) {
        console.error(`Failed to parse props for island ${islandName}:`, e, element);
      }
    }
    islandsToHydrate.push({element, name: islandName, props});
  });
}

async function hydrateIsland({element, name, props}: {element: HTMLElement, name: string, props: any}) {
  if (element.dataset.hydrated === 'true') {
    return; // Already hydrated or hydration in progress
  }
  element.dataset.hydrated = 'true'; // Mark as processing

  try {
    // Dynamic import path needs to be resolvable by your bundler.
    // This usually means the path relative to the output directory or a base URL.
    // Your build tool should place island bundles in a predictable location (e.g., /islands/).
    const islandModule = await import(`../islands/${name}.js`) as IslandModule; // Adjust path as per your build output
    
    if (islandModule && typeof islandModule.mount === 'function') {
      islandModule.mount(element, props);
      element.classList.add('hydrated'); // Optional: for styling/debugging
      console.log(`Island "${name}" hydrated.`);
    } else {
      console.error(`Island module for "${name}" does not have a valid mount function.`);
      element.dataset.hydrated = 'false'; // Reset if failed
    }
  } catch (error) {
    console.error(`Failed to load or mount island "${name}":`, error);
    element.dataset.hydrated = 'false'; // Reset if failed
  }
}

// --- Hydration Strategies ---

// Strategy 1: Intersection Observer (recommended for most cases)
function observeAndHydrate() {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const islandToProcess = islandsToHydrate.find(isl => isl.element === entry.target);
        if (islandToProcess) {
          hydrateIsland(islandToProcess);
          obs.unobserve(entry.target); // Hydrate only once
        }
      }
    });
  }, { rootMargin: '200px 0px' }); // Start loading when 200px away from viewport

  islandsToHydrate.forEach(island => observer.observe(island.element));
}

// Strategy 2: Hydrate on event (e.g., click, hover)
// You would add placeholder event listeners during discovery or initial static render
// and then call hydrateIsland inside those listeners.

// Strategy 3: Immediate hydration (for critical above-the-fold islands)
function hydrateImmediately() {
  islandsToHydrate.forEach(hydrateIsland);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  discoverIslands();
  if (islandsToHydrate.length > 0) {
    observeAndHydrate(); // Or choose another strategy
    // For specific critical islands:
    // islandsToHydrate.filter(i => i.name === 'CriticalNav').forEach(hydrateIsland);
  }
});
7. Efficient Rendering/Updating within an Island
Once an island is hydrated, its mount function (and any internal methods/reactivity) handles updates.

Direct DOM Manipulation: As shown in CounterIsland.tsx, directly select and update DOM elements. This is very fast for simple updates.

Fine-Grained Reactivity (Optional - src/framework/reactivity.ts):
For more complex islands, you might implement a simple reactivity system (signals/observables). This is a larger topic, but here's a conceptual idea:

TypeScript

// src/framework/reactivity.ts (Conceptual)
export type Signal<T> = {
  (): T; // Getter
  set: (newValue: T) => void; // Setter
  subscribe: (listener: (value: T) => void) => () => void; // Listener
};

export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const listeners = new Set<(value: T) => void>();

  const signal = () => value;
  signal.set = (newValue: T) => {
    if (Object.is(value, newValue)) return;
    value = newValue;
    listeners.forEach(l => l(value));
  };
  signal.subscribe = (listener: (value: T) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener); // Unsubscribe function
  };
  return signal;
}

// Effect subscribes to signals used within its callback and re-runs on change
export function createEffect(effectFn: () => void) {
  // This requires more complex dependency tracking (see SolidJS, Vue Reactivity)
  // For a simple version, you might manually subscribe within the effect.
  effectFn(); // Run once initially
}
Using it in an island:

TypeScript

// In CounterIsland.tsx with reactivity
// import { createSignal, createEffect } from '@framework/reactivity';
// export function mount(element: HTMLElement, props: CounterIslandProps) {
//   const count = createSignal(props.initialCount || 0);
//   const label = props.label;
//
//   const textElement = element.querySelector<HTMLSpanElement>('.count-text');
//   const button = element.querySelector<HTMLButtonElement>('button');
//
//   if (button) {
//     button.addEventListener('click', () => count.set(count() + 1));
//   }
//
//   createEffect(() => {
//     if (textElement) {
//       textElement.textContent = `${label}: ${count()}`;
//     }
//   });
// }
Note: Building a robust and efficient fine-grained reactivity system is complex. Consider using battle-tested standalone libraries like @preact/signals, solid-js/store, or nanostores if your islands need more complex state management.

8. State Management within Islands
Local State: For most islands, simple variables within the mount function's closure or class properties (if using classes for islands) are sufficient.
Reactivity: Use the system described above or a library for more complex state that needs to trigger DOM updates.
No Global State (by default): Islands are isolated. If you need to share state between islands, use standard browser mechanisms (Custom Events, BroadcastChannel, localStorage, query params) or a lightweight global store if absolutely necessary.
9. Type Safety
TypeScript is your friend here:

Strongly type props for each island.
Use type guards when querying DOM elements (element instanceof HTMLButtonElement).
Define types for your jsxFactory arguments and return values.
Type the modules and functions in your hydra-loader.
10. Example: Data Fetching Island
TypeScript

// src/islands/UserProfileIsland.tsx

export interface UserProfileProps {
  userId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

// This function defines the initial HTML structure (can be rendered by server)
export function UserProfileView(props: UserProfileProps, user?: User | null, isLoading: boolean = false): HTMLElement {
  if (isLoading) {
    return <div class="user-profile loading">Loading user {props.userId}...</div> as HTMLElement;
  }
  if (!user) {
    return <div class="user-profile error">Failed to load user {props.userId}.</div> as HTMLElement;
  }
  return (
    <div class="user-profile">
      <h3>{user.name}</h3>
      <p>Email: {user.email}</p>
      <p><small>User ID: {user.id} (Hydrated)</small></p>
    </div>
  ) as HTMLElement;
}

export async function mount(element: HTMLElement, props: UserProfileProps) {
  element.innerHTML = ''; // Clear static content or placeholder
  element.appendChild(UserProfileView(props, undefined, true)); // Show loading state

  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/users/${props.userId}`); // Example API
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    const user = await response.json() as User;
    
    element.innerHTML = ''; // Clear loading state
    element.appendChild(UserProfileView(props, user, false));

  } catch (error) {
    console.error(`Error fetching user ${props.userId}:`, error);
    element.innerHTML = ''; // Clear loading state
    element.appendChild(UserProfileView(props, null, false)); // Show error state
  }
}
In your SSR/SSG:

HTML

<section class="island-container"
         data-hydra-island="UserProfileIsland"
         data-props='{"userId": "1"}'>
  <div class="user-profile loading">Loading user 1...</div>
</section>
11. Build Process Summary
Compile TS/TSX:
Island components (src/islands/*.tsx) are compiled into separate JS bundles (e.g., dist/islands/CounterIsland.js).
The hydra-loader.ts is compiled into a single small JS bundle (e.g., dist/framework/hydra-loader.js).
Your custom JSX runtime is bundled with each island or shared if possible.
SSR/SSG:
Your server-side TypeScript (e.g., server.ts) or static site generator renders HTML pages.
It embeds divs or other elements with data-hydra-island and data-props attributes.
It includes a <script type="module" src="/framework/hydra-loader.js" async defer></script>.
Deployment:
Deploy the static HTML, CSS, the hydra-loader.js, and the individual island JS bundles.
Conclusion
This document provides a comprehensive blueprint for building a fast, JIT-hydrated islands architecture with TypeScript and custom TSX handling. The key is to keep the client-side orchestration minimal, load code on demand, and perform efficient direct DOM updates or use fine-grained reactivity within hydrated islands. Remember to test performance rigorously and adapt these patterns to your specific application needs.