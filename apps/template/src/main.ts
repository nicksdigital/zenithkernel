/**
 * ZenithKernel Template Application
 * 
 * This template demonstrates the core features of ZenithKernel:
 * - Reactive signals and computed values
 * - ZenithStore for state management
 * - Islands-based hydration
 * - Component system
 */

// Simple ZenithKernel template without complex dependencies
// Using basic signal implementation for demonstration
import { CounterStore } from './stores/CounterStore';
import { AppStore } from './stores/AppStore';
import { renderApp } from './ui/App';

console.log('🌊 ZenithKernel Template App Starting...');

// Initialize the ZenithKernel application
const app = new ZenithApp({
  name: 'ZenithKernel Template',
  version: '1.0.0'
});

// Bootstrap the kernel
await app.initialize();
const kernel = app.getKernel();

console.log('✅ Kernel bootstrapped successfully');

// Initialize stores
const counterStore = new CounterStore();
const appStore = new AppStore();

// Render UI
renderApp();

// Demo: Reactive signals
console.log('\n📡 Testing Reactive Signals...');

const [message, setMessage] = createSignal('Welcome to ZenithKernel!');
const [count, setCount] = createSignal(0);

// Computed value that depends on count
const doubledCount = createComputed(() => count() * 2);

// Effect that runs when signals change
createEffect(() => {
  console.log(`Message: ${message()}`);
});

createEffect(() => {
  console.log(`Count: ${count()}, Doubled: ${doubledCount()}`);
});

// Update signals to trigger effects
setMessage('ZenithKernel Template is running! 🚀');
setCount(5);

// Demo: Store integration
console.log('\n🏪 Testing Store Integration...');

// Subscribe to store changes
counterStore.subscribe((state) => {
  console.log('Counter store updated:', state);
});

appStore.subscribe((state) => {
  console.log('App store updated:', state);
});

// Update stores
counterStore.increment();
counterStore.increment();
appStore.updateTheme('dark');
appStore.updateUser({ id: '1', name: 'ZenithKernel User', email: 'user@zenithkernel.dev' });

// Demo: Component hydration simulation
console.log('\n🏝️ Simulating Islands Hydration...');

// Simulate hydrating components
const islands = [
  { id: 'counter', component: 'CounterIsland', props: { initialValue: counterStore.getState().count } },
  { id: 'header', component: 'HeaderIsland', props: { user: appStore.getState().user } },
  { id: 'theme-toggle', component: 'ThemeToggleIsland', props: { theme: appStore.getState().theme } }
];

islands.forEach(island => {
  console.log(`🏝️ Hydrating ${island.component} with props:`, island.props);
  // In a real app, this would hydrate the actual DOM components
});

// Demo: Cleanup and lifecycle
console.log('\n🔄 Demonstrating Lifecycle Management...');

// Set up cleanup
const cleanup = () => {
  console.log('🧹 Cleaning up application...');
  counterStore.reset();
  appStore.reset();
  console.log('✅ Cleanup complete');
};

// Simulate app lifecycle
setTimeout(() => {
  console.log('\n📊 Final State Summary:');
  console.log('Counter Store:', counterStore.getState());
  console.log('App Store:', appStore.getState());
  console.log('Current Message:', message());
  console.log('Current Count:', count());
  
  console.log('\n🎉 ZenithKernel Template Demo Complete!');
  console.log('Ready to build amazing applications! 🌊');
}, 1000);

// Render the UI
function renderApp() {
  const appElement = document.getElementById('app');
  if (!appElement) return;

  // Remove loading state
  document.body.classList.add('app-ready');

  // Create main app UI
  appElement.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: system-ui, sans-serif;">
      <header style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #00d9ff; margin: 0;">🌊 ZenithKernel Template</h1>
        <p style="color: #666; margin: 10px 0;">Reactive signals, stores, and islands architecture</p>
      </header>

      <div style="display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
        <!-- Counter Demo -->
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <h2 style="margin-top: 0;">Counter Store Demo</h2>
          <div id="counter-display" style="font-size: 24px; margin: 20px 0;">Count: ${counterStore.getState().count}</div>
          <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button id="increment" style="padding: 8px 16px; background: #00d9ff; color: white; border: none; border-radius: 4px; cursor: pointer;">+</button>
            <button id="decrement" style="padding: 8px 16px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;">-</button>
            <button id="reset" style="padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset</button>
          </div>
          <div style="font-size: 14px; color: #666;">
            <div>History: ${counterStore.getState().history.join(', ')}</div>
            <div>Total changes: ${counterStore.totalChanges}</div>
            <div>Is even: ${counterStore.isEven ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <!-- App Store Demo -->
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <h2 style="margin-top: 0;">App Store Demo</h2>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 10px;">
              Theme:
              <select id="theme-select" style="margin-left: 10px; padding: 4px;">
                <option value="light" ${appStore.getState().theme === 'light' ? 'selected' : ''}>Light</option>
                <option value="dark" ${appStore.getState().theme === 'dark' ? 'selected' : ''}>Dark</option>
              </select>
            </label>
            <button id="toggle-theme" style="padding: 8px 16px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer;">Toggle Theme</button>
          </div>
          <div style="font-size: 14px; color: #666;">
            <div>Current theme: ${appStore.getState().theme}</div>
            <div>Notifications: ${appStore.getState().notifications.length}</div>
            <div>Authenticated: ${appStore.isAuthenticated ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <!-- Signals Demo -->
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <h2 style="margin-top: 0;">Reactive Signals Demo</h2>
          <div id="signals-display" style="margin: 20px 0;">
            <div>Message: <span id="message-value">${message()}</span></div>
            <div>Count: <span id="count-value">${count()}</span></div>
            <div>Doubled: <span id="doubled-value">${doubledCount()}</span></div>
          </div>
          <button id="update-signals" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">Update Signals</button>
        </div>
      </div>

      <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666;">
        <p>🌊 Powered by ZenithKernel Framework</p>
        <p style="font-size: 12px;">Check the console for detailed reactive system logs</p>
      </footer>
    </div>
  `;

  // Add event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Counter controls
  document.getElementById('increment')?.addEventListener('click', () => {
    counterStore.increment();
    updateCounterDisplay();
  });

  document.getElementById('decrement')?.addEventListener('click', () => {
    counterStore.decrement();
    updateCounterDisplay();
  });

  document.getElementById('reset')?.addEventListener('click', () => {
    counterStore.reset();
    updateCounterDisplay();
  });

  // Theme controls
  document.getElementById('theme-select')?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    appStore.updateTheme(target.value as 'light' | 'dark');
    updateThemeDisplay();
  });

  document.getElementById('toggle-theme')?.addEventListener('click', () => {
    appStore.toggleTheme();
    updateThemeDisplay();
  });

  // Signals controls
  document.getElementById('update-signals')?.addEventListener('click', () => {
    setMessage('Signals updated! 🚀');
    setCount(Math.floor(Math.random() * 100));
    updateSignalsDisplay();
  });

  // Subscribe to store changes
  counterStore.subscribe(() => updateCounterDisplay());
  appStore.subscribe(() => updateThemeDisplay());
}

function updateCounterDisplay() {
  const state = counterStore.getState();
  const display = document.getElementById('counter-display');
  if (display) {
    display.textContent = `Count: ${state.count}`;
  }

  // Update other counter info
  const counterContainer = display?.closest('div');
  if (counterContainer) {
    const infoDiv = counterContainer.querySelector('div:last-child');
    if (infoDiv) {
      infoDiv.innerHTML = `
        <div>History: ${state.history.join(', ')}</div>
        <div>Total changes: ${counterStore.totalChanges}</div>
        <div>Is even: ${counterStore.isEven ? 'Yes' : 'No'}</div>
      `;
    }
  }
}

function updateThemeDisplay() {
  const state = appStore.getState();
  const select = document.getElementById('theme-select') as HTMLSelectElement;
  if (select) {
    select.value = state.theme;
  }

  // Update theme info
  const themeContainer = select?.closest('div')?.closest('div');
  if (themeContainer) {
    const infoDiv = themeContainer.querySelector('div:last-child');
    if (infoDiv) {
      infoDiv.innerHTML = `
        <div>Current theme: ${state.theme}</div>
        <div>Notifications: ${state.notifications.length}</div>
        <div>Authenticated: ${appStore.isAuthenticated ? 'Yes' : 'No'}</div>
      `;
    }
  }
}

function updateSignalsDisplay() {
  const messageEl = document.getElementById('message-value');
  const countEl = document.getElementById('count-value');
  const doubledEl = document.getElementById('doubled-value');

  if (messageEl) messageEl.textContent = message();
  if (countEl) countEl.textContent = count().toString();
  if (doubledEl) doubledEl.textContent = doubledCount().toString();
}

// Export for potential external use
export { app, kernel, counterStore, appStore, cleanup };
