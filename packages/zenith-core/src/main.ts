import { bootstrapKernel } from "@bootstrap/bootstrapKernel";
import { launchLoop } from "@bootstrap/launchLoop";
import { initIslandSystem } from "@modules/Rendering/island-loader";

// Enhanced bootstrap with islands support
async function initializeZenithKernel() {
    try {
        console.log('🌊 Initializing ZenithKernel...');
        
        // Bootstrap the core kernel
        const kernel = await bootstrapKernel({ http: true });
        
        // Initialize the island system if we're in a browser environment
        if (typeof window !== 'undefined') {
            console.log('🏝️ Initializing Islands system...');
            const cleanupIslands = initIslandSystem();
            
            // Make cleanup available globally for hot reload
            (window as any).__zenithCleanup = cleanupIslands;
            
            // Auto-discover and hydrate islands
            const { scanAndHydrateIslands } = await import('@modules/Rendering/island-loader');
            await scanAndHydrateIslands();
        }
        
        // Launch the main execution loop
        launchLoop(kernel);
        
        // Make kernel globally available for debugging and island access
        if (typeof window !== 'undefined') {
            (window as any).ZenithKernel = kernel;
        }
        
        console.log('✅ ZenithKernel initialized successfully!');
        return kernel;
        
    } catch (error) {
        console.error('❌ Failed to initialize ZenithKernel:', error);
        throw error;
    }
}

// Auto-initialize when loaded
initializeZenithKernel().catch(console.error);
