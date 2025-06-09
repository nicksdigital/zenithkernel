/**
 * Base interface for history adapters
 * Allows plugging in different history implementations
 */
export interface HistoryAdapter {
  /**
   * Navigate to a new path
   */
  navigate(path: string, replace?: boolean): void;
  
  /**
   * Go back in history
   */
  back(): void;
  
  /**
   * Go forward in history
   */
  forward(): void;
  
  /**
   * Check if going back is possible
   */
  canGoBack(): boolean;
  
  /**
   * Check if going forward is possible
   */
  canGoForward(): boolean;
  
  /**
   * Get current location
   */
  getLocation(): string;
  
  /**
   * Add state to history
   */
  pushState(state: any, title: string, url: string): void;
  
  /**
   * Replace current state
   */
  replaceState(state: any, title: string, url: string): void;
}
