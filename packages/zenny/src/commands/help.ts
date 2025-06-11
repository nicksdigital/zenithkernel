export function showHelp() {
    console.log(`
🧠 ZenithKernel CLI
---------------------

Usage:
  zenith <command> [options]

Core Commands:
  init                       Create a new Zenith project
  create module <name>      Scaffold a new module
  build                      Compile core and WASM modules

Auth & Signing:
  login --zk                Login via Dilithium/ZK challenge
  sign manifest <path>      Sign a module manifest
  verify manifest <path>    Validate a manifest's signature

Kernel Insight:
  system info               View registered systems and components
  list systems              List all active system classes

Docs:
  docs                      Show docs endpoint or launch Swagger UI

Misc:
  --help                    Show this help message
`);
}
