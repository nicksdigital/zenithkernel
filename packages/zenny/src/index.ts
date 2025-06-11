/**
 * @zenithcore/zenny - ZenithKernel CLI
 *
 * Command-line interface for scaffolding, building, and managing
 * ZenithKernel applications and components.
 */

// Export CLI utilities for programmatic use
export * from './utils/scaffoldUtils';

// Export command implementations
export { runInit } from './commands/init';
export { runCreateModule } from './commands/create-module';
export { createHydra } from './commands/create-hydra';
export { listModules } from './commands/list-modules';
export { listSystems } from './commands/list-systems';
export { publishModule } from './commands/publish-module';
export { signManifest } from './commands/sign-manifest';
export { login } from './commands/login';
export { loginZK } from './commands/login-zk';
export { openDocs } from './commands/docs';
export { showHelp } from './commands/help';
export { hydrateLocalHydra, hydrateRemoteHydra } from './commands/hydrate';
export { publishManifestToQDHT } from './commands/publish-manifest-qdht';
export { bundlePack } from './commands/bundle/pack';

/**
 * CLI Version
 */
export const VERSION = '0.1.0';

/**
 * CLI Name
 */
export const CLI_NAME = 'zenny';

/**
 * CLI Description
 */
export const CLI_DESCRIPTION = 'Command-line interface for ZenithKernel framework';
