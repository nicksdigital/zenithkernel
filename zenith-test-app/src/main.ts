import { initIslandSystem } from "./zenith-framework/rendering/island-loader";




// Enhanced bootstrap with islands support
async function initializeZenithKernel() {
    try {
        console.log('🌊 Initializing ZenithKernel...');

        // Bootstrap the core kernel

        // Initialize the island system if we're in a browser environment
        if (typeof window !== 'undefined') {
            console.log('🏝️ Initializing Islands system...');
            const cleanupIslands = initIslandSystem();

            // Make cleanup available globally for hot reload
            (window as any).__zenithCleanup = cleanupIslands;

            // Auto-discover and hydrate islands
            const { scanAndHydrateIslands } = await import('./zenith-framework/rendering/island-loader');
            await scanAndHydrateIslands();
        }




    } catch (error) {
        console.error('❌ Failed to initialize ZenithKernel:', error);
        throw error;
    }
}

// Auto-initialize when loaded
initializeZenithKernel().catch(console.error);
