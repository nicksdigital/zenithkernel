import { describe, it, expect } from 'vitest';
import { ComponentVerifier, ComponentMetrics, ComponentIdentity } from '../../src/modules/Auth/component-verifier';
import { DilithiumSign } from '../../src/modules/Crypto/pq-crypto';

describe('Component Authentication and Trust System', () => {
    describe('Component Authentication', () => {
        it('should generate and verify component authenticity proofs', async () => {
            // Generate component identity
            const keyPair = await DilithiumSign.generateKeyPair();
            const identity: ComponentIdentity = {
                id: 'test-component-1',
                version: '1.0.0',
                hash: 'sha256-hash',
                signature: keyPair.privateKey,
                publicKey: keyPair.publicKey
            };

            // Create test component
            const component = Buffer.from('test component data');

            // Generate proof
            const proof = await ComponentVerifier.proveComponentAuthenticity(
                component,
                identity
            );

            // Verify proof
            const isValid = await ComponentVerifier.verifyComponentAuthenticity(
                component,
                proof,
                identity
            );

            expect(isValid).toBe(true);
        });

        it('should reject proofs for modified components', async () => {
            const keyPair = await DilithiumSign.generateKeyPair();
            const identity: ComponentIdentity = {
                id: 'test-component-2',
                version: '1.0.0',
                hash: 'sha256-hash',
                signature: keyPair.privateKey,
                publicKey: keyPair.publicKey
            };

            const component = Buffer.from('original component data');
            const modifiedComponent = Buffer.from('modified component data');

            const proof = await ComponentVerifier.proveComponentAuthenticity(
                component,
                identity
            );

            const isValid = await ComponentVerifier.verifyComponentAuthenticity(
                modifiedComponent,
                proof,
                identity
            );

            expect(isValid).toBe(false);
        });
    });

    describe('Authorization Proofs', () => {
        it('should generate and verify authorization proofs', async () => {
            const credentials = Buffer.from('admin:password123');
            const requiredPermissions = ['read', 'write'];

            const proof = await ComponentVerifier.proveAuthorization(
                credentials,
                requiredPermissions
            );

            expect(proof.publicSignals.permissions).toEqual(requiredPermissions);
            expect(proof.publicSignals.timestamp).toBeDefined();
        });
    });

    describe('Trust Scoring', () => {
        it('should calculate trust scores without exposing metrics', async () => {
            const metrics: ComponentMetrics = {
                performanceScore: 0.85,
                securityScore: 0.95,
                reliabilityScore: 0.90,
                lastVerified: Date.now()
            };

            const { score, proof } = await ComponentVerifier.calculateTrustScore(metrics);

            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(1);
            expect(proof.publicSignals.scoreRange).toBe('trusted');
        });

        it('should mark components with low scores as untrusted', async () => {
            const metrics: ComponentMetrics = {
                performanceScore: 0.45,
                securityScore: 0.55,
                reliabilityScore: 0.50,
                lastVerified: Date.now()
            };

            const { score, proof } = await ComponentVerifier.calculateTrustScore(metrics);

            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(1);
            expect(proof.publicSignals.scoreRange).toBe('untrusted');
        });

        it('should verify security requirements', async () => {
            const metrics: ComponentMetrics = {
                performanceScore: 0.85,
                securityScore: 0.95,
                reliabilityScore: 0.90,
                lastVerified: Date.now()
            };

            const { proof } = await ComponentVerifier.calculateTrustScore(metrics);
            const meetsRequirements = await ComponentVerifier.verifySecurityRequirements(
                metrics,
                proof
            );

            expect(meetsRequirements).toBe(true);
        });

        it('should reject components that do not meet security requirements', async () => {
            const metrics: ComponentMetrics = {
                performanceScore: 0.45,
                securityScore: 0.55,
                reliabilityScore: 0.50,
                lastVerified: Date.now()
            };

            const { proof } = await ComponentVerifier.calculateTrustScore(metrics);
            const meetsRequirements = await ComponentVerifier.verifySecurityRequirements(
                metrics,
                proof
            );

            expect(meetsRequirements).toBe(false);
        });
    });
});