/**
 * Suspense implementation for handling async data loading
 */

export type SuspenseStatus = 'pending' | 'success' | 'error';

/**
 * Class for tracking the state of suspended resources
 */
export class SuspenseResource<T> {
  private promise: Promise<T> | null = null;
  private result: T | null = null;
  private error: Error | null = null;
  private status: SuspenseStatus = 'pending';
  private subscribers: Set<() => void> = new Set();
  
  /**
   * Create a resource with an optional initial promise
   */
  constructor(promise?: Promise<T>) {
    if (promise) {
      this.load(promise);
    }
  }
  
  /**
   * Load data with a promise
   */
  load(promise: Promise<T>): Promise<T> {
    this.status = 'pending';
    this.promise = promise;
    
    promise.then(
      (value) => {
        this.result = value;
        this.error = null;
        this.status = 'success';
        this.notifySubscribers();
        return value;
      },
      (error) => {
        this.result = null;
        this.error = error instanceof Error ? error : new Error(String(error));
        this.status = 'error';
        this.notifySubscribers();
        throw error;
      }
    );
    
    return promise;
  }
  
  /**
   * Get the current value, throws if pending or error
   */
  read(): T {
    if (this.status === 'pending') {
      throw this.promise;
    } else if (this.status === 'error') {
      throw this.error;
    } else {
      return this.result!;
    }
  }
  
  /**
   * Check if resource is ready
   */
  isReady(): boolean {
    return this.status === 'success';
  }
  
  /**
   * Get the result without throwing
   */
  getResult(): T | null {
    return this.result;
  }
  
  /**
   * Get the error if any
   */
  getError(): Error | null {
    return this.error;
  }
  
  /**
   * Get the current status
   */
  getStatus(): SuspenseStatus {
    return this.status;
  }
  
  /**
   * Reset the resource
   */
  reset(): void {
    this.result = null;
    this.error = null;
    this.promise = null;
    this.status = 'pending';
    this.notifySubscribers();
  }
  
  /**
   * Subscribe to resource changes
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      subscriber();
    }
  }
}

/**
 * Suspense component for handling async data loading
 */
export class Suspense {
  private fallback: Node | null = null;
  private content: Node | null = null;
  private resources: Set<SuspenseResource<any>> = new Set();
  private container: HTMLElement;
  private mounted: boolean = false;
  private onReady: (() => void) | null = null;
  
  constructor(options: {
    fallback: Node,
    content?: Node,
    container?: HTMLElement
  }) {
    this.fallback = options.fallback;
    this.content = options.content || null;
    this.container = options.container || document.createElement('div');
  }
  
  /**
   * Register a resource to track
   */
  track<T>(resource: SuspenseResource<T>): SuspenseResource<T> {
    this.resources.add(resource);
    
    // Subscribe to resource changes
    resource.subscribe(() => {
      this.update();
    });
    
    return resource;
  }
  
  /**
   * Set the content
   */
  setContent(content: Node): void {
    this.content = content;
    this.update();
  }
  
  /**
   * Set the fallback
   */
  setFallback(fallback: Node): void {
    this.fallback = fallback;
    this.update();
  }
  
  /**
   * Set callback for when content is ready
   */
  setOnReady(callback: () => void): void {
    this.onReady = callback;
  }
  
  /**
   * Mount the Suspense component
   */
  mount(container: HTMLElement = this.container): void {
    this.container = container;
    this.mounted = true;
    this.update();
  }
  
  /**
   * Unmount the Suspense component
   */
  unmount(): void {
    this.mounted = false;
    
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
  
  /**
   * Update the display based on resource status
   */
  update(): void {
    if (!this.mounted) return;
    
    let isAnyPending = false;
    let hasError = false;
    
    for (const resource of this.resources) {
      if (resource.getStatus() === 'pending') {
        isAnyPending = true;
      } else if (resource.getStatus() === 'error') {
        hasError = true;
      }
    }
    
    // Clear the container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    
    if (isAnyPending) {
      // Show fallback while loading
      if (this.fallback) {
        this.container.appendChild(this.fallback);
      }
    } else if (hasError) {
      // Handle errors (could show a custom error UI here)
      if (this.fallback) {
        this.container.appendChild(this.fallback);
      }
      // Alternatively, propagate the error
      // const error = Array.from(this.resources).find(r => r.getStatus() === 'error')?.getError();
      // if (error) throw error;
    } else {
      // Show content when ready
      if (this.content) {
        this.container.appendChild(this.content);
        
        // Call onReady callback
        if (this.onReady) {
          this.onReady();
        }
      }
    }
  }
}

/**
 * Create a resource for asynchronous data fetching
 */
export function createResource<T>(fetcher: () => Promise<T>): SuspenseResource<T> {
  return new SuspenseResource<T>(fetcher());
}

/**
 * Create a lazy-loaded resource
 */
export function lazy<T>(loader: () => Promise<T>): SuspenseResource<T> {
  return new SuspenseResource<T>();
}
