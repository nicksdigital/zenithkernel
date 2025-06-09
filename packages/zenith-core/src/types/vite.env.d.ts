/// <reference types="vite/client" />

interface ImportMeta {
    // @ts-ignore
    glob: (path: string, options?: { eager?: boolean }) => Record<string, unknown>;
}
