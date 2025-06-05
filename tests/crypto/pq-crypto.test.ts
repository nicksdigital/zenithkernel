import { describe, it, expect } from 'vitest';
import { 
    KyberKEM,
    DilithiumSign,
    FalconSign,
    PQCryptoUtils,
    PQAlgorithm
} from '../../src/modules/Crypto/pq-crypto';

describe('Post-Quantum Cryptography Module', () => {
    describe('Kyber Key Encapsulation', () => {
        it('should generate key pairs', async () => {
            const keyPair = await KyberKEM.generateKeyPair();
            expect(keyPair.publicKey).toBeDefined();
            expect(keyPair.privateKey).toBeDefined();
        });

        it('should successfully encapsulate and decapsulate', async () => {
            const keyPair = await KyberKEM.generateKeyPair();
            const { ciphertext, sharedSecret } = await KyberKEM.encapsulate(keyPair.publicKey);
            const decapsulated = await KyberKEM.decapsulate(keyPair.privateKey, ciphertext);
            
            expect(Buffer.compare(sharedSecret, decapsulated)).toBe(0);
        });
    });

    describe('Dilithium Digital Signatures', () => {
        it('should generate key pairs', async () => {
            const keyPair = await DilithiumSign.generateKeyPair();
            expect(keyPair.publicKey).toBeDefined();
            expect(keyPair.privateKey).toBeDefined();
        });

        it('should sign and verify messages', async () => {
            const keyPair = await DilithiumSign.generateKeyPair();
            const message = Buffer.from('test message');
            const signature = await DilithiumSign.sign(message, keyPair.privateKey);
            const isValid = await DilithiumSign.verify(message, signature, keyPair.publicKey);
            
            expect(isValid).toBe(true);
        });

        it('should reject invalid signatures', async () => {
            const keyPair = await DilithiumSign.generateKeyPair();
            const message = Buffer.from('test message');
            const wrongMessage = Buffer.from('wrong message');
            const signature = await DilithiumSign.sign(message, keyPair.privateKey);
            const isValid = await DilithiumSign.verify(wrongMessage, signature, keyPair.publicKey);
            
            expect(isValid).toBe(false);
        });
    });

    describe('Falcon Lightweight Signatures', () => {
        it('should generate key pairs', async () => {
            const keyPair = await FalconSign.generateKeyPair();
            expect(keyPair.publicKey).toBeDefined();
            expect(keyPair.privateKey).toBeDefined();
        });

        it('should sign and verify messages', async () => {
            const keyPair = await FalconSign.generateKeyPair();
            const message = Buffer.from('test message');
            const signature = await FalconSign.sign(message, keyPair.privateKey);
            const isValid = await FalconSign.verify(message, signature, keyPair.publicKey);
            
            expect(isValid).toBe(true);
        });
    });

    describe('Hybrid Encryption', () => {
        it('should encrypt and decrypt messages using hybrid scheme', async () => {
            const message = Buffer.from('secret message');
            
            // Generate keys for both parties
            const recipientKyber = await KyberKEM.generateKeyPair();
            const senderDilithium = await DilithiumSign.generateKeyPair();
            
            // Encrypt
            const { ciphertext, signature } = await PQCryptoUtils.hybridEncrypt(
                message,
                recipientKyber.publicKey,
                senderDilithium.privateKey
            );
            
            // Decrypt
            const decrypted = await PQCryptoUtils.hybridDecrypt(
                ciphertext,
                signature,
                recipientKyber.privateKey,
                senderDilithium.publicKey
            );
            
            expect(Buffer.compare(message, decrypted)).toBe(0);
        });

        it('should reject messages with invalid signatures', async () => {
            const message = Buffer.from('secret message');
            
            // Generate keys
            const recipientKyber = await KyberKEM.generateKeyPair();
            const senderDilithium = await DilithiumSign.generateKeyPair();
            const attackerDilithium = await DilithiumSign.generateKeyPair();
            
            // Encrypt with sender's key
            const { ciphertext, signature } = await PQCryptoUtils.hybridEncrypt(
                message,
                recipientKyber.publicKey,
                senderDilithium.privateKey
            );
            
            // Try to decrypt with attacker's public key
            await expect(
                PQCryptoUtils.hybridDecrypt(
                    ciphertext,
                    signature,
                    recipientKyber.privateKey,
                    attackerDilithium.publicKey
                )
            ).rejects.toThrow('Invalid signature');
        });
    });
});