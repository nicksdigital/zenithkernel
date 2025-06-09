/**
 * ZenithRouter Usage Examples
 * Demonstrates advanced features and integration patterns
 */

import React from 'react';
import {
  ZenithRouter,
  RouterProvider,
  RouterOutlet,
  Link,
  NavLink,
  createZenithRouter,
  RouteEnhancer,
  CommonGuards
} from '../index';
import { ZenithKernel } from '../../ZenithKernel';

// Example 1: Basic Setup with ZenithKernel Integration
export function setupBasicRouter() {
  const kernel = new ZenithKernel();
  const routerIntegration = createZenithRouter(kernel);
  const router = routerIntegration.getRouter();

  // Define routes
  const routes = [
    {
      path: '/',
      component: () => import('./components/Home'),
      meta: { title: 'Home' }
    },
    {
      path: '/profile/:userId',
      component: () => import('./components/Profile'),
      loader: async (params: any) => {
        return { user: await fetchUser(params.userId) };
      },
      guards: [CommonGuards.requireAuth(
        kernel.getSystem('VerifySystem'),
        kernel.getSystem('ChallengeSystem')
      )]
    },
    {
      path: '/admin',
      component: () => import('./components/Admin'),
      guards: [
        CommonGuards.requireAdmin(
          kernel.getSystem('VerifySystem'),
          kernel.getSystem('ChallengeSystem')
        ),
        CommonGuards.businessHours()
      ]
    }
  ];

  router.register(routes);
  return routerIntegration;
}

// Example 2: Hydra-Integrated Routes
export function setupHydraRouter() {
  const kernel = new ZenithKernel();
  const routerIntegration = createZenithRouter(kernel);

  // Register Hydra routes with ZK verification
  routerIntegration.registerHydraRoutes([
    {
      path: '/hydra/dashboard',
      hydraId: 'HydraDashboard',
      execType: 'local',
      zkRequired: true,
      trustLevel: 'verified',
      meta: {
        title: 'Hydra Dashboard',
        requiresAuth: true
      }
    },
    {
      path: '/hydra/trust/:peerId',
      hydraId: 'HydraTrustBar',
      execType: 'edge',
      zkRequired: true,
      trustLevel: 'community',
      meta: {
        title: 'Trust Visualization'
      }
    }
  ]);

  return routerIntegration;
}

// Example 3: ECS-Integrated Routes
export function setupECSRouter() {
  const kernel = new ZenithKernel();
  const routerIntegration = createZenithRouter(kernel);

  // Register routes with ECS data integration
  routerIntegration.registerECSRoutes([
    {
      path: '/entities',
      component: () => import('./components/EntityList'),
      ecsComponents: ['Transform', 'Velocity', 'Health'],
      ecsQueries: [
        { include: ['Transform', 'Velocity'] },
        { include: ['Health'], exclude: ['Dead'] }
      ]
    },
    {
      path: '/systems',
      component: () => import('./components/SystemMonitor'),
      ecsComponents: ['SystemStats', 'Performance']
    }
  ]);

  return routerIntegration;
}

// Example 4: WASM Routes with Security
export function setupWasmRouter() {
  const kernel = new ZenithKernel();
  const routerIntegration = createZenithRouter(kernel);

  // Register WASM routes with sandbox security
  routerIntegration.registerWasmRoutes([
    {
      path: '/wasm/calculator',
      wasmManifest: 'https://cdn.zenith.dev/wasm/calculator.json',
      wasmSandbox: true,
      meta: {
        title: 'WASM Calculator',
        description: 'Secure calculator running in WASM sandbox'
      }
    },
    {
      path: '/wasm/quantum/:algorithm',
      wasmManifest: 'https://cdn.zenith.dev/wasm/quantum.json',
      wasmSandbox: true,
      guards: [
        CommonGuards.requireAuth(
          kernel.getSystem('VerifySystem'),
          kernel.getSystem('ChallengeSystem')
        )
      ]
    }
  ]);

  return routerIntegration;
}

// Example 5: Quantum Consensus Routes
export function setupQuantumRouter() {
  const kernel = new ZenithKernel();
  const routerIntegration = createZenithRouter(kernel);

  // Register routes requiring quantum consensus
  routerIntegration.registerQuantumRoutes([
    {
      path: '/consensus/vote/:proposalId',
      component: () => import('./components/VotingInterface'),
      quantumConsensus: true,
      consensusThreshold: 0.75,
      meta: {
        title: 'Quantum Voting',
        description: 'Decentralized voting with quantum consensus'
      }
    },
    {
      path: '/consensus/governance',
      component: () => import('./components/GovernanceDashboard'),
      quantumConsensus: true,
      consensusThreshold: 0.66
    }
  ]);

  return routerIntegration;
}

// Example 6: React App Component with Advanced Features
export function ExampleApp() {
  const kernel = new ZenithKernel();
  const routerIntegration = setupBasicRouter();
  const router = routerIntegration.getRouter();

  return (
    <RouterProvider 
      router={router}
      fallback={<div className="loading">🌊 Loading ZenithKernel...</div>}
      errorBoundary={(error, retry) => (
        <div className="error-boundary">
          <h2>🚨 Navigation Error</h2>
          <p>{error.message}</p>
          <button onClick={retry}>Retry Navigation</button>
        </div>
      )}
    >
      <div className="app">
        {/* Navigation */}
        <nav className="navbar">
          <Link to="/" className="logo">ZenithKernel</Link>
          
          <div className="nav-links">
            <NavLink to="/" end activeClassName="active">
              Home
            </NavLink>
            <NavLink to="/profile" activeClassName="active">
              Profile
            </NavLink>
            <NavLink to="/admin" activeClassName="active">
              Admin
            </NavLink>
            <NavLink to="/hydra/dashboard" activeClassName="active">
              Hydra Dashboard
            </NavLink>
          </div>
        </nav>

        {/* Main content */}
        <main className="content">
          <RouterOutlet 
            fallback={<div className="route-loading">Loading route...</div>}
            onRouteChange={(route) => {
              console.log('Route changed:', route.path);
              // Update page title
              document.title = route.meta?.title || 'ZenithKernel';
            }}
            onLoadError={(error) => {
              console.error('Route load error:', error);
            }}
          />
        </main>

        {/* ZK Status Indicator */}
        <ZKStatusIndicator integration={routerIntegration} />
      </div>
    </RouterProvider>
  );
}

// Example 7: ZK Status Indicator Component
function ZKStatusIndicator({ integration }: { integration: any }) {
  const zkStatus = integration.getZKStatus();
  const isHydraRoute = integration.isCurrentRouteHydra();

  if (!isHydraRoute) return null;

  return (
    <div className={`zk-status zk-status--${zkStatus || 'none'}`}>
      <div className="zk-indicator">
        {zkStatus === 'pending' && '🔄 Verifying ZK Proof...'}
        {zkStatus === 'verified' && '✅ ZK Verified'}
        {zkStatus === 'failed' && '❌ ZK Verification Failed'}
        {!zkStatus && '⚪ No ZK Required'}
      </div>
    </div>
  );
}

// Example 8: Type-Safe Navigation Hooks
export function useTypeSafeNavigation() {
  const kernel = new ZenithKernel();
  const routerIntegration = createZenithRouter(kernel);
  const router = routerIntegration.getRouter();

  // Create type-safe navigators
  const navigateToProfile = router.createNavigator('/profile/:userId');
  const navigateToHydra = router.createNavigator('/hydra/trust/:peerId');
  
  return {
    // Type-safe navigation with parameter validation
    goToProfile: (userId: string) => 
      navigateToProfile({ userId }),
    
    // Secure navigation with ZK verification
    goToHydraSecure: (peerId: string, zkProof: string) =>
      routerIntegration.navigateSecure('/hydra/trust/:peerId', 
        { peerId }, 
        { zkProof, trustLevel: 'verified' }
      ),
    
    // Navigation with ECS context
    goToEntities: () =>
      router.navigate('/entities'),
    
    // Prefetch for performance
    prefetchProfile: (userId: string) =>
      router.prefetch(`/profile/${userId}`)
  };
}

// Example 9: Enhanced Route Component with Decorators
class ExampleRouteController {
  @RouteEnhancer({
    zkRequired: true,
    trustLevel: 'verified',
    ecsComponents: ['UserProfile', 'TrustScore'],
    quantumConsensus: true
  })
  async loadSecureProfile(params: any, query: any) {
    // This method automatically gets:
    // - ZK proof validation
    // - ECS component data injection
    // - Quantum consensus verification
    
    return {
      profile: await this.fetchUserProfile(params.userId),
      trustData: params.ecs.TrustScore,
      zkVerified: params.zkVerified,
      consensus: params.quantumConsensus
    };
  }

  private async fetchUserProfile(userId: string) {
    // Implementation here
    return { id: userId, name: 'Quantum User' };
  }
}

// Example 10: Advanced Middleware Usage
export function setupAdvancedMiddleware() {
  const kernel = new ZenithKernel();
  const routerIntegration = createZenithRouter(kernel);
  const middleware = new RouterMiddleware(routerIntegration);

  // Chain multiple middleware
  const enhancedLoader = (
    originalLoader: any,
    ...middlewares: Array<(params: any, query: any, next: Function) => any>
  ) => {
    return async (params: any, query: any) => {
      let result = { params, query };
      
      // Apply middleware chain
      for (const mw of middlewares) {
        result = await mw(result.params, result.query, 
          (p: any, q: any) => ({ params: p, query: q })
        );
      }
      
      // Call original loader with enhanced context
      return originalLoader(result.params, result.query);
    };
  };

  // Example route with multiple middleware
  const routes = [
    {
      path: '/advanced/:id',
      component: () => import('./components/AdvancedComponent'),
      loader: enhancedLoader(
        async (params: any) => ({ data: `Advanced data for ${params.id}` }),
        middleware.zkValidationMiddleware(true),
        middleware.ecsStateMiddleware(),
        middleware.hydraContextMiddleware(),
        middleware.quantumConsensusMiddleware(0.75)
      )
    }
  ];

  routerIntegration.getRouter().register(routes);
  return routerIntegration;
}

// Helper function for examples
async function fetchUser(userId: string) {
  // Mock implementation
  return {
    id: userId,
    name: `User ${userId}`,
    trustLevel: 'verified',
    zkProof: `zk:verified:${userId}`
  };
}

export default {
  setupBasicRouter,
  setupHydraRouter,
  setupECSRouter,
  setupWasmRouter,
  setupQuantumRouter,
  ExampleApp,
  useTypeSafeNavigation,
  setupAdvancedMiddleware
};
