import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import vitePluginHydra from "./src/plugins/vite-plugin-hydra";
import { builtinModules } from "module";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// @ts-ignore
export default defineConfig({
    plugins: [
        react({
            jsxImportSource: '@modules/Rendering',
            jsxRuntime: 'automatic'
        }), 
        tsconfigPaths(),
        vitePluginHydra(),
      nodePolyfills({
        protocolImports: true,
      })
    ],
    build: {
        target: 'node20',
         ssr: './src/ssr/jsx-ssr-runtime.ts',
		
        outDir: "dist",
        sourcemap: true,
        rollupOptions: {
			external: (source: string): boolean => {
				return builtinModules.includes(source) || source.startsWith('node:');
			},
		},
    },
    test: {
        environment: 'jsdom',
        setupFiles: './tests/setup.ts',
        globals: true
    },
   publicDir: 'public',
   base: '/',
   root: './',
    resolve: {
        //@ts-ignore
        alias: {
            "@core": "/src/core",
            "@types": "/src/types",
            "@utils": "/src/utils",
            "@modules": "/src/modules",
            "@bootstrap": "/src/bootstrap",
            "@decorators":"/src/decorators",
            //@ts-ignore
            "@cli/*": ["cli/*"]
        }
    },
    ssr: {
		target: 'node',
		noExternal: [ 'globby'],
	}
});
