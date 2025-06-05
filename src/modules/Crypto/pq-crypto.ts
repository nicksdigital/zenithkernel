/**
 * Post-Quantum Cryptography Module
 * 
 * Implements multiple post-quantum cryptographic algorithms:
 * - Kyber: For key encapsulation
 * - Dilithium: For digital signatures
 * - Falcon: For lightweight signatures
 */

import { Buffer } from 'buffer';
import * as crypto from 'crypto';

// Types for the PQ algorithms
export enum PQAlgorithm {
    // Key Encapsulation Mechanisms (KEM)
    KYBER512 = 'kyber512',
    KYBER768 = 'kyber768',
    KYBER1024 = 'kyber1024',
    
    // Digital Signatures
    DILITHIUM2 = 'dilithium2',
    DILITHIUM3 = 'dilithium3',
    DILITHIUM5 = 'dilithium5',
    
    // Lightweight Signatures
    FALCON512 = 'falcon512',
    FALCON1024 = 'falcon1024'
}

export interface PQKeyPair {
    publicKey: Buffer;
    privateKey: Buffer;
}

export interface EncapsulationResult {
    ciphertext: Buffer;
    sharedSecret: Buffer;
}

/**
 * Kyber Key Encapsulation Implementation
 */
export class KyberKEM {
    static async generateKeyPair(algorithm: PQAlgorithm = PQAlgorithm.KYBER768): Promise<PQKeyPair> {
        // Implementation uses the existing kyber module
        const { kyberKeyPair } = await import('../../core/crypto/kyber');
        const keyPair = await kyberKeyPair();
        
        return {
            publicKey: Buffer.from(keyPair.publicKey),
            privateKey: Buffer.from(keyPair.privateKey)
        };
    }

    static async encapsulate(publicKey: Buffer, algorithm: PQAlgorithm = PQAlgorithm.KYBER768): Promise<EncapsulationResult> {
        const { kyberEncrypt } = await import('../../core/crypto/kyber');
        const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
        const [ciphertext] = await kyberEncrypt(new Uint8Array(publicKey), sharedSecret);
        
        return {
            ciphertext: Buffer.from(ciphertext),
            sharedSecret: Buffer.from(sharedSecret)
        };
    }

    static async decapsulate(privateKey: Buffer, ciphertext: Buffer, algorithm: PQAlgorithm = PQAlgorithm.KYBER768): Promise<Buffer> {
        const { kyberDecrypt } = await import('../../core/crypto/kyber');
        const sharedSecret = await kyberDecrypt(new Uint8Array(privateKey), new Uint8Array(ciphertext));
        return Buffer.from(sharedSecret);
    }
}

/**
 * Dilithium Digital Signature Implementation
 */
export class DilithiumSign {
    static async generateKeyPair(algorithm: PQAlgorithm = PQAlgorithm.DILITHIUM3): Promise<PQKeyPair> {
        const { dilithiumKeyPair } = await import('@zenith/quantum-safe-signatures');
        const keyPair = await dilithiumKeyPair(algorithm);
        
        return {
            publicKey: Buffer.from(keyPair.publicKey),
            privateKey: Buffer.from(keyPair.privateKey)
        };
    }

    static async sign(message: Buffer, privateKey: Buffer, algorithm: PQAlgorithm = PQAlgorithm.DILITHIUM3): Promise<Buffer> {
        const { dilithiumSign } = await import('@zenith/quantum-safe-signatures');
        const signature = await dilithiumSign(message, privateKey, algorithm);
        return Buffer.from(signature);
    }

    static async verify(message: Buffer, signature: Buffer, publicKey: Buffer, algorithm: PQAlgorithm = PQAlgorithm.DILITHIUM3): Promise<boolean> {
        const { dilithiumVerify } = await import('@zenith/quantum-safe-signatures');
        return dilithiumVerify(message, signature, publicKey, algorithm);
    }
}

/**
 * Falcon Lightweight Signature Implementation
 */
export class FalconSign {
    static async generateKeyPair(algorithm: PQAlgorithm = PQAlgorithm.FALCON512): Promise<PQKeyPair> {
        const { falconKeyPair } = await import('@zenith/quantum-safe-signatures');
        const keyPair = await falconKeyPair(algorithm);
        
        return {
            publicKey: Buffer.from(keyPair.publicKey),
            privateKey: Buffer.from(keyPair.privateKey)
        };
    }

    static async sign(message: Buffer, privateKey: Buffer, algorithm: PQAlgorithm = PQAlgorithm.FALCON512): Promise<Buffer> {
        const { falconSign } = await import('@zenith/quantum-safe-signatures');
        const signature = await falconSign(message, privateKey, algorithm);
        return Buffer.from(signature);
    }

    static async verify(message: Buffer, signature: Buffer, publicKey: Buffer, algorithm: PQAlgorithm = PQAlgorithm.FALCON512): Promise<boolean> {
        const { falconVerify } = await import('@zenith/quantum-safe-signatures');
        return falconVerify(message, signature, publicKey, algorithm);
    }
}

/**
 * Utility functions for PQ cryptography
 */
export class PQCryptoUtils {
    static async hybridEncrypt(
        message: Buffer,
        recipientKyberPublicKey: Buffer,
        senderDilithiumPrivateKey: Buffer
    ): Promise<{ ciphertext: Buffer; signature: Buffer }> {
        // Generate a one-time symmetric key using Kyber
        const { ciphertext, sharedSecret } = await KyberKEM.encapsulate(recipientKyberPublicKey);
        
        // Encrypt the message using the shared secret
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const cipher = crypto.createCipheriv('aes-256-gcm', sharedSecret, iv);
        const encryptedMessage = Buffer.concat([
            cipher.update(message),
            cipher.final(),
            cipher.getAuthTag()
        ]);

        // Sign the ciphertext using Dilithium
        const signature = await DilithiumSign.sign(
            Buffer.concat([ciphertext, encryptedMessage]),
            senderDilithiumPrivateKey
        );

        return {
            ciphertext: Buffer.concat([iv, ciphertext, encryptedMessage]),
            signature
        };
    }

    static async hybridDecrypt(
        ciphertext: Buffer,
        signature: Buffer,
        recipientKyberPrivateKey: Buffer,
        senderDilithiumPublicKey: Buffer
    ): Promise<Buffer> {
        // Extract components
        const iv = ciphertext.slice(0, 12);
        const kyberCiphertext = ciphertext.slice(12, 1036); // Kyber-768 ciphertext size
        const encryptedMessage = ciphertext.slice(1036);

        // Verify the signature
        const isValid = await DilithiumSign.verify(
            Buffer.concat([kyberCiphertext, encryptedMessage]),
            signature,
            senderDilithiumPublicKey
        );

        if (!isValid) {
            throw new Error('Invalid signature');
        }

        // Decrypt the shared secret using Kyber
        const sharedSecret = await KyberKEM.decapsulate(recipientKyberPrivateKey, kyberCiphertext);

        // Decrypt the message using the shared secret
        const decipher = crypto.createDecipheriv('aes-256-gcm', sharedSecret, iv);
        decipher.setAuthTag(encryptedMessage.slice(-16));
        
        return Buffer.concat([
            decipher.update(encryptedMessage.slice(0, -16)),
            decipher.final()
        ]);
    }
}