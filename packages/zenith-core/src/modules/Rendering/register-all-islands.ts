/**
 * Auto-register all islands in the islands/ directory.
 *
 * Dynamically imports all .js/.tsx files and registers them with the global islandLoader.
 *
 * Usage: import { registerAllIslands } from './register-all-islands';
 *        registerAllIslands();
 */
import { islandLoader } from './island-loader';
import type { IslandRegistration } from './types';

export async function registerAllIslands(): Promise<void> {
  // @ts-ignore: Vite/Bun/webpack dynamic import context
  const context = import.meta.glob('./islands/*.{js,tsx}', { eager: true });
  for (const path in context) {
    const mod = context[path] as any;
    if (mod && mod.default && typeof mod.default.mount === 'function') {
      const registration: IslandRegistration = {
        name: mod.default.name || path.split('/').pop()?.replace(/\.(js|tsx)$/, '') || 'unknown',
        component: mod.default,
        modulePath: path,
        ...(mod.metadata || {})
      };
      islandLoader.registerIsland(registration);
    }
  }
} 