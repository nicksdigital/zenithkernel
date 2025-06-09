declare module 'simple-zstd' {
    import { Transform } from 'stream';

    export function ZSTDCompress(compressionLevel?: number, streamOptions?: any): Transform;
    export function ZSTDDecompress(streamOptions?: any): Transform;
    export function ZSTDDecompressMaybe(spawnOptions?: any, streamOptions?: any, zstdOptions?: any): Transform;
    // Add other exports if you use them, e.g., specific error classes or constants
}
