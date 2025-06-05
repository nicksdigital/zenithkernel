import { HistoryAdapter } from "./HistoryAdapter";

/**
 * In-memory history adapter implementation
 * Useful for testing and server-side rendering
 */
export class MemoryHistoryAdapter implements HistoryAdapter {
  private entries: { path: string, state: any }[] = [];
  private index: number = -1;
  
  constructor(initialEntries: string[] = ['/']) {
    this.entries = initialEntries.map(path => ({ path, state: null }));
    this.index = initialEntries.length - 1;
  }
  
  navigate(path: string, replace: boolean = false): void {
    if (replace && this.index >= 0) {
      // Replace current entry
      this.entries[this.index] = { path, state: null };
    } else {
      // Remove any forward entries
      if (this.index < this.entries.length - 1) {
        this.entries = this.entries.slice(0, this.index + 1);
      }
      
      // Add new entry
      this.entries.push({ path, state: null });
      this.index++;
    }
  }
  
  back(): void {
    if (this.canGoBack()) {
      this.index--;
    }
  }
  
  forward(): void {
    if (this.canGoForward()) {
      this.index++;
    }
  }
  
  canGoBack(): boolean {
    return this.index > 0;
  }
  
  canGoForward(): boolean {
    return this.index < this.entries.length - 1;
  }
  
  getLocation(): string {
    if (this.index === -1) return '/';
    return this.entries[this.index].path;
  }
  
  pushState(state: any, title: string, url: string): void {
    this.entries.push({ path: url, state });
    this.index = this.entries.length - 1;
  }
  
  replaceState(state: any, title: string, url: string): void {
    if (this.index >= 0) {
      this.entries[this.index] = { path: url, state };
    } else {
      this.entries.push({ path: url, state });
      this.index = 0;
    }
  }
}
