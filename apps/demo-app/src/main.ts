/**
 * ZenithKernel Demo App - Main Entry Point
 * 
 * This demonstrates a complete ZenithKernel application with:
 * - Signal-based reactive state management
 * - ECS (Entity Component System) integration
 * - ZenithStore for complex state management
 * - Islands architecture for client-side hydration
 * - TypeScript and Bun integration
 */

import { ZenithKernel } from '@core/ZenithKernel';
import { SignalManager } from '@core/SignalManager';
import { createStore } from '@core/store';
import { signal, computed, effect } from '@core/signals';
import { ZenithApp } from '@sdk/core/ZenithApp';

// Import our demo components and stores
import { createAppStore } from './stores/appStore';
import { CounterComponent } from './components/CounterComponent';
import { TodoListComponent } from './components/TodoListComponent';
import { initializeIslands } from './islands/islandLoader';

/**
 * Application State Interface
 */
interface AppState {
  isInitialized: boolean;
  currentView: 'home' | 'counter' | 'todos' | 'signals';
  theme: 'light' | 'dark';
  user: {
    name: string;
    preferences: Record<string, any>;
  };
}

/**
 * Main Application Class
 */
class DemoApp {
  private kernel: ZenithKernel;
  private signalManager: SignalManager;
  private app: ZenithApp;
  private store: ReturnType<typeof createAppStore>;
  private appContainer: HTMLElement;

  constructor() {
    this.appContainer = document.getElementById('app')!;
    this.kernel = new ZenithKernel();
    this.signalManager = new SignalManager({
      ecsManager: this.kernel.getECS(),
      debugMode: true,
      performanceTracking: true
    });
    
    // Initialize ZenithApp with our kernel
    this.app = new ZenithApp(this.kernel, {
      debug: true,
      defaultHydrationStrategy: 'visible',
      autoStart: false
    });

    // Create application store
    this.store = createAppStore();
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    try {
      console.log('🌊 Initializing ZenithKernel Demo App...');

      // Initialize core systems
      await this.initializeCore();
      
      // Set up reactive state
      this.setupReactiveState();
      
      // Initialize components
      this.initializeComponents();
      
      // Set up routing
      this.setupRouting();
      
      // Initialize islands for client-side hydration
      await this.initializeClientSide();
      
      // Render initial UI
      this.render();
      
      // Mark as initialized
      this.store.dispatch({ type: 'SET_INITIALIZED', payload: true });
      
      console.log('✅ ZenithKernel Demo App initialized successfully!');
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.renderError(error as Error);
    }
  }

  /**
   * Initialize core ZenithKernel systems
   */
  private async initializeCore(): Promise<void> {
    // Register ECS components
    const ecs = this.kernel.getECS();

    // Register counter component
    ecs.registerComponentType('Counter', CounterComponent);

    // Start the ZenithApp (this will start the kernel internally)
    this.app.start();
  }

  /**
   * Set up reactive state with signals
   */
  private setupReactiveState(): void {
    // Create reactive signals for UI state
    const currentView = this.signalManager.createSignal('currentView', 'home');
    const theme = this.signalManager.createSignal('theme', 'light');
    const isLoading = this.signalManager.createSignal('isLoading', false);
    
    // Create computed signals
    const pageTitle = this.signalManager.createComputed('pageTitle', () => {
      const view = currentView.value;
      return `ZenithKernel Demo - ${view.charAt(0).toUpperCase() + view.slice(1)}`;
    });
    
    // Set up effects for DOM updates
    this.signalManager.createEffect('updateTitle', () => {
      document.title = pageTitle.value;
    });
    
    this.signalManager.createEffect('updateTheme', () => {
      document.body.className = `theme-${theme.value}`;
    });
  }

  /**
   * Initialize components
   */
  private initializeComponents(): void {
    // Components will be initialized when rendered
    console.log('📦 Components ready for initialization');
  }

  /**
   * Set up client-side routing
   */
  private setupRouting(): void {
    // Simple hash-based routing for demo
    const handleRouteChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      const validViews = ['home', 'counter', 'todos', 'signals'];
      const view = validViews.includes(hash) ? hash : 'home';
      
      const currentViewSignal = this.signalManager.getSignal('currentView');
      if (currentViewSignal) {
        currentViewSignal.value = view as any;
      }
      
      this.render();
    };

    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange(); // Handle initial route
  }

  /**
   * Initialize client-side islands
   */
  private async initializeClientSide(): Promise<void> {
    if (typeof window !== 'undefined') {
      console.log('🏝️ Initializing islands...');
      await initializeIslands();
    }
  }

  /**
   * Render the application UI
   */
  private render(): void {
    const currentViewSignal = this.signalManager.getSignal('currentView');
    const currentView = currentViewSignal?.value || 'home';
    
    this.appContainer.innerHTML = `
      <div class="app">
        ${this.renderNavigation()}
        ${this.renderCurrentView(currentView)}
      </div>
    `;
    
    // Initialize any islands in the rendered content
    this.initializeRenderedIslands();
  }

  /**
   * Render navigation
   */
  private renderNavigation(): string {
    return `
      <nav class="navigation">
        <div class="nav-brand">
          <h2>🌊 ZenithKernel Demo</h2>
        </div>
        <div class="nav-links">
          <a href="#home" class="nav-link">🏠 Home</a>
          <a href="#counter" class="nav-link">🔢 Counter</a>
          <a href="#todos" class="nav-link">📝 Todos</a>
          <a href="#signals" class="nav-link">⚡ Signals</a>
        </div>
      </nav>
    `;
  }

  /**
   * Render current view
   */
  private renderCurrentView(view: string): string {
    switch (view) {
      case 'home':
        return this.renderHomeView();
      case 'counter':
        return this.renderCounterView();
      case 'todos':
        return this.renderTodosView();
      case 'signals':
        return this.renderSignalsView();
      default:
        return this.renderHomeView();
    }
  }

  /**
   * Render home view
   */
  private renderHomeView(): string {
    return `
      <div class="view home-view">
        <div class="hero">
          <h1>Welcome to ZenithKernel</h1>
          <p>A hyper-performant modular TypeScript microkernel framework</p>
        </div>
        
        <div class="features-grid">
          <div class="feature-card">
            <h3>⚡ Reactive Signals</h3>
            <p>Fine-grained reactivity with automatic dependency tracking</p>
            <a href="#signals" class="btn">Explore Signals</a>
          </div>
          
          <div class="feature-card">
            <h3>🎯 ECS Architecture</h3>
            <p>Entity Component System for efficient state management</p>
            <a href="#counter" class="btn">See ECS Demo</a>
          </div>
          
          <div class="feature-card">
            <h3>🏪 ZenithStore</h3>
            <p>Type-safe immutable state management with time travel</p>
            <a href="#todos" class="btn">Try Store</a>
          </div>
          
          <div class="feature-card">
            <h3>🏝️ Islands Architecture</h3>
            <p>Selective hydration for optimal performance</p>
            <a href="#" class="btn">Learn More</a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render counter view (ECS demo)
   */
  private renderCounterView(): string {
    return `
      <div class="view counter-view">
        <h1>ECS Counter Demo</h1>
        <p>This counter uses ZenithKernel's Entity Component System</p>
        <div id="counter-island" class="island" data-island="counter">
          <div class="counter-container">
            <div class="counter-display">
              <span class="counter-value">0</span>
            </div>
            <div class="counter-controls">
              <button class="btn btn-primary" data-action="increment">+</button>
              <button class="btn btn-secondary" data-action="decrement">-</button>
              <button class="btn btn-tertiary" data-action="reset">Reset</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render todos view (Store demo)
   */
  private renderTodosView(): string {
    return `
      <div class="view todos-view">
        <h1>ZenithStore Todo Demo</h1>
        <p>This todo list uses ZenithStore for state management</p>
        <div id="todos-island" class="island" data-island="todos">
          <div class="todo-container">
            <div class="todo-input">
              <input type="text" placeholder="Add a new todo..." class="todo-input-field">
              <button class="btn btn-primary" data-action="add-todo">Add</button>
            </div>
            <div class="todo-list">
              <!-- Todos will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render signals view (Signals demo)
   */
  private renderSignalsView(): string {
    return `
      <div class="view signals-view">
        <h1>Reactive Signals Demo</h1>
        <p>Explore ZenithKernel's reactive signal system</p>
        <div id="signals-island" class="island" data-island="signals">
          <div class="signals-container">
            <div class="signal-demo">
              <h3>Basic Signal</h3>
              <div class="signal-controls">
                <input type="text" class="signal-input" placeholder="Enter text...">
                <div class="signal-output">Output: <span class="signal-value"></span></div>
              </div>
            </div>
            
            <div class="computed-demo">
              <h3>Computed Signal</h3>
              <div class="computed-output">
                Length: <span class="computed-value">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize islands in rendered content
   */
  private initializeRenderedIslands(): void {
    // This will be handled by the island loader
    const islands = document.querySelectorAll('[data-island]');
    islands.forEach(island => {
      const islandType = island.getAttribute('data-island');
      console.log(`🏝️ Found island: ${islandType}`);
    });
  }

  /**
   * Render error state
   */
  private renderError(error: Error): void {
    this.appContainer.innerHTML = `
      <div class="error-container">
        <h2>❌ Application Error</h2>
        <p>Failed to initialize ZenithKernel Demo App</p>
        <details>
          <summary>Error Details</summary>
          <pre>${error.message}\n${error.stack}</pre>
        </details>
        <button onclick="location.reload()" class="btn btn-primary">Reload App</button>
      </div>
    `;
  }
}

/**
 * Initialize and start the application
 */
async function main() {
  const app = new DemoApp();
  await app.initialize();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// Export for debugging
(window as any).demoApp = { main };
