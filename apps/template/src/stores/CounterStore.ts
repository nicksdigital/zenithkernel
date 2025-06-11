/**
 * Counter Store Example
 * 
 * Demonstrates ZenithStore usage with reactive state management
 */

import { createSignal, createEffect } from '@zenithcore/core';

export interface CounterState {
  count: number;
  history: number[];
  lastUpdated: Date;
}

export class CounterStore {
  private countSignal = createSignal(0);
  private historySignal = createSignal<number[]>([]);
  private lastUpdatedSignal = createSignal(new Date());
  private subscribers = new Set<(state: CounterState) => void>();

  // Getters for signals
  private count = () => this.countSignal[0]();
  private setCount = (value: number) => this.countSignal[1](value);
  private history = () => this.historySignal[0]();
  private setHistory = (value: number[]) => this.historySignal[1](value);
  private lastUpdated = () => this.lastUpdatedSignal[0]();
  private setLastUpdated = (value: Date) => this.lastUpdatedSignal[1](value);

  constructor() {
    // Effect to update history when count changes
    createEffect(() => {
      const currentCount = this.count();
      const currentHistory = this.history();
      
      if (currentHistory.length === 0 || currentHistory[currentHistory.length - 1] !== currentCount) {
        this.setHistory([...currentHistory, currentCount]);
        this.setLastUpdated(new Date());
        this.notifySubscribers();
      }
    });
  }

  // Public getters
  getState(): CounterState {
    return {
      count: this.count(),
      history: this.history(),
      lastUpdated: this.lastUpdated()
    };
  }

  // Actions
  increment(): void {
    this.setCount(this.count() + 1);
  }

  decrement(): void {
    this.setCount(this.count() - 1);
  }

  incrementBy(amount: number): void {
    this.setCount(this.count() + amount);
  }

  reset(): void {
    this.setCount(0);
    this.setHistory([]);
    this.setLastUpdated(new Date());
  }

  // Computed values
  get isPositive(): boolean {
    return this.count() > 0;
  }

  get isEven(): boolean {
    return this.count() % 2 === 0;
  }

  get totalChanges(): number {
    return this.history().length;
  }

  // Subscription management
  subscribe(callback: (state: CounterState) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const state = this.getState();
    this.subscribers.forEach(callback => callback(state));
  }

  // Async actions example
  async incrementAsync(delay: number = 1000): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.increment();
        resolve();
      }, delay);
    });
  }

  // Batch operations
  batchUpdate(operations: (() => void)[]): void {
    operations.forEach(op => op());
  }
}
