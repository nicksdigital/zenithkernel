/// <reference types="vite/client" />

interface ImportMeta {
    glob: (path: string, options?: { eager?: boolean }) => Record<string, unknown>;
}
