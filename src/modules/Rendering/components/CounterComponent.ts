/**
 * Counter Component - ECS component for counter state management
 * Used by ECS Counter Island for reactive state management
 */

export class CounterComponent {
  value: number;
  step: number;
  label: string;
  initialValue: number;
  lastUpdated: number;
  
  constructor(
    value: number = 0,
    step: number = 1,
    label: string = 'Counter',
    initialValue?: number
  ) {
    this.value = value;
    this.step = step;
    this.label = label;
    this.initialValue = initialValue ?? value;
    this.lastUpdated = Date.now();
  }
  
  /**
   * Increment the counter by the step amount
   */
  increment(): void {
    this.value += this.step;
    this.lastUpdated = Date.now();
  }
  
  /**
   * Decrement the counter by the step amount
   */
  decrement(): void {
    this.value -= this.step;
    this.lastUpdated = Date.now();
  }
  
  /**
   * Reset the counter to its initial value
   */
  reset(): void {
    this.value = this.initialValue;
    this.lastUpdated = Date.now();
  }
  
  /**
   * Set a new value for the counter
   */
  setValue(newValue: number): void {
    this.value = newValue;
    this.lastUpdated = Date.now();
  }
}
