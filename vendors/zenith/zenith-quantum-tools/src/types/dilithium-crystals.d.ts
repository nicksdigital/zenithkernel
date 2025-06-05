declare module 'dilithium-crystals' {
  export function keyPair(): Promise<{
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  }>;
  
  export function sign(message: Uint8Array, privateKey: Uint8Array): Promise<Uint8Array>;
  export function verifyDetached(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): Promise<boolean>;
  
  // Add other methods as needed based on the actual package API
  // These are common methods for post-quantum signature schemes
}
