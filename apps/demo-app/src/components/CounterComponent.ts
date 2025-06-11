/**
 * Counter Component for ECS Demo
 * 
 * This demonstrates ZenithKernel's Entity Component System (ECS)
 * with reactive signals integration.
 */

import { Component } from '@core/ECS';
import { Signal, signal } from '@core/signals';

/**
 * Counter Component Data Interface
 */
export interface CounterComponentData {
  value: number;
  step: number;
  min?: number;
  max?: number;
  lastUpdated: number;
  updateCount: number;
}

/**
 * Counter ECS Component
 * 
 * This component stores counter state and provides reactive signals
 * for UI updates.
 */
export class CounterComponent implements Component {
  public readonly type = 'Counter';
  
  // Component data
  public value: number;
  public step: number;
  public min?: number;
  public max?: number;
  public lastUpdated: number;
  public updateCount: number;
  
  // Reactive signals
  public valueSignal: Signal<number>;
  public isAtMin: Signal<boolean>;
  public isAtMax: Signal<boolean>;
  
  constructor(data: Partial<CounterComponentData> = {}) {
    // Initialize component data
    this.value = data.value ?? 0;
    this.step = data.step ?? 1;
    this.min = data.min;
    this.max = data.max;
    this.lastUpdated = data.lastUpdated ?? Date.now();
    this.updateCount = data.updateCount ?? 0;
    
    // Create reactive signals
    this.valueSignal = signal(this.value, {
      name: 'counter-value',
      debug: true
    });
    
    this.isAtMin = signal(
      this.min !== undefined ? this.value <= this.min : false,
      { name: 'counter-at-min' }
    );
    
    this.isAtMax = signal(
      this.max !== undefined ? this.value >= this.max : false,
      { name: 'counter-at-max' }
    );
    
    // Set up signal synchronization
    this.setupSignalSync();
  }
  
  /**
   * Increment the counter value
   */
  increment(): void {
    const newValue = this.value + this.step;
    
    // Check max constraint
    if (this.max !== undefined && newValue > this.max) {
      return; // Don't increment beyond max
    }
    
    this.setValue(newValue);
  }
  
  /**
   * Decrement the counter value
   */
  decrement(): void {
    const newValue = this.value - this.step;
    
    // Check min constraint
    if (this.min !== undefined && newValue < this.min) {
      return; // Don't decrement below min
    }
    
    this.setValue(newValue);
  }
  
  /**
   * Reset counter to initial value (0 or min)
   */
  reset(): void {
    const resetValue = this.min ?? 0;
    this.setValue(resetValue);
  }
  
  /**
   * Set counter to specific value
   */
  setValue(newValue: number): void {
    // Validate constraints
    if (this.min !== undefined && newValue < this.min) {
      newValue = this.min;
    }
    if (this.max !== undefined && newValue > this.max) {
      newValue = this.max;
    }
    
    // Update component data
    this.value = newValue;
    this.lastUpdated = Date.now();
    this.updateCount++;
    
    // Update signals
    this.valueSignal.value = newValue;
    this.updateConstraintSignals();
  }
  
  /**
   * Set step size for increment/decrement
   */
  setStep(step: number): void {
    this.step = Math.max(1, step); // Ensure step is at least 1
  }
  
  /**
   * Set minimum value constraint
   */
  setMin(min: number): void {
    this.min = min;
    
    // Adjust current value if it's below new min
    if (this.value < min) {
      this.setValue(min);
    }
    
    this.updateConstraintSignals();
  }
  
  /**
   * Set maximum value constraint
   */
  setMax(max: number): void {
    this.max = max;
    
    // Adjust current value if it's above new max
    if (this.value > max) {
      this.setValue(max);
    }
    
    this.updateConstraintSignals();
  }
  
  /**
   * Get component data for serialization
   */
  getData(): CounterComponentData {
    return {
      value: this.value,
      step: this.step,
      min: this.min,
      max: this.max,
      lastUpdated: this.lastUpdated,
      updateCount: this.updateCount
    };
  }
  
  /**
   * Update component from data
   */
  setData(data: Partial<CounterComponentData>): void {
    if (data.value !== undefined) this.setValue(data.value);
    if (data.step !== undefined) this.setStep(data.step);
    if (data.min !== undefined) this.setMin(data.min);
    if (data.max !== undefined) this.setMax(data.max);
  }
  
  /**
   * Dispose of the component and clean up signals
   */
  dispose(): void {
    this.valueSignal.dispose();
    this.isAtMin.dispose();
    this.isAtMax.dispose();
  }
  
  /**
   * Set up signal synchronization
   */
  private setupSignalSync(): void {
    // Keep signals in sync with component data
    this.updateConstraintSignals();
  }
  
  /**
   * Update constraint signals based on current value
   */
  private updateConstraintSignals(): void {
    this.isAtMin.value = this.min !== undefined ? this.value <= this.min : false;
    this.isAtMax.value = this.max !== undefined ? this.value >= this.max : false;
  }
}

/**
 * Serialize counter component for ECS
 */
export function serializeCounter(component: CounterComponent): string {
  return JSON.stringify(component.getData());
}

/**
 * Deserialize counter component for ECS
 */
export function deserializeCounter(data: string): CounterComponent {
  const parsed = JSON.parse(data) as CounterComponentData;
  return new CounterComponent(parsed);
}

/**
 * Create a counter component with default settings
 */
export function createCounter(
  initialValue: number = 0,
  options: {
    step?: number;
    min?: number;
    max?: number;
  } = {}
): CounterComponent {
  return new CounterComponent({
    value: initialValue,
    step: options.step ?? 1,
    min: options.min,
    max: options.max,
    lastUpdated: Date.now(),
    updateCount: 0
  });
}

/**
 * Counter component factory for different use cases
 */
export const CounterFactory = {
  /**
   * Create a basic counter (no constraints)
   */
  basic: (initialValue: number = 0) => createCounter(initialValue),
  
  /**
   * Create a bounded counter (with min/max)
   */
  bounded: (min: number, max: number, initialValue?: number) => 
    createCounter(initialValue ?? min, { min, max }),
  
  /**
   * Create a step counter (custom step size)
   */
  stepped: (step: number, initialValue: number = 0) => 
    createCounter(initialValue, { step }),
  
  /**
   * Create a percentage counter (0-100)
   */
  percentage: (initialValue: number = 0) => 
    createCounter(initialValue, { min: 0, max: 100 }),
  
  /**
   * Create a rating counter (1-5 stars)
   */
  rating: (initialValue: number = 1) => 
    createCounter(initialValue, { min: 1, max: 5 })
};
