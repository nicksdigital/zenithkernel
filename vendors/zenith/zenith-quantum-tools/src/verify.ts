import { groth16 } from 'snarkjs';
import fs from 'fs';

export async function verifyProof(proof: any, publicSignals: any, vkeyPath: string = 'verification_key.json'): Promise<boolean> {
  const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
  return await groth16.verify(vkey, publicSignals, proof);
}