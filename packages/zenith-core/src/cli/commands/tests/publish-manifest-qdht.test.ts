import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { publishManifestToQDHT } from '../publish-manifest-qdht';
import { existsSync, readFileSync } from 'fs';

// Mock fs module to control file existence and content for tests
vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
    };
});

// Mock process.exit to prevent tests from terminating and to allow assertion
const mockExit = vi.spyOn(process, 'exit').mockImplementation((number) => { 
    throw new Error('process.exit: ' + number); 
});

describe('publishManifestToQDHT', () => {
    beforeEach(() => {
        // Clear mock calls and implementations before each test
        vi.mocked(existsSync).mockReset();
        vi.mocked(readFileSync).mockReset();
        mockExit.mockClear();
        vi.spyOn(console, 'log').mockImplementation(() => {}); // Suppress console.log
        vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
    });

    afterAll(() => {
        // Restore original implementations
        mockExit.mockRestore();
        vi.restoreAllMocks();
    });

    it('should throw an error if the manifest file does not exist', async () => {
        const nonExistentPath = '/path/to/non/existent/manifest.json';
        vi.mocked(existsSync).mockReturnValue(false);

        // We expect process.exit to be called, which we've mocked to throw an error
        await expect(publishManifestToQDHT(nonExistentPath))
            .rejects.toThrow('process.exit: 1');
        
        expect(existsSync).toHaveBeenCalledWith(nonExistentPath);
        // Verify console.error was called with the specific message (optional, but good for completeness)
        expect(console.error).toHaveBeenCalledWith(`❌ Error: Manifest file not found at ${nonExistentPath}`);
    });

    // More tests will go here
});
