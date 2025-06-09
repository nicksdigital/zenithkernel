/**
 * CounterComponent
 * 
 * A simple counter component for the ECS system
 */

export class CounterComponent {
  value: number;
  
  constructor(initialValue: number = 0) {
    this.value = initialValue;
  }
  
  increment(): void {
    this.value++;
  }
  
  decrement(): void {
    this.value--;
  }
  
  reset(): void {
    this.value = 0;
  }
}

// Serialization helpers for ECS system
export function serializeCounter(counter: CounterComponent): any {
  return {
    value: counter.value
  };
}

export function deserializeCounter(data: any): CounterComponent {
  return new CounterComponent(data.value);
}
