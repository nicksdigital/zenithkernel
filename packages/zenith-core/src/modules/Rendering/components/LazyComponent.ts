/**
 * Lazy Component implementation for code splitting and improved performance
 */
import { SuspenseResource } from './Suspense';

/**
 * Type for component factory functions
 */
export type ComponentFactory<T = any> = (props?: T) => HTMLElement;

/**
 * Class for lazy loading components
 */
export class LazyComponent<T = any> {
  private resource: SuspenseResource<ComponentFactory<T>>;
  private componentInstance: HTMLElement | null = null;
  private props: T | undefined;
  private isRendered: boolean = false;
  private onLoadCallbacks: Array<(factory: ComponentFactory<T>) => void> = [];
  
  constructor(loader: () => Promise<{ default: ComponentFactory<T> }>) {
    this.resource = new SuspenseResource<ComponentFactory<T>>();
    
    // We defer loading until the component is first used
    this.loader = loader;
  }
  
  /**
   * Store loader for later use
   */
  private loader: () => Promise<{ default: ComponentFactory<T> }>;
  
  /**
   * Load the component module if not already loaded
   */
  load(): Promise<ComponentFactory<T>> {
    if (!this.resource.isReady() && this.resource.getStatus() === 'pending') {
      // Start loading if not already started
      const promise = this.loader()
        .then(module => {
          const factory = module.default;
          this.onLoadCallbacks.forEach(cb => cb(factory));
          return factory;
        });
      
      this.resource.load(promise);
    }
    
    return this.resource.getStatus() === 'success'
      ? Promise.resolve(this.resource.getResult()!)
      : this.resource.load(this.loader().then(module => module.default));
  }
  
  /**
   * Check if component is loaded
   */
  isLoaded(): boolean {
    return this.resource.isReady();
  }
  
  /**
   * Register a callback for when the component is loaded
   */
  onLoad(callback: (factory: ComponentFactory<T>) => void): () => void {
    this.onLoadCallbacks.push(callback);
    
    // If already loaded, call immediately
    if (this.isLoaded()) {
      callback(this.resource.getResult()!);
    }
    
    return () => {
      this.onLoadCallbacks = this.onLoadCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Render the component with the given props
   */
  render(props?: T): HTMLElement | null {
    this.props = props;
    
    if (!this.isLoaded()) {
      // Start loading if not already loaded
      this.load();
      return null; // Return null, Suspense will handle displaying fallback
    }
    
    const factory = this.resource.getResult();
    if (!factory) return null;
    
    this.componentInstance = factory(props);
    this.isRendered = true;
    
    return this.componentInstance;
  }
  
  /**
   * Preload the component without rendering it
   */
  preload(): Promise<void> {
    return this.load().then(() => {});
  }
  
  /**
   * Update the component with new props
   */
  update(props: T): void {
    this.props = props;
    
    if (this.isRendered && this.isLoaded()) {
      // Re-render with new props
      const factory = this.resource.getResult();
      if (factory && this.componentInstance) {
        const newInstance = factory(props);
        
        if (this.componentInstance.parentNode) {
          this.componentInstance.parentNode.replaceChild(newInstance, this.componentInstance);
        }
        
        this.componentInstance = newInstance;
      }
    }
  }
}

/**
 * Create a lazy-loaded component
 */
export function lazy<T = any>(
  loader: () => Promise<{ default: ComponentFactory<T> }>
): LazyComponent<T> {
  return new LazyComponent<T>(loader);
}
