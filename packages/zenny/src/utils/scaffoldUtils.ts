/**
 * Utilities for project scaffolding: directory creation, atomic file writing, and template rendering.
 */
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

/**
 * Ensure a directory exists (recursive).
 * @param path - Directory path
 */
export async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

/**
 * Write a file atomically, ensuring parent directories exist.
 * @param path - File path
 * @param content - File content
 */
export async function writeFileAtomic(path: string, content: string) {
  await ensureDir(dirname(path));
  await writeFile(path, content);
}

/**
 * Render a template string with {{var}} replacements.
 * @param template - Template string
 * @param vars - Object of variables
 * @returns Rendered string
 */
export function renderTemplate(template: string, vars: Record<string, string | number | boolean>) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => String(vars[key] ?? ''));
} 