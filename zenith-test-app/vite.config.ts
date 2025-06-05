import { defineConfig } from 'vite';
import { hydraPlugin } from './src/zenith-framework/vite-plugins/vite-plugin-hydra'; // Adjust path
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import react from "@vitejs/plugin-react";
import { builtinModules } from "module";


// @ts-ignore
export default defineConfig({
    plugins: [

                hydraPlugin({
            islandsDir: 'src/islands', // Matches the directory you'll create for islands
            hmr: true,
        }),
        nodePolyfills()

    ],

    // Optional: define aliases for cleaner imports
    resolve: {
        alias: {
            '@zenith/rendering': './src/zenith-framework/rendering',
            '@zenith/hydra-runtime': './src/zenith-framework/hydra-runtime',
'@core/ZenithKernel': '../src/core/ZenithKernel',
            "@modules/Rendering": "./src/zenith-framework/rendering",
            "@bootstrap/LoadAllSystems": "../src/bootstrap/LoadAllSystems",
            '@adapters/KernelRouter': '../src/adapters/KernelRouter',
            '@decorators/HttpRoute': '../src/decorators/HttpRoute',
            '@modules/Rendering/island-loader': './src/zenith-framework/rendering/island-loader'


            // Add other aliases as needed
        },
    },
    build: {
        ssr: '../src/ssr/jsx-ssr-runtime.ts',
        rollupOptions: {
            external: (source: string): boolean => {
                return builtinModules.includes(source) || source.startsWith('node:');
            },
        },

    },
    optimizeDeps: {
        exclude: ['.vite', 'node_modules']
    },
    ssr: {
        target: 'node',
        noExternal: [ 'globby'],
    }
});