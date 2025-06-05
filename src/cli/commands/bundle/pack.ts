import { OSTCompression } from "../../../runtime/codec/OSTCompression";
import { writeFileSync, readFileSync } from "fs";
import { basename, resolve } from "path";
import * as p from "@clack/prompts";
import color from "picocolors";

export async function bundlePack(srcPath?: string, outputPath?: string) {
    p.intro(color.bgCyan(color.black(" bundle pack ")));

    const src =
        srcPath ||
        (await p.text({
            message: "Enter path to Hydra source file",
            placeholder: "src/hydras/AdminUI.tsx",
            validate: (v) => (!v.endsWith(".tsx") ? "Must be a .tsx file" : undefined),
        }));

    if (p.isCancel(src)) return p.cancel("Aborted");

    const method = await p.select<"huffman" | "zstd" | "raw">({
        message: "Choose compression method",
        options: [
            { value: "huffman", label: "Huffman (compact, fast)" },
            { value: "zstd", label: "Zstd (modern, high ratio)" },
            { value: "raw", label: "No compression (debug only)" },
        ],
    });

    const labelLength = await p.text({
        message: "Label length (e.g., 3)",
        placeholder: "3",
        validate: (v) => (isNaN(Number(v)) ? "Must be a number" : undefined),
    });

    const windowLength = await p.text({
        message: "Window size for OST (e.g., 512)",
        placeholder: "512",
        validate: (v) => (isNaN(Number(v)) ? "Must be a number" : undefined),
    });

    const validMethod = typeof method === 'string' ? method : 'huffman';
    const compressor = new OSTCompression({
        labelLength: Number(labelLength),
        windowLength: Number(windowLength),
        compressionMethod: validMethod as 'huffman' | 'zstd' | 'raw',
    });

    const source = readFileSync(src, "utf-8");
    const result = await compressor.encode(source);

    const bundle = {
        version: "1.0.0",
        manifest: {
            id: basename(src).replace(/\.tsx$/, ""),
            createdAt: new Date().toISOString(),
        },
        codec: "ost",
        config: result.metadata.config,
        compressedBins: Object.fromEntries(
            (Array.from(result.compressedBins.entries()) as [string, Uint8Array][]).map(([k, v]) => [k, Buffer.from(v).toString("base64")])
        ),
    };

    const finalOut = outputPath || resolve("dist", `${bundle.manifest.id}.hydra.ostpack`);
    writeFileSync(finalOut, JSON.stringify(bundle, null, 2));

    p.outro(`✅ Bundle written to ${color.green(finalOut)}`);
}
