import { HistoryAdapter } from "./HistoryAdapter";

/**
 * Browser history adapter implementation
 * Uses the native browser History API
 */
export class BrowserHistoryAdapter implements HistoryAdapter {
  private hasWindow: boolean;
  
  constructor() {
    this.hasWindow = typeof window !== 'undefined';
  }
  
  navigate(path: string, replace: boolean = false): void {
    if (!this.hasWindow) return;
    
    const state = { scrollX: window.scrollX, scrollY: window.scrollY };
    
    if (replace) {
      window.history.replaceState(state, '', path);
    } else {
      window.history.pushState(state, '', path);
    }
  }
  
  back(): void {
    if (this.hasWindow) {
      window.history.back();
    }
  }
  
  forward(): void {
    if (this.hasWindow) {
      window.history.forward();
    }
  }
  
  canGoBack(): boolean {
    return this.hasWindow && window.history.length > 1;
  }
  
  canGoForward(): boolean {
    // The browser doesn't provide a reliable way to determine this
    // We would need to track navigation to implement this properly
    return false;
  }
  
  getLocation(): string {
    if (!this.hasWindow) return '/';
    return window.location.pathname + window.location.search;
  }
  
  pushState(state: any, title: string, url: string): void {
    if (this.hasWindow) {
      window.history.pushState(state, title, url);
    }
  }
  
  replaceState(state: any, title: string, url: string): void {
    if (this.hasWindow) {
      window.history.replaceState(state, title, url);
    }
  }
}
