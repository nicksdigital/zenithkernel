/**
 * Simple App Store for Hello World Demo
 * Demonstrates basic state management with ZenithKernel
 */

class AppStore {
    constructor() {
        // Initialize state
        this.state = {
            userName: '',
            counter: 0,
            signalStatus: 'Active',
            ecsStatus: 'Ready',
            renderCount: 0,
            loadTime: 0,
            hydrationStatus: 'Complete',
            startTime: Date.now()
        };

        // Bind methods to preserve context
        this.setState = this.setState.bind(this);
        this.getState = this.getState.bind(this);
        this.incrementCounter = this.incrementCounter.bind(this);
        this.decrementCounter = this.decrementCounter.bind(this);
        this.updateUserName = this.updateUserName.bind(this);
        this.incrementRenderCount = this.incrementRenderCount.bind(this);

        // Calculate initial load time
        this.updateLoadTime();
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Update state and trigger re-render
     */
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.incrementRenderCount();
        this.notifySubscribers();
    }

    /**
     * Increment counter
     */
    incrementCounter() {
        this.setState({ 
            counter: this.state.counter + 1 
        });
    }

    /**
     * Decrement counter
     */
    decrementCounter() {
        this.setState({ 
            counter: Math.max(0, this.state.counter - 1) 
        });
    }

    /**
     * Update user name
     */
    updateUserName(name) {
        this.setState({ 
            userName: name.trim() 
        });
    }

    /**
     * Increment render count
     */
    incrementRenderCount() {
        this.state.renderCount += 1;
    }

    /**
     * Update load time
     */
    updateLoadTime() {
        this.state.loadTime = Date.now() - this.state.startTime;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback) {
        if (!this.subscribers) {
            this.subscribers = [];
        }
        this.subscribers.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Notify all subscribers of state changes
     */
    notifySubscribers() {
        if (this.subscribers) {
            this.subscribers.forEach(callback => {
                try {
                    callback(this.getState());
                } catch (error) {
                    console.error('Error in store subscriber:', error);
                }
            });
        }
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.setState({
            userName: '',
            counter: 0,
            renderCount: 0
        });
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            loadTime: this.state.loadTime,
            renderCount: this.state.renderCount,
            stateSize: JSON.stringify(this.state).length,
            timestamp: Date.now()
        };
    }
}

// Export for use in the app
export default AppStore;
