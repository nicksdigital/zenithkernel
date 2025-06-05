import fs from 'fs/promises';
import { Poseidon, buildPoseidon } from 'circomlibjs';
import { groth16 } from 'snarkjs';
import { program } from 'commander';

function flattenMetadata(meta: any): bigint[] {
  const fields: bigint[] = [];
  fields.push(BigInt(Buffer.from(meta.id).readUIntBE(0, 2)));
  fields.push(BigInt(meta.version.split('.').join('')));
  fields.push(BigInt(Buffer.from(meta.entry).readUIntBE(0, 2)));
  fields.push(BigInt(Buffer.from(meta.context).readUIntBE(0, 2)));
  fields.push(BigInt(meta.permissions.length));
  //@ts-ignore
  fields.push(...meta.permissions.slice(0, 3).map(p => BigInt(Buffer.from(p).readUIntBE(0, 1))));
  while (fields.length < 8) fields.push(BigInt(0));
  return fields;
}

export async function generateModuleProof(metadataPath: string, pubKey: [string, string], R8: [string, string], S: string) {
  const meta = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
  const flattened = flattenMetadata(meta);
  const poseidon = await buildPoseidon();
  const hash = poseidon.F.toObject(poseidon(flattened));

  const input = {
    pubKey: pubKey.map(BigInt).map(String),
    metadata: flattened.map(String),    
    R8: R8.map(BigInt).map(String),
    S: S.toString(),
    poseidonHash: hash.toString()
  };

  await fs.writeFile('module_input.json', JSON.stringify(input, null, 2));

  const { proof, publicSignals } = await groth16.fullProve(
    input,
    './module_verifier_js/module_verifier.wasm',
    './module_verifier.zkey'
  );

  await fs.writeFile('module_proof.json', JSON.stringify(proof, null, 2));
  await fs.writeFile('module_public.json', JSON.stringify(publicSignals, null, 2));

  console.log('✅ Module proof generated and saved to module_proof.json / module_public.json');
}

program
  .command('module-proof')
  .requiredOption('-m, --metadata <path>', 'Path to module metadata JSON')
  .requiredOption('--pk <x,y>', 'Public key as comma-separated x,y')
  .requiredOption('--r8 <x,y>', 'Signature R8 point as comma-separated x,y')
  .requiredOption('--s <s>', 'Signature S scalar')
  .action(async (opts) => {
    const pubKey = opts.pk.split(',');
    const R8 = opts.r8.split(',');
    await generateModuleProof(opts.metadata, pubKey as [string, string], R8 as [string, string], opts.s);
  });

program.parse();
