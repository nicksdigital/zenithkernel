/**
 * JIT CSS Loader for Hydra Islands
 * 
 * This utility handles dynamic loading of CSS for islands when they are hydrated,
 * reducing initial page load time and preventing unused CSS.
 */

// Track loaded CSS modules to prevent duplicates
const loadedCssModules = new Set<string>();

/**
 * Load a CSS module for an island
 * 
 * @param moduleName Name of the CSS module to load (without path or extension)
 * @returns Promise that resolves when the CSS is loaded
 */
export function loadCssModule(moduleName: string): Promise<void> {
  // If already loaded, return resolved promise
  if (loadedCssModules.has(moduleName)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Create link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = `/islands/styles/${moduleName}`;
    link.dataset.islandCss = moduleName;

    // Handle load events
    link.onload = () => {
      loadedCssModules.add(moduleName);
      console.log(`Loaded CSS module: ${moduleName}`);
      resolve();
    };

    link.onerror = (err) => {
      console.error(`Failed to load CSS module: ${moduleName}`, err);
      reject(new Error(`Failed to load CSS module: ${moduleName}`));
    };

    // Add to document head
    document.head.appendChild(link);
  });
}

/**
 * Load critical CSS needed for initial rendering
 * This should be called on application startup
 */
export function loadCriticalCss(): Promise<void> {
  return loadCssModule('critical.css');
}

/**
 * Load all CSS modules for a set of islands
 * 
 * @param islandNames Array of island names to load CSS for
 * @returns Promise that resolves when all CSS modules are loaded
 */
export function preloadIslandsCss(islandNames: string[]): Promise<void[]> {
  return Promise.all(
    islandNames.map(name => loadCssModule(`${name}.module.css`))
  );
}

/**
 * Initialize CSS loading system
 * Loads critical CSS and sets up MutationObserver for new islands
 */
export function initCssSystem() {
  // Load critical CSS immediately
  loadCriticalCss().catch(err => {
    console.warn('Failed to load critical CSS', err);
  });

  // Set up observer to detect new islands added to DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            // Find islands in the added subtree
            const islands = node.querySelectorAll('[data-island]');
            for (const island of Array.from(islands)) {
              const islandName = island.getAttribute('data-island');
              if (islandName) {
                loadCssModule(`${islandName}.module.css`).catch(() => {
                  // Silently fail as the island loader will handle CSS loading explicitly too
                });
              }
            }
          }
        }
      }
    }
  });

  // Start observing the document body
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return () => observer.disconnect();
}