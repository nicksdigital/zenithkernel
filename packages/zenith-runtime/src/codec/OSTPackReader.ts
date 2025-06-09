import { OSTCompression } from './OSTCompression';
import { CompressedData, OSTConfig } from './OSTCompression';

/**
 * Reader for OST pack files
 * 
 * OST pack format:
 * - 4 bytes: Magic number "OST1"
 * - 4 bytes: Header length (big-endian)
 * - N bytes: Header (JSON)
 * - For each bin:
 *   - 2 bytes: Label length (big-endian)
 *   - M bytes: Label
 *   - 4 bytes: Data length (big-endian)
 *   - K bytes: Compressed data
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
        const { config, binSequence } = header;
        
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
                config: config as OSTConfig,
                windows: [] // Windows will be reconstructed during decompression
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
        
        // Create a compressor with the same config
        const compressor = new OSTCompression(compressedData.metadata.config);
        
        // Decompress the data
        return compressor.decode(compressedData);
    }
}
