/**
 * ZenithKernel Hello World App
 * Demonstrates SFC (.sk) components with Tailwind CSS styling
 */

import AppStore from './stores/AppStore.js';
import SFCLoader from './lib/SFCLoader.js';

class ZenithHelloWorldApp {
    constructor() {
        this.store = new AppStore();
        this.sfcLoader = new SFCLoader();
        this.component = null;
        this.isInitialized = false;

        // Bind methods
        this.init = this.init.bind(this);
        this.loadAndRender = this.loadAndRender.bind(this);
        this.setupGlobalFunctions = this.setupGlobalFunctions.bind(this);
        this.setupComponentMethods = this.setupComponentMethods.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing ZenithKernel Hello World App...');

            // First, show a simple test to make sure basic functionality works
            this.showSimpleTest();

            // Setup global functions for template interaction
            this.setupGlobalFunctions();

            // Load and render the SFC component
            await this.loadAndRender();

            // Setup component methods for global access
            this.setupComponentMethods();

            // Subscribe to store changes for reactive updates
            this.store.subscribe(() => {
                this.updateDOM();
            });

            // Hide loading, show content
            this.showContent();

            this.isInitialized = true;
            console.log('✅ ZenithKernel Hello World App initialized successfully!');

        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError(error);
        }
    }

    /**
     * Setup global functions that templates can call
     */
    setupGlobalFunctions() {
        // Make store methods globally available for template interactions
        window.incrementCounter = this.store.incrementCounter;
        window.decrementCounter = this.store.decrementCounter;
        window.updateUserName = this.store.updateUserName;
        
        // Add utility functions
        globalThis.formatDate = (date) => new Date(date).toLocaleDateString();
        globalThis.formatTime = (ms) => `${ms}ms`;
    }

    /**
     * Load SFC component and render with current state
     */
    async loadAndRender() {
        try {
            console.log('📦 Loading ZK component...');

            // Load the ZK component
            const sfc = await this.sfcLoader.loadSFC('./components/HelloWorld.zk');
            console.log('✅ ZK component loaded:', sfc);

            // Store SFC for re-rendering
            this.lastSFC = sfc;

            // Store SFC for re-rendering
            this.lastSFC = sfc;

            // Create component instance with store state as props
            const state = this.store.getState();
            console.log('📊 Store state:', state);

            this.component = this.sfcLoader.createComponent(sfc, state);
            console.log('🧩 Component created:', this.component);

            // Render the template with component data
            const rendered = this.sfcLoader.renderTemplate(sfc.template, this.component);
            console.log('🎨 Template rendered:', rendered.substring(0, 100) + '...');

            // Apply component styles
            this.sfcLoader.applyStyles(sfc.style, this.component.name || 'HelloWorld');

            // Update the DOM
            const contentElement = document.getElementById('content');
            if (contentElement) {
                contentElement.innerHTML = rendered;
                contentElement.setAttribute('data-component', this.component.name || 'HelloWorld');
                console.log('🎯 DOM updated successfully');
            } else {
                console.error('❌ Content element not found');
            }

        } catch (error) {
            console.error('❌ Failed to load and render SFC:', error);
            throw error;
        }
    }

    /**
     * Setup global functions for component method calls
     */
    setupComponentMethods() {
        // Make store methods globally available and connect them to UI updates
        window.incrementCounter = () => {
            this.store.incrementCounter();
            this.updateDOM();
        };

        window.decrementCounter = () => {
            this.store.decrementCounter();
            this.updateDOM();
        };

        window.updateUserName = (name) => {
            this.store.updateUserName(name);
            this.updateDOM();
        };

        // Add signal update helper
        window.updateSignal = (signalName, value) => {
            console.log(`🔄 Updating signal ${signalName} to:`, value);

            // Update the store based on signal name
            if (signalName === 'userName') {
                this.store.updateUserName(value);
            }

            this.updateDOM();
        };
    }

    /**
     * Update DOM with new state (reactive updates)
     */
    updateDOM() {
        if (!this.isInitialized || !this.lastSFC) return;

        console.log('🔄 Updating DOM with new state...');

        // Get current store state
        const state = this.store.getState();
        console.log('📊 Current state:', state);

        // Update component with new state
        if (this.component) {
            this.component.props = { ...this.component.props, ...state };
        } else {
            // Create component if it doesn't exist
            this.component = this.sfcLoader.createComponent(this.lastSFC, state);
        }

        // Re-render the template with updated data
        const contentElement = document.getElementById('content');
        if (contentElement) {
            const rendered = this.sfcLoader.renderTemplate(this.lastSFC.template, this.component);
            contentElement.innerHTML = rendered;
            console.log('✅ DOM updated with new state');
        }
    }

    /**
     * Show a simple test to verify basic functionality
     */
    showSimpleTest() {
        const contentElement = document.getElementById('content');
        if (contentElement) {
            const state = this.store.getState();
            contentElement.innerHTML = `
                <div class="max-w-2xl mx-auto text-center bg-white/80 rounded-lg p-8 shadow-lg">
                    <h1 class="text-4xl font-bold text-gray-800 mb-4">
                        Hello, <span class="text-blue-500">${state.userName || 'World'}</span>! 👋
                    </h1>
                    <p class="text-xl text-gray-600 mb-6">
                        Welcome to ZenithKernel
                    </p>
                    <div class="flex items-center justify-center space-x-4 mb-6">
                        <button onclick="window.testDecrement()" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">-</button>
                        <span class="text-2xl font-bold" id="counter-display">${state.counter}</span>
                        <button onclick="window.testIncrement()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">+</button>
                    </div>
                    <input
                        type="text"
                        placeholder="Enter your name..."
                        onchange="window.testUpdateName(this.value)"
                        class="w-full max-w-xs px-4 py-2 border rounded-lg"
                        value="${state.userName || ''}"
                    />
                    <p class="mt-4 text-sm text-gray-500">Render count: <span id="render-count">${state.renderCount}</span></p>
                </div>
            `;

            // Setup simple test functions
            window.testIncrement = () => {
                this.store.incrementCounter();
                this.updateSimpleDisplay();
            };

            window.testDecrement = () => {
                this.store.decrementCounter();
                this.updateSimpleDisplay();
            };

            window.testUpdateName = (name) => {
                this.store.updateUserName(name);
                this.updateSimpleDisplay();
            };

            console.log('✅ Simple test interface loaded');
        }
    }

    /**
     * Update the simple display with current state
     */
    updateSimpleDisplay() {
        const state = this.store.getState();
        const counterDisplay = document.getElementById('counter-display');
        const renderCount = document.getElementById('render-count');

        if (counterDisplay) counterDisplay.textContent = state.counter;
        if (renderCount) renderCount.textContent = state.renderCount;

        // Update the name in the title
        const titleSpan = document.querySelector('h1 span');
        if (titleSpan) titleSpan.textContent = state.userName || 'World';

        console.log('🔄 Simple display updated:', state);
    }

    /**
     * Show the main content and hide loading
     */
    showContent() {
        const loading = document.getElementById('loading');
        const content = document.getElementById('content');

        if (loading) loading.classList.add('hidden');
        if (content) content.classList.remove('hidden');
    }

    /**
     * Show error message
     */
    showError(error) {
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="max-w-md mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    <h3 class="font-bold">Error Loading App</h3>
                    <p class="text-sm mt-2">${error.message}</p>
                    <button onclick="location.reload()" class="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Fallback template if loading fails
     */
    getFallbackTemplate() {
        return `
            <div class="max-w-2xl mx-auto text-center bg-white/80 rounded-lg p-8 shadow-lg">
                <h1 class="text-4xl font-bold text-gray-800 mb-4">
                    Hello, <span class="text-blue-500">{{ userName || 'World' }}</span>! 👋
                </h1>
                <p class="text-xl text-gray-600 mb-6">
                    Welcome to ZenithKernel
                </p>
                <div class="flex items-center justify-center space-x-4 mb-6">
                    <button onclick="decrementCounter()" class="bg-red-500 text-white px-4 py-2 rounded">-</button>
                    <span class="text-2xl font-bold">{{ counter }}</span>
                    <button onclick="incrementCounter()" class="bg-green-500 text-white px-4 py-2 rounded">+</button>
                </div>
                <input 
                    type="text" 
                    placeholder="Enter your name..." 
                    onchange="updateUserName(this.value)"
                    class="w-full max-w-xs px-4 py-2 border rounded-lg"
                />
            </div>
        `;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ZenithHelloWorldApp();
    app.init();
});

// Export for potential external use
export default ZenithHelloWorldApp;
