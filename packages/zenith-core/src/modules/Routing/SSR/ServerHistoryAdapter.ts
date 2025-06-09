import { HistoryAdapter } from "../adapters/HistoryAdapter";

/**
 * Server-side history adapter implementation
 * Used during server-side rendering
 */
export class ServerHistoryAdapter implements HistoryAdapter {
  private currentUrl: string;
  
  constructor(initialUrl: string = '/') {
    this.currentUrl = initialUrl;
  }
  
  navigate(path: string, replace: boolean = false): void {
    this.currentUrl = path;
  }
  
  back(): void {
    // No-op in server environment
  }
  
  forward(): void {
    // No-op in server environment
  }
  
  canGoBack(): boolean {
    return false;
  }
  
  canGoForward(): boolean {
    return false;
  }
  
  getLocation(): string {
    return this.currentUrl;
  }
  
  pushState(state: any, title: string, url: string): void {
    this.currentUrl = url;
  }
  
  replaceState(state: any, title: string, url: string): void {
    this.currentUrl = url;
  }
  
  /**
   * Set the URL for the current request
   */
  setUrl(url: string): void {
    this.currentUrl = url;
  }
}
