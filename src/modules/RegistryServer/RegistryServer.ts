import { ExposeRest } from "@decorators/ExposeRest";
import { HttpRoute } from "@decorators/HttpRoute";
import { randomBytes } from "crypto";

import { RegistryMeta } from "@components/registryMeta"; // Assuming this path is correct
import { SystemComponent } from "@decorators/SystemComponent"; // Assuming this path is correct
import { MessagingSystem } from "@core/MessagingSystem"; // Assuming this path is correct
import { ECSManager } from "@core/ECSManager"; // Assuming this is needed for 'this.ecs'
import { createVerifySystem, VerifySystem } from "./VerifySystem";

// Assuming Message type from @types (imported in MessagingSystem) looks something like this:
interface Message {
    type: string;
    payload: any;
    senderId?: string;
    // other potential fields like messageId, timestamp etc.
}

// Define a basic structure for what a Hydra entity's manifest might look like
interface HydraEntityManifest {
  id: string;
  name: string;
  version: string;
  entryPoint: string; // e.g., path to a WASM module or a component identifier
  permissions?: string[];
  dependencies?: string[];
  metadata?: Record<string, any>;
}

// Define a structure for storing challenges
interface ActiveChallenge {
  publicKey: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}

// Assume VerifySystem has a method like this (you'll need to implement it there)
export interface VerifySystemInterface {
  verifyProof(publicKey: string, challenge: string, proof: string): Promise<boolean>;
}


@ExposeRest("RegistryServer")
@SystemComponent({
    label: "RegistryServer",
    component: RegistryMeta, // This component would be rendered by your UI layer for this system
    props: { name: "RegistryServer" }
})
export class RegistryServer extends MessagingSystem {
    public entity!: number; // Assigned by ECSManager when the system's entity is created
    
    // In-memory store for Hydra entity manifests (replace with a persistent store in production)
    private hydraEntityRegistry = new Map<string, HydraEntityManifest>();

    // In-memory store for active challenges (replace with a persistent/cached store in production)
    private activeChallenges = new Map<string, ActiveChallenge>(); // publicKey -> ActiveChallenge
    public readonly channelId = "RegistryServer"; // Implements abstract property from MessagingSystem
    private readonly CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

    // Instance of VerifySystem (would be injected or retrieved from kernel)
    private verifySystem?: VerifySystemInterface; // You'll need to set this up

    constructor(ecs: ECSManager) {
        super(ecs); // Pass ECSManager to MessagingSystem's (or BaseSystem's) constructor
        this.verifySystem = createVerifySystem(ecs);

        console.log("🔻 Initializing RegistryServer with ECSManager and VerifySystem");
    }
   
    onUnload?(): void {
        // Cleanup logic, e.g., clear intervals, close connections
        this.activeChallenges.clear();
        console.log("🔻 RegistryServer unloaded");
    }

    // Overrides MessagingSystem.update to include its own logic + message handling
    update(): void {
        super.update(); // Call MessagingSystem's update to process messages
        this.cleanupExpiredChallenges(); // Perform RegistryServer specific updates
    }

    onLoad(): void {
        // Ensure this.entity is valid (usually set by the ECS when system is added)
        if (this.entity === undefined && this.ecs) {
            console.warn("RegistryServer: this.entity is not set by ECS. Ensure BaseSystem or system registration handles entity creation.");
        }

        if (this.ecs && typeof this.entity === 'number') {
             try {
                this.ecs.addComponent<RegistryMeta>(
                    this.entity, 
                    RegistryMeta, 
                    new RegistryMeta("RegistryServer") // Assuming RegistryMeta constructor
                );
                console.log("✅ RegistryServer's RegistryMeta component added to ECS entity:", this.entity);
            } catch (e: any) {
                console.error("Failed to add RegistryMeta component:", e.message, e.stack);
            }
        } else {
            console.warn("RegistryServer: ECSManager not available or entity not set, skipping component registration.");
        }
        console.log("✅ RegistryServer loaded and initialized");
    }

    /**
     * Retrieves the manifest or details for a registered Hydra entity.
     * This is crucial for the ZenithRouterIntegration.
     */
    @HttpRoute("GET", "/registry/entity/:hydraId")
    public getEntityRegistry(params: { hydraId: string }): HydraEntityManifest | { error: string } {
        const hydraId = params.hydraId;
        console.log(`[RegistryServer] Request to get entity registry for: ${hydraId}`);
        const manifest = this.hydraEntityRegistry.get(hydraId);
        if (manifest) {
            return manifest;
        }
        // Consider returning a 404 status code via your HTTP layer
        return { error: `Entity with ID '${hydraId}' not found.` };
    }

    /**
     * Registers a new Hydra entity or updates an existing one.
     * Can also be triggered via a message.
     */
    public registerHydraEntity(manifest: HydraEntityManifest): {success: boolean, id?: string, error?: string} {
        if (!manifest || !manifest.id) {
            console.error("[RegistryServer] Attempted to register entity with invalid manifest or missing ID.");
            return { success: false, error: "Invalid manifest or missing ID." };
        }
        this.hydraEntityRegistry.set(manifest.id, manifest);
        console.log(`[RegistryServer] Entity registered/updated: ${manifest.id}`);
        return { success: true, id: manifest.id };
    }

    @HttpRoute("POST", "/auth/challenge")
    handleChallenge(req: { body: { publicKey: string } }): { nonce: string } | { error: string } {
        try {
            const { publicKey } = req.body;
            if (!publicKey || typeof publicKey !== 'string' || publicKey.length < 10) {
                return { error: "Invalid or missing publicKey." };
            }

            const nonce = randomBytes(32).toString("hex");
            const now = Date.now();
            this.activeChallenges.set(publicKey, {
                publicKey,
                nonce,
                timestamp: now,
                expiresAt: now + this.CHALLENGE_EXPIRY_MS
            });

            console.log(`[RegistryServer] Challenge issued for publicKey: ${publicKey.substring(0,10)}... nonce: ${nonce.substring(0,10)}...`);
            return { nonce };
        } catch (error: any) {
            console.error("[RegistryServer] Error in handleChallenge:", error.message, error.stack);
            return { error: "Failed to issue challenge." };
        }
    }
    
    private async _onVerifyRequest(reqBody: { publicKey: string; challenge: string; proof: string }): Promise<{ token?: string; error?: string; verified?: boolean }> {
        const { publicKey, challenge, proof } = reqBody;
        console.log(`[RegistryServer] Internal verification request for publicKey: ${publicKey.substring(0,10)}...`);

        const activeChallenge = this.activeChallenges.get(publicKey);
        if (!activeChallenge) {
            return { error: "No active challenge found or challenge expired for this publicKey.", verified: false };
        }
        if (activeChallenge.nonce !== challenge) {
            return { error: "Challenge mismatch.", verified: false };
        }
        if (activeChallenge.expiresAt < Date.now()) {
            this.activeChallenges.delete(publicKey);
            return { error: "Challenge expired.", verified: false };
        }

        if (!this.verifySystem) {
            console.warn("[RegistryServer] VerifySystem not available. Skipping actual proof verification. Simulating success.");
            this.activeChallenges.delete(publicKey);
            return { token: `dev-token-${publicKey.slice(0, 12)}-${Date.now()}`, verified: true };
        }

        try {
            const isValid = await this.verifySystem.verifyProof(publicKey, challenge, proof);
            if (isValid) {
                this.activeChallenges.delete(publicKey);
                const token = `zkp-verified-token-${publicKey.slice(0, 10)}...${randomBytes(8).toString("hex")}`;
                return { token, verified: true };
            } else {
                return { error: "Proof verification failed.", verified: false };
            }
        } catch (error: any) {
            console.error("[RegistryServer] Error during proof verification:", error.message, error.stack);
            return { error: "An error occurred during proof verification.", verified: false };
        }
    }

    @HttpRoute("POST", "/auth/verify")
    async handleVerify(req: { body: { publicKey: string; challenge: string; proof: string } }): Promise<{ token?: string; error?: string; verified?: boolean }> {
         try {
            const { publicKey, challenge, proof } = req.body;
            if (!publicKey || !challenge || !proof) {
                return { error: "Missing publicKey, challenge, or proof." };
            }
            return await this._onVerifyRequest({ publicKey, challenge, proof });
        } catch (error: any) {
            console.error("[RegistryServer] Error in handleVerify:", error.message, error.stack);
            return { error: "Failed to verify proof." };
        }
    }

    // Overrides and implements onMessage from MessagingSystem with the correct signature
    protected onMessage(message: Message): void {
        console.log(`[RegistryServer] Message received - Type: ${message.type}, Sender: ${message.senderId || 'N/A'}, Payload:`, message.payload);
        
        switch (message.type) {
            case 'REGISTER_ENTITY_REQUEST':
                if (message.payload && typeof message.payload === 'object') {
                    const result = this.registerHydraEntity(message.payload as HydraEntityManifest);
                    if (message.senderId) {
                        this.send(message.senderId, { type: 'REGISTER_ENTITY_RESPONSE', payload: result });
                    }
                } else {
                     if (message.senderId) {
                        this.send(message.senderId, { type: 'REGISTER_ENTITY_RESPONSE', payload: { success: false, error: "Invalid payload for entity registration." } });
                    }
                }
                break;
            case 'GET_ENTITY_REQUEST':
                if (message.payload && typeof message.payload.id === 'string') {
                    const manifest = this.hydraEntityRegistry.get(message.payload.id);
                    if (message.senderId) {
                        this.send(message.senderId, { type: 'GET_ENTITY_RESPONSE', payload: manifest || { error: 'Entity not found' } });
                    }
                } else {
                    if (message.senderId) {
                        this.send(message.senderId, { type: 'GET_ENTITY_RESPONSE', payload: { error: "Invalid payload for get entity request, 'id' is required." } });
                    }
                }
                break;
            // Add more message handlers as needed
            default:
                console.log(`[RegistryServer] Unhandled message type: ${message.type}`);
        }
    }

    private cleanupExpiredChallenges(): void {
        const now = Date.now();
        let cleanedCount = 0;
        this.activeChallenges.forEach((challenge, key) => {
            if (challenge.expiresAt < now) {
                this.activeChallenges.delete(key);
                cleanedCount++;
            }
        });
        if (cleanedCount > 0) {
            console.log(`[RegistryServer] Cleaned up ${cleanedCount} expired challenges.`);
        }
    }
}
