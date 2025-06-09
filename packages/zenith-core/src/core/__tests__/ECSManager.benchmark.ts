/**
 * Performance benchmark for the optimized ECSManager
 * 
 * This file contains benchmarks to measure the performance improvements
 * of the optimized ECS implementation compared to a naive approach.
 */

import { ECSManager, Entity } from '../ECSManager';

// Mock component classes for testing
class Position {
  x: number = 0;
  y: number = 0;
  
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
}

class Velocity {
  vx: number = 0;
  vy: number = 0;
  
  constructor(vx: number = 0, vy: number = 0) {
    this.vx = vx;
    this.vy = vy;
  }
}

class Health {
  value: number = 100;
  max: number = 100;
  
  constructor(value: number = 100, max: number = 100) {
    this.value = value;
    this.max = max;
  }
}

class Renderable {
  sprite: string = 'default';
  visible: boolean = true;
  
  constructor(sprite: string = 'default', visible: boolean = true) {
    this.sprite = sprite;
    this.visible = visible;
  }
}

class AI {
  state: string = 'idle';
  target: Entity | null = null;
  
  constructor(state: string = 'idle', target: Entity | null = null) {
    this.state = state;
    this.target = target;
  }
}

/**
 * Benchmark function to measure execution time
 */
function benchmark(name: string, iterations: number, fn: () => void): void {
  console.log(`Running benchmark: ${name}`);
  
  // Warm up
  for (let i = 0; i < 5; i++) {
    fn();
  }
  
  // Measure
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  
  const totalTime = end - start;
  const avgTime = totalTime / iterations;
  
  console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`  Avg time per iteration: ${avgTime.toFixed(4)}ms`);
  console.log('');
}

/**
 * Run all benchmarks
 */
function runBenchmarks(): void {
  console.log('=== ECSManager Performance Benchmarks ===\n');
  
  // Setup
  const ENTITY_COUNT = 10000;
  const QUERY_ITERATIONS = 1000;
  
  // Create ECS instance
  const ecs = new ECSManager();
  
  // Benchmark entity creation
  benchmark('Entity Creation', ENTITY_COUNT, () => {
    ecs.createEntity();
  });
  
  // Create entities for component benchmarks
  const entities: Entity[] = [];
  for (let i = 0; i < ENTITY_COUNT; i++) {
    entities.push(ecs.createEntity());
  }
  
  // Benchmark component addition
  benchmark('Component Addition', ENTITY_COUNT, () => {
    const entity = entities[Math.floor(Math.random() * ENTITY_COUNT)];
    ecs.addComponent(entity, Position, new Position(Math.random() * 100, Math.random() * 100));
  });
  
  // Add components for query benchmarks
  for (let i = 0; i < ENTITY_COUNT; i++) {
    const entity = entities[i];
    
    // All entities have Position
    ecs.addComponent(entity, Position, new Position(Math.random() * 100, Math.random() * 100));
    
    // 70% have Velocity
    if (Math.random() < 0.7) {
      ecs.addComponent(entity, Velocity, new Velocity(Math.random() * 10 - 5, Math.random() * 10 - 5));
    }
    
    // 50% have Health
    if (Math.random() < 0.5) {
      ecs.addComponent(entity, Health, new Health(Math.random() * 100));
    }
    
    // 80% have Renderable
    if (Math.random() < 0.8) {
      ecs.addComponent(entity, Renderable, new Renderable());
    }
    
    // 30% have AI
    if (Math.random() < 0.3) {
      ecs.addComponent(entity, AI, new AI());
    }
  }
  
  // Benchmark component retrieval
  benchmark('Component Retrieval', ENTITY_COUNT, () => {
    const entity = entities[Math.floor(Math.random() * ENTITY_COUNT)];
    ecs.getComponent(entity, Position);
  });
  
  // Benchmark component check
  benchmark('Component Check (hasComponent)', ENTITY_COUNT, () => {
    const entity = entities[Math.floor(Math.random() * ENTITY_COUNT)];
    ecs.hasComponent(entity, Velocity);
  });
  
  // Define queries for benchmarks
  ecs.defineQuery('movable', ['Position', 'Velocity'], []);
  ecs.defineQuery('renderable', ['Position', 'Renderable'], []);
  ecs.defineQuery('aiControlled', ['AI', 'Position'], []);
  ecs.defineQuery('complex', ['Position', 'Velocity', 'Health'], ['AI']);
  
  // Benchmark query retrieval
  benchmark('Query Retrieval (simple)', QUERY_ITERATIONS, () => {
    ecs.getEntitiesWithQuery('movable');
  });
  
  benchmark('Query Retrieval (complex)', QUERY_ITERATIONS, () => {
    ecs.getEntitiesWithQuery('complex');
  });
  
  // Benchmark legacy vs optimized entity retrieval
  benchmark('Legacy getEntitiesWith', 100, () => {
    ecs.getEntitiesWith(Position);
  });
  
  benchmark('Optimized getEntitiesWithComponent', 100, () => {
    ecs.getEntitiesWithComponent('Position');
  });
  
  // Benchmark entity iteration with filtering (naive approach)
  benchmark('Naive Filtering (manual iteration)', 100, () => {
    const result: Entity[] = [];
    const allEntities = ecs.getAllEntities();
    
    for (const entity of allEntities) {
      if (ecs.hasComponent(entity, Position) && 
          ecs.hasComponent(entity, Velocity) && 
          ecs.hasComponent(entity, Health) && 
          !ecs.hasComponent(entity, AI)) {
        result.push(entity);
      }
    }
  });
  
  // Benchmark entity iteration with query (optimized approach)
  benchmark('Optimized Filtering (query-based)', 100, () => {
    ecs.getEntitiesWithQuery('complex');
  });
  
  console.log('=== Benchmarks Complete ===');
}

// Run the benchmarks
runBenchmarks();
