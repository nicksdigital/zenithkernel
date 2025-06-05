import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ECSManager, Entity, Query } from '../ECSManager';

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
  
  constructor(value: number = 100) {
    this.value = value;
  }
}

class Static {
  immovable: boolean = true;
}

describe('ECSManager', () => {
  let ecs: ECSManager;
  
  beforeEach(() => {
    ecs = new ECSManager();
  });
  
  describe('Basic Entity Operations', () => {
    it('should create entities with unique IDs', () => {
      const entity1 = ecs.createEntity();
      const entity2 = ecs.createEntity();
      
      expect(entity1).not.toBe(entity2);
      expect(ecs.getEntityCount()).toBe(2);
    });
    
    it('should destroy entities', () => {
      const entity = ecs.createEntity();
      ecs.destroyEntity(entity);
      
      expect(ecs.getEntityCount()).toBe(0);
      expect(ecs.getAllEntities().length).toBe(0);
    });
    
    it('should recycle entity IDs', () => {
      const entity1 = ecs.createEntity();
      ecs.destroyEntity(entity1);
      const entity2 = ecs.createEntity();
      
      expect(entity2).toBe(entity1); // ID should be recycled
    });
  });
  
  describe('Component Operations', () => {
    it('should add components to entities', () => {
      const entity = ecs.createEntity();
      ecs.addComponent(entity, Position, new Position(10, 20));
      
      expect(ecs.hasComponent(entity, Position)).toBe(true);
    });
    
    it('should get components from entities', () => {
      const entity = ecs.createEntity();
      const position = new Position(10, 20);
      ecs.addComponent(entity, Position, position);
      
      const retrievedPosition = ecs.getComponent(entity, Position);
      expect(retrievedPosition).toBeDefined();
      expect(retrievedPosition?.x).toBe(10);
      expect(retrievedPosition?.y).toBe(20);
    });
    
    it('should remove components from entities', () => {
      const entity = ecs.createEntity();
      ecs.addComponent(entity, Position, new Position(10, 20));
      ecs.removeComponent(entity, Position);
      
      expect(ecs.hasComponent(entity, Position)).toBe(false);
    });
    
    it('should get all components on an entity', () => {
      const entity = ecs.createEntity();
      ecs.addComponent(entity, Position, new Position());
      ecs.addComponent(entity, Velocity, new Velocity());
      
      const components = ecs.getEntityComponents(entity);
      expect(components).toContain('Position');
      expect(components).toContain('Velocity');
      expect(components.length).toBe(2);
    });
  });
  
  describe('Query System', () => {
    it('should define queries', () => {
      const query = ecs.defineQuery('movable', ['Position', 'Velocity'], ['Static']);
      
      expect(query).toBeDefined();
      expect(query.id).toBe('movable');
      expect(query.required).toContain('Position');
      expect(query.required).toContain('Velocity');
      expect(query.excluded).toContain('Static');
    });
    
    it('should get entities matching a query', () => {
      // Create entities
      const movable1 = ecs.createEntity();
      ecs.addComponent(movable1, Position, new Position());
      ecs.addComponent(movable1, Velocity, new Velocity());
      
      const movable2 = ecs.createEntity();
      ecs.addComponent(movable2, Position, new Position());
      ecs.addComponent(movable2, Velocity, new Velocity());
      
      const static1 = ecs.createEntity();
      ecs.addComponent(static1, Position, new Position());
      ecs.addComponent(static1, Static, new Static());
      
      // Define query
      ecs.defineQuery('movable', ['Position', 'Velocity'], ['Static']);
      
      // Get matching entities
      const movableEntities = ecs.getEntitiesWithQuery('movable');
      
      expect(movableEntities).toContain(movable1);
      expect(movableEntities).toContain(movable2);
      expect(movableEntities).not.toContain(static1);
      expect(movableEntities.length).toBe(2);
    });
    
    it('should update queries when components change', () => {
      // Create entity
      const entity = ecs.createEntity();
      ecs.addComponent(entity, Position, new Position());
      
      // Define query
      ecs.defineQuery('movable', ['Position', 'Velocity'], []);
      
      // Initially, entity doesn't match
      let movableEntities = ecs.getEntitiesWithQuery('movable');
      expect(movableEntities).not.toContain(entity);
      
      // Add velocity component
      ecs.addComponent(entity, Velocity, new Velocity());
      
      // Now entity should match
      movableEntities = ecs.getEntitiesWithQuery('movable');
      expect(movableEntities).toContain(entity);
      
      // Remove velocity component
      ecs.removeComponent(entity, Velocity);
      
      // Entity should no longer match
      movableEntities = ecs.getEntitiesWithQuery('movable');
      expect(movableEntities).not.toContain(entity);
    });
    
    it('should get entities with a specific component', () => {
      // Create entities
      const entity1 = ecs.createEntity();
      ecs.addComponent(entity1, Position, new Position());
      
      const entity2 = ecs.createEntity();
      ecs.addComponent(entity2, Position, new Position());
      ecs.addComponent(entity2, Velocity, new Velocity());
      
      const entity3 = ecs.createEntity();
      ecs.addComponent(entity3, Velocity, new Velocity());
      
      // Get entities with Position
      const entitiesWithPosition = ecs.getEntitiesWithComponent('Position');
      
      expect(entitiesWithPosition).toContain(entity1);
      expect(entitiesWithPosition).toContain(entity2);
      expect(entitiesWithPosition).not.toContain(entity3);
      expect(entitiesWithPosition.length).toBe(2);
    });
  });
  
  describe('Performance Optimizations', () => {
    it('should track performance statistics', () => {
      // Create entities and components
      for (let i = 0; i < 10; i++) {
        const entity = ecs.createEntity();
        ecs.addComponent(entity, Position, new Position());
        
        if (i % 2 === 0) {
          ecs.addComponent(entity, Velocity, new Velocity());
        }
        
        if (i % 3 === 0) {
          ecs.addComponent(entity, Health, new Health());
        }
      }
      
      // Define some queries
      ecs.defineQuery('movable', ['Position', 'Velocity'], []);
      ecs.defineQuery('living', ['Health'], []);
      
      // Get performance stats
      const stats = ecs.getPerformanceStats();
      
      expect(stats.entities).toBe(10);
      expect(stats.components).toBe(3); // Position, Velocity, Health
      expect(stats.queries).toBe(2); // movable, living
      expect(stats.recycledEntities).toBe(0);
    });
    
    it('should recycle entity IDs for better performance', () => {
      // Create and destroy entities
      const entities: Entity[] = [];
      for (let i = 0; i < 10; i++) {
        entities.push(ecs.createEntity());
      }
      
      // Destroy half of them
      for (let i = 0; i < 5; i++) {
        ecs.destroyEntity(entities[i]);
      }
      
      // Create new entities
      const newEntities: Entity[] = [];
      for (let i = 0; i < 5; i++) {
        newEntities.push(ecs.createEntity());
      }
      
      // Get performance stats
      const stats = ecs.getPerformanceStats();
      
      expect(stats.entities).toBe(10); // 5 original + 5 new
      expect(stats.recycledEntities).toBe(0); // All recycled IDs were used
      
      // The new entities should reuse the IDs of the destroyed entities
      for (let i = 0; i < 5; i++) {
        expect(newEntities).toContain(entities[i]);
      }
    });
  });
  
  describe('Backward Compatibility', () => {
    it('should work with legacy getEntitiesWith method', () => {
      // Create entities
      const entity1 = ecs.createEntity();
      ecs.addComponent(entity1, Position, new Position(1, 1));
      
      const entity2 = ecs.createEntity();
      ecs.addComponent(entity2, Position, new Position(2, 2));
      
      // Use legacy method
      const entitiesWithPosition = ecs.getEntitiesWith(Position);
      
      expect(entitiesWithPosition.length).toBe(2);
      
      // Check entity-component pairs
      const pair1 = entitiesWithPosition.find(pair => pair[0] === entity1);
      const pair2 = entitiesWithPosition.find(pair => pair[0] === entity2);
      
      expect(pair1).toBeDefined();
      expect(pair1![1].x).toBe(1);
      expect(pair1![1].y).toBe(1);
      
      expect(pair2).toBeDefined();
      expect(pair2![1].x).toBe(2);
      expect(pair2![1].y).toBe(2);
    });
  });
});
