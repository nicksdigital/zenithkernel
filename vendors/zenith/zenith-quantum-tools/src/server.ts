import express from 'express';
import cors from 'cors';
import { groth16 } from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
// @ts-ignore
import * as c from 'circomlibjs';

import crypto from 'crypto';

const main = async () => {
const eddsa = await c.buildEddsa();
const babyJub = await c.buildBabyjub();

const app = express();
app.use(cors());
app.use(express.json());

function flattenMetadata(meta: any): bigint[] {
  const fields: bigint[] = [];
  fields.push(BigInt(Buffer.from(meta.id).readUIntBE(0, 2)));
  fields.push(BigInt(meta.version.replace(/\./g, '')));
  fields.push(BigInt(Buffer.from(meta.entry).readUIntBE(0, 2)));
  fields.push(BigInt(Buffer.from(meta.context).readUIntBE(0, 2)));
  fields.push(BigInt(meta.permissions.length));
  //@ts-ignore
  fields.push(...meta.permissions.slice(0, 3).map(p => BigInt(Buffer.from(p).readUIntBE(0, 1))));
  while (fields.length < 8) fields.push(BigInt(0));
  return fields;
}

async function generateKeyAndSignature(flattened: bigint[]) {
  const prvKey = crypto.randomBytes(32);
  const pub = eddsa.prv2pub(prvKey);
  const poseidon = await buildPoseidon();
  const poseidonHash = poseidon.F.toObject(poseidon(flattened));

  const signature = eddsa.signPoseidon(prvKey, poseidonHash);
  const poseidonHashBigInt = BigInt(poseidonHash);
  // @ts-ignore
  const R8 = signature.R8.map(babyJub.F.toObject).map(x => x.toString());
  const S = signature.S.toString();

  //@ts-ignore
  const pubKey = pub.map(babyJub.F.toObject).map(x => x.toString());

  return { pubKey, R8, S, poseidonHash };
}

app.post('/proof', async (req, res) => {
  try {
    const meta = req.body;
    const flattened = flattenMetadata(meta);
    const { pubKey, R8, S, poseidonHash } = await generateKeyAndSignature(flattened);

    const input = {
      pubKey,
      metadata: flattened.map(String),
      R8,
      S,
      poseidonHash: poseidonHash.toString()
    };

    const { proof, publicSignals } = await groth16.fullProve(
      input,
      './module_verifier_js/module_verifier.wasm',
      './module_verifier.zkey'
    );

    res.json({ proof, publicSignals, pubKey });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

return app;
}

main().then(app => {
  app.listen(8898, (err:any) => {
    if (err) {
      console.error('Failed to start server:', err);
      return;
    }
    console.log('🚀 ZKP proof server running on http://localhost:8898');
  });
}).catch(console.error);