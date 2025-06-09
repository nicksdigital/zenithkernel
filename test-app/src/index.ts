/**
 * ZenithKernel Test App
 * 
 * This is a simple test application demonstrating the core features
 * of ZenithKernel, including routing, ECS components, and island hydration.
 */

import { ZenithKernel, createZenithRouter, RouteDefinition } from './lib/core';
import { TestSystem, UserSystem } from './systems';
import { CounterComponent, serializeCounter, deserializeCounter } from './components';

// Initialize the kernel
async function bootstrapTestApp() {
  console.log('🚀 Starting ZenithKernel Test App...');

  // Create a new kernel instance
  const kernel = new ZenithKernel();
  
  // Register custom systems
  kernel.registerSystem('TestSystem', new TestSystem(kernel));
  kernel.registerSystem('UserSystem', new UserSystem(kernel));

  // Initialize ECS components
  const ecs = kernel.getECS();
  ecs.registerComponentType('Counter', CounterComponent, serializeCounter, deserializeCounter);
  
  // Create a router
  const router = createZenithRouter(kernel);
  
  // Define routes
  const routes = [
    {
      path: '/',
      component: () => {
        console.log('Home route activated');
        return { title: 'Home' };
      }
    },
    {
      path: '/users/:userId',
      component: (params: { userId: string }) => {
        console.log(`User profile route activated for: ${params.userId}`);
        return { title: `User Profile - ${params.userId}` };
      },
      // Add ZK verification requirement
      zkRequired: true,
      trustLevel: 'local'
    },
    {
      path: '/counter',
      component: () => {
        console.log('Counter route activated');
        
        // Create an entity with a Counter component
        const entity = ecs.createEntity();
        const counterComponent = new CounterComponent(0);
        ecs.addComponent(entity, CounterComponent, counterComponent);
        
        return { 
          title: 'Counter Demo',
          entityId: entity
        };
      },
      // Use ECS components
      // Use Counter component
      components: ['Counter']
    }
  ];
  
  // Register routes
  router.register(routes);
  
  // Initialize the kernel
  await kernel.initialize();
  
  // Start the main loop
  kernel.startLoop();
  
  console.log('✅ ZenithKernel Test App initialized successfully!');
  
  // Make kernel and router available globally for testing
  if (typeof window !== 'undefined') {
    (window as any).ZenithKernel = kernel;
    (window as any).ZenithRouter = router;
    
    // Navigate to home route
    router.navigate('/');
  }
  
  return { kernel, router };
}

// Start the test app
bootstrapTestApp().catch(error => {
  console.error('❌ Failed to initialize test app:', error);
});

export { bootstrapTestApp };
