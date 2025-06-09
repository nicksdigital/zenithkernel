# Zenith Core ECS System

This directory contains the core Entity Component System (ECS) implementation for the Zenith framework.

## Overview

The ECS system has been optimized with data-oriented design principles inspired by high-performance ECS libraries like bitECS. The implementation focuses on:

1. **Performance**: Using TypedArrays and bitflags for efficient component storage and queries
2. **Memory Efficiency**: Entity ID recycling and sparse sets to minimize memory usage
3. **Flexibility**: Maintaining backward compatibility with the existing API
4. **Extensibility**: Supporting custom queries and serialization

## Key Components

### ECSManager

The main class that manages entities, components, and systems. It provides methods for:

- Creating and destroying entities
- Adding, removing, and retrieving components
- Defining and executing queries
- Managing systems

### Query System

The query system allows for efficient filtering of entities based on component requirements:

```typescript
// Define a query once
const movableQuery = ecs.defineQuery('movable', ['Position', 'Velocity'], ['Static']);

// Get matching entities efficiently in each update
const movableEntities = ecs.getEntitiesWithQuery('movable');
```

### Optimizations

1. **SparseSet**: Provides O(1) operations for entity management
2. **Bitflag Component Tracking**: Uses bitwise operations for fast component checks
3. **Entity ID Recycling**: Reuses entity IDs to prevent running out of IDs
4. **Query Caching**: Automatically updates entity-query relationships when components change

## Usage Examples

### Basic Entity and Component Operations

```typescript
// Create an entity
const entity = ecs.createEntity();

// Add components
ecs.addComponent(entity, Position, new Position(10, 20));
ecs.addComponent(entity, Velocity, new Velocity(5, 0));

// Get a component
const position = ecs.getComponent(entity, Position);
position.x += 10;

// Check if entity has a component
if (ecs.hasComponent(entity, Health)) {
  // Do something with health
}

// Remove a component
ecs.removeComponent(entity, Velocity);

// Destroy an entity
ecs.destroyEntity(entity);
```

### Using Queries

```typescript
// Define queries
ecs.defineQuery('movable', ['Position', 'Velocity'], []);
ecs.defineQuery('renderable', ['Position', 'Sprite'], []);
ecs.defineQuery('enemies', ['Enemy', 'Health'], ['Friendly']);

// Use queries in systems
function updateMovement() {
  const movableEntities = ecs.getEntitiesWithQuery('movable');
  
  for (const entity of movableEntities) {
    const position = ecs.getComponent(entity, Position);
    const velocity = ecs.getComponent(entity, Velocity);
    
    position.x += velocity.vx * deltaTime;
    position.y += velocity.vy * deltaTime;
  }
}

function renderEntities() {
  const renderableEntities = ecs.getEntitiesWithQuery('renderable');
  
  for (const entity of renderableEntities) {
    const position = ecs.getComponent(entity, Position);
    const sprite = ecs.getComponent(entity, Sprite);
    
    renderer.drawSprite(sprite.texture, position.x, position.y);
  }
}
```

### Performance Monitoring

```typescript
// Get performance statistics
const stats = ecs.getPerformanceStats();
console.log(`Entities: ${stats.entities}`);
console.log(`Component Types: ${stats.components}`);
console.log(`Queries: ${stats.queries}`);
console.log(`Recycled Entities: ${stats.recycledEntities}`);
```

## Testing

The ECS system includes comprehensive tests and benchmarks:

- Unit tests: `src/core/__tests__/ECSManager.test.ts`
- Performance benchmarks: `src/core/__tests__/ECSManager.benchmark.ts`

To run the benchmarks:

```bash
node src/core/__tests__/run-benchmarks.js
```

## Implementation Details

The optimized ECS implementation uses several advanced techniques:

1. **SparseSet**: A data structure that provides O(1) operations for add, remove, and has operations on sets of integers
2. **Bitflag Component Tracking**: Each component type is assigned a unique power-of-2 bitflag, allowing for efficient component checks using bitwise operations
3. **Query System**: Queries use bitwise operations to efficiently filter entities based on component requirements
4. **Entity ID Recycling**: Entity IDs are reused to prevent running out of IDs and to minimize memory fragmentation

## Future Improvements

Potential future improvements include:

1. **TypedArray Component Storage**: Storing component data in TypedArrays for even better cache locality
2. **Archetype-based Storage**: Grouping entities with the same component types together for better iteration performance
3. **Worker Thread Support**: Distributing ECS operations across multiple threads for parallel processing
4. **WebAssembly Integration**: Moving performance-critical parts to WebAssembly for even better performance
