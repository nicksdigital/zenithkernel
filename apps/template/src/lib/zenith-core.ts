/**
 * Mock implementation of @zenithcore/core for template testing
 */

// Signal implementation
export type Signal<T> = {
  (): T;
  value: T;
};

export type SignalSetter<T> = (value: T | ((prev: T) => T)) => void;

export function createSignal<T>(initialValue: T): [Signal<T>, SignalSetter<T>] {
  let value = initialValue;
  const subscribers = new Set<() => void>();
  
  const getter = () => value;
  getter.value = value;
  
  const setter = (newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(value) 
      : newValue;
    
    if (nextValue !== value) {
      value = nextValue;
      getter.value = value;
      subscribers.forEach(fn => fn());
    }
  };
  
  return [getter as Signal<T>, setter];
}

export function createEffect(fn: () => void): void {
  // Simple effect implementation
  fn();
}

export function createComputed<T>(fn: () => T): Signal<T> {
  const [signal, setSignal] = createSignal(fn());
  
  // In a real implementation, this would track dependencies
  createEffect(() => {
    setSignal(fn());
  });
  
  return signal;
}

// ECS Mock Implementation
export class Component {
  constructor() {}
}

export class Entity {
  private components = new Map<any, Component>();
  
  add<T extends Component>(component: T): this {
    this.components.set(component.constructor, component);
    return this;
  }
  
  get<T extends Component>(ComponentClass: new (...args: any[]) => T): T {
    return this.components.get(ComponentClass) as T;
  }
  
  has<T extends Component>(ComponentClass: new (...args: any[]) => T): boolean {
    return this.components.has(ComponentClass);
  }
  
  remove<T extends Component>(ComponentClass: new (...args: any[]) => T): this {
    this.components.delete(ComponentClass);
    return this;
  }
}

export class System {
  protected world!: World;
  
  setWorld(world: World): void {
    this.world = world;
  }
  
  update(deltaTime: number): void {
    // Override in subclasses
  }
}

export class World {
  private entities = new Set<Entity>();
  private systems = new Set<System>();
  
  createEntity(): Entity {
    const entity = new Entity();
    this.entities.add(entity);
    return entity;
  }
  
  addSystem(system: System): void {
    system.setWorld(this);
    this.systems.add(system);
  }
  
  query<T extends Component>(componentTypes: (new (...args: any[]) => T)[]): Entity[] {
    return Array.from(this.entities).filter(entity =>
      componentTypes.every(ComponentType => entity.has(ComponentType))
    );
  }
  
  update(deltaTime: number): void {
    this.systems.forEach(system => system.update(deltaTime));
  }
}

// ZenithKernel main class
export class ZenithKernel {
  private world: World;
  private components = new Map<string, any>();
  
  constructor(config: any = {}) {
    this.world = new World();
  }
  
  registerComponent(name: string, component: any): void {
    this.components.set(name, component);
  }
  
  start(): void {
    console.log('ZenithKernel started');
    
    // Start game loop
    const gameLoop = (timestamp: number) => {
      this.world.update(16); // 60fps
      requestAnimationFrame(gameLoop);
    };
    
    if (typeof window !== 'undefined') {
      requestAnimationFrame(gameLoop);
    }
  }
  
  getWorld(): World {
    return this.world;
  }
}
