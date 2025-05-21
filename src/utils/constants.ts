// utils/constants.ts

// Contexts for cryptographic operations
export const BLAKE3_CONTEXTS = {
    MODULE_VERIFICATION: "ZenithKernel::ModuleVerification",
    ECS_STATE_SNAPSHOT: "ZenithKernel::ECSSnapshot",
    CONFIG_AUTH: "ZenithKernel::ConfigSignature"
};

// Default permissions for modules
export const MODULE_PERMISSIONS = {
    READ: "read",
    WRITE: "write",
    SCHEDULE: "scheduler",
    NETWORK: "network"
};

// System identifiers
export const SYSTEM_IDS = {
    PHYSICS: "physics",
    RENDER: "render",
    INPUT: "input",
    HEALTH: "health"
};

// Master key source placeholder (replace with secure loader)
export const MASTER_KEY: Uint8Array = new Uint8Array(32); // Fill with a secure key at runtime
