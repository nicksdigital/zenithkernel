/**
 * Test utilities for ZenithKernel islands.
 *
 * Provides helpers for mounting, hydrating, and asserting island state in tests.
 */
import { islandLoader } from '../island-loader';
import type { IslandConfig } from '../types';

/**
 * Mount an island component directly for unit tests.
 * @param element - The target DOM element
 * @param props - Props to pass to the island
 * @param context - Context to pass to the island
 * @returns Promise<void>
 */
export async function mountIsland(element: HTMLElement, props: any = {}, context: any = {}) {
  const islandName = element.getAttribute('data-zk-island');
  if (!islandName) throw new Error('Element missing data-zk-island');
  const registration = islandLoader.getIsland(islandName);
  if (!registration) throw new Error(`Island not registered: ${islandName}`);
  await registration.component.mount(element, props, context);
}

/**
 * Hydrate an island using the loader (integration test style).
 * @param element - The target DOM element
 * @param config - Optional partial config to override DOM attributes
 * @returns Promise<void>
 */
export async function hydrateIslandForTest(element: HTMLElement, config?: Partial<IslandConfig>) {
  const parsed = islandLoader['parseIslandConfig'](element);
  const finalConfig = { ...parsed, ...config };
  if (!finalConfig || typeof finalConfig.island !== 'string') {
    throw new Error('Cannot hydrate: missing island name');
  }
  return islandLoader.hydrateIsland(element, finalConfig as IslandConfig);
}

/**
 * Assert the state of an island DOM element.
 * @param element - The island root element
 * @param expectedState - 'hydrated' | 'loading' | 'error'
 */
export function assertIslandState(element: HTMLElement, expectedState: 'hydrated' | 'loading' | 'error') {
  const state = element.getAttribute('data-hydra-state');
  if (state !== expectedState) {
    throw new Error(`Expected island state '${expectedState}', got '${state}'`);
  }
} 