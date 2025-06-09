// @ts-ignore
import {ManifestPolicy, ModuleManifest} from "@types";

export class DynamicManifestResolver {
    constructor(private policy: ManifestPolicy) {}

    async resolve(moduleRef: string): Promise<ModuleManifest> {
        const [id, version = "latest"] = moduleRef.split("@");
        const candidates = await this.discoverManifests(id, version);

        for (const url of candidates) {
            try {
                const res = await fetch(url);
                if (!res.ok) continue;

                const manifest = await res.json() as ModuleManifest;
                manifest.sourceUrl = url;

                if (!this.verify(manifest)) continue;

                return manifest;
            } catch {
                continue; // silently skip invalid manifests
            }
        }

        throw new Error(`No valid manifest found for module "${moduleRef}"`);
    }

    private async discoverManifests(id: string, version: string): Promise<string[]> {
        // You could later hook in IPFS, DHTs, DNS over HTTPS, etc.
        return [
            `/manifests/${id}.json`,                                 // local dev
            `https://cdn.zenithos.dev/modules/${id}@${version}.json`, // production mirror
            `https://ipfs.io/ipfs/<CID_FOR_${id}_${version}>`         // decentralized
        ];
    }

    private verify(manifest: ModuleManifest): boolean {
        const { trustedDomains, maxPermissions, requiredContext } = this.policy;

        const source = new URL(manifest.sourceUrl);
        // @ts-ignore
        const domainValid = trustedDomains.some(domain => source.hostname.includes(domain));
        // @ts-ignore
        const permsValid = manifest.permissions.every(p => maxPermissions.includes(p));
        const contextValid = requiredContext ? manifest.context === requiredContext : true;

        return domainValid && permsValid && contextValid;
    }

    async fetchRemoteManifest(id: string, version: string, token?: string) {
        const url = `https://registry.zenith.dev/${id}@${version}.json`;

        const res = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
        return res.json();
    }

}
