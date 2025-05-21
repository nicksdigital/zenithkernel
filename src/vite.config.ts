import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsconfigPaths()],
    build: {
        target: "esnext",
        outDir: "dist",
        sourcemap: true
    },
    resolve: {
        alias: {
            "@core": "/src/core",
            "@types": "/src/types",
            "@utils": "/src/utils",
            "@modules": "/src/modules",
            "@bootstrap": "/src/bootstrap"
        }
    }
});
