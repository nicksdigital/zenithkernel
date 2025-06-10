#!/usr/bin/env node

/**
 * Quick test to verify ZenithKernel scaffolding and Single File Component syntax
 */

import { signManifest, verifySignature } from '../src/utils/ManifestAuth.js';
import { jsx } from '../src/modules/Rendering/jsx-runtime.js';

async function testBasicFunctionality() {
    console.log('🧪 Testing ZenithKernel Basic Functionality...\n');
    
    // Test 1: ManifestAuth
    console.log('1. Testing ManifestAuth...');
    try {
        const manifest = {
            id: 'test-component',
            version: '1.0.0',
            entry: 'TestComponent.tsx',
            execType: 'local'
        };
        
        const signed = await signManifest(manifest);
        const isValid = await verifySignature(signed);
        
        console.log(`   ✅ Manifest signing: ${signed.signature ? 'OK' : 'FAIL'}`);
        console.log(`   ✅ Manifest verification: ${isValid ? 'OK' : 'FAIL'}`);
    } catch (error) {
        console.log(`   ❌ ManifestAuth test failed: ${error.message}`);
    }
    
    // Test 2: JSX Runtime with Single File Component syntax
    console.log('\n2. Testing JSX Runtime...');
    try {
        // Test basic element
        const div = jsx('div', { className: 'test' }, 'Hello World');
        console.log(`   ✅ Basic JSX element: ${div.tagName === 'DIV' ? 'OK' : 'FAIL'}`);
        
        // Test Hydra component
        const hydra = jsx('Hydra', {
            type: 'island',
            id: 'test-island',
            entry: 'TestIsland.tsx',
            execType: 'local'
        });
        console.log(`   ✅ Hydra component: ${hydra.getAttribute('data-hydra-id') === 'test-island' ? 'OK' : 'FAIL'}`);
        
        // Test meta component
        const meta = jsx('meta', {
            title: 'Test Page',
            description: 'Test description'
        });
        console.log(`   ✅ Meta component: ${meta instanceof DocumentFragment ? 'OK' : 'FAIL'}`);
        
    } catch (error) {
        console.log(`   ❌ JSX Runtime test failed: ${error.message}`);
    }
    
    console.log('\n🎉 Basic functionality test complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testBasicFunctionality().catch(console.error);
}

export { testBasicFunctionality };
