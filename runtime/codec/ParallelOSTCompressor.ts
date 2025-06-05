import { Worker } from 'worker_threads';
import { cpus } from 'os';
import path from 'path';

interface BundleInput {
    id: string;
    data: Buffer;
    dependencies?: string[];
}

interface CompressedBundle {
    id: string;
    compressedData: Buffer;
    manifest: {
        hash: string;
        size: number;
        chunkOffsets: number[];
        dependencies: string[];
    };
}

export class ParallelOSTCompressor {
    private workerPath = path.resolve(__dirname, './workers/compressWorker.js');
    private maxWorkers = Math.max(2, cpus().length - 1);

    async compressBundles(bundles: BundleInput[]): Promise<CompressedBundle[]> {
        const results: CompressedBundle[] = [];
        const queue = [...bundles];
        const active: Promise<void>[] = [];

        while (queue.length || active.length) {
            while (active.length < this.maxWorkers && queue.length) {
                const bundle = queue.shift();
                if (!bundle) continue;
                const p = this.runCompression(bundle).then(res => results.push(res));
                // @ts-ignore
                active.push(p);
                p.finally(() => {
                    // @ts-ignore
                    const idx = active.indexOf(p);
                    if (idx !== -1) active.splice(idx, 1);
                });
            }
            await Promise.race(active);
        }

        return results;
    }

    private runCompression(bundle: BundleInput): Promise<CompressedBundle> {
        return new Promise((resolve, reject) => {
            const worker = new Worker(this.workerPath, {
                workerData: bundle
            });
            worker.once('message', resolve);
            worker.once('error', reject);
            worker.once('exit', (code:any) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    }
}
