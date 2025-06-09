import { ZenithKernel } from "../core/ZenithKernel";

export interface Message {
    type: string;
    payload: any;
}

export interface ModuleLifecycle {
    onBeforeInit?(): void;
    onInit?(kernel: ZenithKernel): void;
    onReady?(): void;
    onUpdate?(): void;
    onBeforeUnload?(): void;
    onUnload?(): void;
}

export interface ModuleManifest {
    id: string;
    version: string;
    entry: string;
    blake3: string;
    context: string;
    permissions: string[];
    dependencies: string[];
    sourceUrl: string;
}

export interface ManifestPolicy {
    trustedDomains: string[];
    maxPermissions: string[];
    requiredContext?: string;
}

export interface IZenithModule {
    id: string;

    onLoad(param: this): void;

    onUnload(): void;
}