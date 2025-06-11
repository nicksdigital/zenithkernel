/**
 * Single File Component (SFC) Loader for .zk files
 * Parses ZenithKernel SFC files with <template>, <script>, and <style> blocks
 */

class SFCLoader {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Load and parse a .zk SFC file
     */
    async loadSFC(path) {
        // Check cache first
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        try {
            // Fetch the .zk file
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load ZK component: ${response.statusText}`);
            }

            const content = await response.text();
            const parsed = this.parseSFC(content);
            
            // Cache the result
            this.cache.set(path, parsed);
            
            return parsed;
        } catch (error) {
            console.error('SFC loading error:', error);
            throw error;
        }
    }

    /**
     * Parse SFC content into template, script, and style blocks
     */
    parseSFC(content) {
        const result = {
            template: '',
            script: '',
            style: '',
            component: null
        };

        // Extract template block
        const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
        if (templateMatch) {
            result.template = templateMatch[1].trim();
        }

        // Extract script block
        const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
        if (scriptMatch) {
            result.script = scriptMatch[1].trim();
        }

        // Extract style block
        const styleMatch = content.match(/<style(?:\s+scoped)?>([\s\S]*?)<\/style>/);
        if (styleMatch) {
            result.style = styleMatch[1].trim();
        }

        // Process the component definition
        if (result.script) {
            result.component = this.processScript(result.script);
        }

        return result;
    }

    /**
     * Process the script block to extract component definition
     */
    processScript(script) {
        try {
            // Create a safe evaluation context with signal functions
            const context = {
                signal: (value) => ({
                    value,
                    _isSignal: true,
                    setValue: function(newValue) { this.value = newValue; }
                }),
                computed: (fn) => ({
                    fn,
                    _isComputed: true,
                    getValue: function() { return this.fn(); }
                }),
                console,
                Date,
                Math,
                JSON
            };

            // Simple script evaluation (in production, use a proper parser)
            const exportMatch = script.match(/export\s+default\s+({[\s\S]*});?/);
            if (exportMatch) {
                const componentCode = exportMatch[1];
                
                // Evaluate the component definition
                const func = new Function(...Object.keys(context), `return ${componentCode}`);
                const component = func(...Object.values(context));
                
                return component;
            }
        } catch (error) {
            console.error('Script processing error:', error);
        }

        return null;
    }

    /**
     * Create a component instance from SFC
     */
    createComponent(sfc, props = {}) {
        if (!sfc.component) {
            throw new Error('Invalid SFC: no component definition found');
        }

        const component = { ...sfc.component };
        
        // Initialize signals
        if (component.signals) {
            component._signals = {};
            for (const [key, signal] of Object.entries(component.signals)) {
                if (signal._isSignal) {
                    component._signals[key] = signal;
                }
            }
        }

        // Initialize computed properties
        if (component.computed) {
            component._computed = {};
            for (const [key, computed] of Object.entries(component.computed)) {
                if (computed._isComputed) {
                    component._computed[key] = computed;
                }
            }
        }

        // Bind methods
        if (component.methods) {
            for (const [key, method] of Object.entries(component.methods)) {
                component[key] = method.bind(component);
            }
        }

        // Set props
        component.props = props;

        return component;
    }

    /**
     * Render component template with data
     */
    renderTemplate(template, component) {
        let result = template;

        // Get current values from signals and computed
        const data = this.getComponentData(component);

        // Simple template interpolation
        result = result.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
            try {
                const trimmed = expression.trim();
                
                // Handle simple variables
                if (trimmed in data) {
                    return String(data[trimmed]);
                }

                // Handle expressions with fallbacks
                if (trimmed.includes('||')) {
                    const [variable, fallback] = trimmed.split('||').map(s => s.trim());
                    const value = data[variable];
                    if (value) return String(value);
                    return fallback.replace(/['"]/g, '');
                }

                return match;
            } catch (error) {
                console.warn('Template interpolation error:', error);
                return match;
            }
        });

        // Handle event bindings (@click, @input, etc.)
        result = result.replace(/@(\w+)="([^"]+)"/g, (match, event, handler) => {
            // Convert @click to onclick, @input to oninput, etc.
            const eventName = `on${event}`;

            // Replace $event with 'event' for proper JavaScript
            const fixedHandler = handler.replace(/\$event/g, 'event');

            return `${eventName}="${fixedHandler}"`;
        });

        // Handle v-model bindings
        result = result.replace(/v-model="([^"]+)"/g, (match, variable) => {
            // Simple v-model implementation with proper event handling
            return `value="{{ ${variable} }}" oninput="updateSignal('${variable}', event.target.value)"`;
        });

        return result;
    }

    /**
     * Get current component data (signals + computed + props)
     */
    getComponentData(component) {
        const data = { ...component.props };

        // Add signal values
        if (component._signals) {
            for (const [key, signal] of Object.entries(component._signals)) {
                data[key] = signal.value;
            }
        }

        // Add computed values
        if (component._computed) {
            for (const [key, computed] of Object.entries(component._computed)) {
                try {
                    data[key] = computed.fn();
                } catch (error) {
                    console.warn(`Computed property ${key} error:`, error);
                    data[key] = '';
                }
            }
        }

        // Add some default values for common template variables
        data.currentYear = new Date().getFullYear();
        data.signalStatus = 'Active';
        data.ecsStatus = 'Ready';
        data.hydrationStatus = 'Complete';
        data.loadTime = Date.now() - (component.startTime || Date.now());

        return data;
    }

    /**
     * Apply component styles to the page
     */
    applyStyles(style, componentName) {
        if (!style) return;

        // Create a style element
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-component', componentName);
        
        // Add scoped styles (simple implementation)
        const scopedStyle = style.replace(/([^{}]+){/g, (match, selector) => {
            // Add component scope to selectors
            const trimmed = selector.trim();
            if (trimmed.startsWith('@')) return match; // Keep @keyframes, @media, etc.
            return `[data-component="${componentName}"] ${trimmed} {`;
        });

        styleElement.textContent = scopedStyle;
        document.head.appendChild(styleElement);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

export default SFCLoader;
