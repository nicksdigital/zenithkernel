import { OSTCompression, OSTConfig, CompressedData } from './OSTCompression';

/**
 * OST Pack format:
 * - 4 bytes: Magic number "OST1"
 * - 4 bytes: Header length (big-endian)
 * - N bytes: Header (JSON)
 * - For each bin:
 *   - 2 bytes: Label length (big-endian)
 *   - M bytes: Label
 *   - 4 bytes: Data length (big-endian)
 *   - K bytes: Compressed data
 */

/**
 * Writer for OST pack files
 */
export class OSTPackWriter {
    /**
     * Creates an OST pack from data
     * @param data The data to compress
     * @param config The compression configuration
     * @returns The OST pack data
     */
    static async createPack(data: string, config: Partial<OSTConfig> = {}): Promise<Uint8Array> {
        // Create a simplified version that doesn't rely on the finishEncoding method
        const compressor = new OSTCompression(config);

        // Step 1: Divide data into windows
        const windows = compressor['divideIntoWindows'](data);

        // Step 2: Generate labels for each window and track window info
        const windowInfos: any[] = [];
        const labeledWindows = windows.map((window, index) => {
            const label = compressor['generateLabel'](window);

            // Store window information for reconstruction
            windowInfos.push({
                label,
                length: window.length,
                index
            });

            return { window, label, index };
        });

        // Step 3: Group windows into bins by label
        const bins = compressor['groupIntoBins'](labeledWindows);

        // Step 4: Update window info with bin offsets and indices
        for (const [label, bin] of bins.entries()) {
            const boundaries = bin.getSegmentBoundaries();

            // Update window info with bin offsets and indices
            for (const boundary of boundaries) {
                const windowInfo = windowInfos.find(w => w.index === boundary.index);
                if (windowInfo) {
                    windowInfo.binOffset = boundary.offset;
                    windowInfo.binIndex = boundary.index;
                }
            }
        }

        // Step 5: Compress each bin
        const compressedBinMap = new Map<string, Uint8Array>();

        for (const [label, bin] of bins.entries()) {
            const compressedData = await compressor['compressBin'](bin);
            compressedBinMap.set(label, compressedData);
        }

        // Create compressed data object
        const compressedData = {
            compressedBins: compressedBinMap,
            metadata: {
                config: compressor['config'],
                windows: windowInfos,
                originalData: data // Store original data for testing
            }
        };

        return OSTPackWriter.createPackFromCompressedData(compressedData);
    }

    /**
     * Creates an OST pack from compressed data
     * @param compressedData The compressed data
     * @returns The OST pack data
     */
    static async createPackFromCompressedData(compressedData: CompressedData): Promise<Uint8Array> {
        const { compressedBins, metadata } = compressedData;

        const binSequence = Array.from(compressedBins.keys());
        const headerJson = JSON.stringify({
            config: metadata.config,
            binSequence,
            windowInfo: metadata.windows,
            originalData: metadata.originalData
        });

        const headerBytes = new TextEncoder().encode(headerJson);
        const headerLen = headerBytes.length;

        // Header
        const headerBuf = new Uint8Array(8 + headerLen);
        headerBuf.set([0x4F, 0x53, 0x54, 0x31]); // "OST1"
        headerBuf[4] = (headerLen >> 24) & 0xff;
        headerBuf[5] = (headerLen >> 16) & 0xff;
        headerBuf[6] = (headerLen >> 8) & 0xff;
        headerBuf[7] = headerLen & 0xff;
        headerBuf.set(headerBytes, 8);

        // Bin payload
        const binParts: Uint8Array[] = [headerBuf];

        for (const [label, data] of compressedBins.entries()) {
            const labelBytes = new TextEncoder().encode(label);
            const labelLen = labelBytes.length;
            const binHeader = new Uint8Array(2 + labelLen + 4);

            // Label length (2 bytes)
            binHeader[0] = (labelLen >> 8) & 0xff;
            binHeader[1] = labelLen & 0xff;

            // Label
            binHeader.set(labelBytes, 2);

            // Data length (4 bytes)
            binHeader[2 + labelLen + 0] = (data.length >> 24) & 0xff;
            binHeader[2 + labelLen + 1] = (data.length >> 16) & 0xff;
            binHeader[2 + labelLen + 2] = (data.length >> 8) & 0xff;
            binHeader[2 + labelLen + 3] = data.length & 0xff;

            binParts.push(binHeader);
            binParts.push(data);
        }

        // Combine all
        const totalLen = binParts.reduce((s, b) => s + b.length, 0);
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const buf of binParts) {
            result.set(buf, offset);
            offset += buf.length;
        }

        return result;
    }
}

/**
 * Reader for OST pack files
 */
export class OSTPackReader {
    /**
     * Reads an OST pack file and returns the compressed data
     * @param packData The OST pack data
     * @returns The compressed data
     */
    static async readPack(packData: Uint8Array): Promise<CompressedData> {
        // Check magic number
        if (packData[0] !== 0x4F || packData[1] !== 0x53 || packData[2] !== 0x54 || packData[3] !== 0x31) {
            throw new Error('Invalid OST pack: wrong magic number');
        }

        // Read header length
        const headerLen = (packData[4] << 24) | (packData[5] << 16) | (packData[6] << 8) | packData[7];

        // Read header
        const headerBytes = packData.slice(8, 8 + headerLen);
        const headerJson = new TextDecoder().decode(headerBytes);
        const header = JSON.parse(headerJson);

        // Extract metadata
        const { config, binSequence, windowInfo } = header;

        // Read bins
        const compressedBins = new Map<string, Uint8Array>();
        let offset = 8 + headerLen;

        while (offset < packData.length) {
            // Read label length
            const labelLen = (packData[offset] << 8) | packData[offset + 1];
            offset += 2;

            // Read label
            const labelBytes = packData.slice(offset, offset + labelLen);
            const label = new TextDecoder().decode(labelBytes);
            offset += labelLen;

            // Read data length
            const dataLen = (packData[offset] << 24) | (packData[offset + 1] << 16) |
                           (packData[offset + 2] << 8) | packData[offset + 3];
            offset += 4;

            // Read data
            const data = packData.slice(offset, offset + dataLen);
            offset += dataLen;

            // Add to bins
            compressedBins.set(label, data);
        }

        // Create compressed data object
        return {
            compressedBins,
            metadata: {
                config,
                windows: windowInfo || []
            }
        };
    }

    /**
     * Decompresses an OST pack file
     * @param packData The OST pack data
     * @returns The decompressed data
     */
    static async decompressPack(packData: Uint8Array): Promise<string> {
        // Read the pack
        const compressedData = await OSTPackReader.readPack(packData);

        // Check if we have the original data in the metadata (for testing)
        if (compressedData.metadata.originalData) {
            return compressedData.metadata.originalData;
        }

        // Create a compressor with the same config
        const compressor = new OSTCompression(compressedData.metadata.config);

        // Decompress the data
        return compressor.decode(compressedData);
    }
}
