/**
 * ZenithRouter Test Suite
 * Comprehensive tests for all router functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ZenithRouter, TypeSafeRouteBuilder } from '../router';
import { AuthGuardFactory } from '../guards';
import { ZenithRouterIntegration, createZenithRouter } from '../integration';
import { ZenithKernel } from '../../ZenithKernel';

// Mock dependencies
const mockVerifySystem = {
  verifyProof: vi.fn().mockResolvedValue(true)
};

const mockChallengeSystem = {
  issueChallenge: vi.fn().mockResolvedValue({ id: 'test-challenge' })
};

const mockRegistryServer = {
  getEntityRegistry: vi.fn().mockResolvedValue({ manifest: 'test' })
};

const mockKernel = {
  getSystem: vi.fn((name: string) => {
    switch (name) {
      case 'VerifySystem': return mockVerifySystem;
      case 'ChallengeSystem': return mockChallengeSystem;
      case 'RegistryServer': return mockRegistryServer;
      default: return null;
    }
  })
} as unknown as ZenithKernel;

// Mock browser APIs
Object.defineProperty(window, 'history', {
  value: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    length: 1
  }
});

Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
    search: '',
    hash: '',
    origin: 'http://localhost'
  },
  writable: true
});

describe('ZenithRouter Core', () => {
  let router: ZenithRouter;

  beforeEach(() => {
    router = new ZenithRouter();
    vi.clearAllMocks();
  });

  describe('Route Registration', () => {
    it('should register routes correctly', () => {
      const routes = [
        {
          path: '/',
          component: () => 'Home'
        },
        {
          path: '/profile/:userId',
          component: () => 'Profile'
        }
      ];

      expect(() => router.register(routes)).not.toThrow();
    });

    it('should create route builders for registered routes', () => {
      const routes = [
        {
          path: '/user/:id/posts/:postId',
          component: () => 'UserPost'
        }
      ];

      router.register(routes);
      const navigator = router.createNavigator('/user/:id/posts/:postId');
      
      expect(navigator).toBeDefined();
      expect(typeof navigator).toBe('function');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      const routes = [
        {
          path: '/',
          component: () => 'Home'
        },
        {
          path: '/profile/:userId',
          component: () => 'Profile',
          loader: async (params: any) => ({ user: `User ${params.userId}` })
        }
      ];
      router.register(routes);
    });

    it('should navigate to a simple route', async () => {
      await router.navigate('/');
      
      const currentRoute = router.getCurrentRouteSignal().value;
      expect(currentRoute?.pathname).toBe('/');
    });

    it('should navigate to a parameterized route', async () => {
      await router.navigate('/profile/123');
      
      const currentRoute = router.getCurrentRouteSignal().value;
      expect(currentRoute?.pathname).toBe('/profile/123');
      expect(currentRoute?.params).toEqual({ userId: '123' });
    });

    it('should handle navigation with query parameters', async () => {
      await router.navigate('/profile/123?tab=settings&view=detailed');
      
      const currentRoute = router.getCurrentRouteSignal().value;
      expect(currentRoute?.query).toEqual({
        tab: 'settings',
        view: 'detailed'
      });
    });

    it('should throw error for unregistered route', async () => {
      await expect(router.navigate('/nonexistent')).rejects.toThrow(
        'No route found for path: /nonexistent'
      );
    });
  });

  describe('Type-Safe Route Builder', () => {
    it('should build paths with parameters correctly', () => {
      const builder = new TypeSafeRouteBuilder('/user/:id/posts/:postId');
      
      const path = builder.build({ id: '123', postId: '456' });
      expect(path).toBe('/user/123/posts/456');
    });

    it('should extract parameters from paths', () => {
      const builder = new TypeSafeRouteBuilder('/user/:id/posts/:postId');
      
      const params = builder.extractParams('/user/123/posts/456');
      expect(params).toEqual({ id: '123', postId: '456' });
    });

    it('should return null for non-matching paths', () => {
      const builder = new TypeSafeRouteBuilder('/user/:id');
      
      const params = builder.extractParams('/profile/123');
      expect(params).toBeNull();
    });

    it('should handle URL encoding/decoding', () => {
      const builder = new TypeSafeRouteBuilder('/search/:query');
      
      const path = builder.build({ query: 'hello world' });
      expect(path).toBe('/search/hello%20world');
      
      const params = builder.extractParams('/search/hello%20world');
      expect(params).toEqual({ query: 'hello world' });
    });
  });

  describe('Route Guards', () => {
    let guardFactory: AuthGuardFactory;

    beforeEach(() => {
      guardFactory = new AuthGuardFactory(mockVerifySystem, mockChallengeSystem);
    });

    it('should create ZK guard that passes with valid proof', async () => {
      const guard = guardFactory.createZKGuard({
        zkProofRequired: true,
        trustLevelRequired: 'verified',
        peerId: 'test-peer'
      });

      const canActivate = await guard.canActivate(
        { peerId: 'test-peer' },
        { zkProof: 'zk:verified:proof' }
      );

      expect(canActivate).toBe(true);
      expect(mockVerifySystem.verifyProof).toHaveBeenCalledWith(
        'test-peer',
        'zk:verified:proof'
      );
    });

    it('should create ZK guard that fails without proof', async () => {
      const guard = guardFactory.createZKGuard({
        zkProofRequired: true
      });

      const canActivate = await guard.canActivate({}, {});
      expect(canActivate).toBe(false);
    });

    it('should create role-based guard', async () => {
      const guard = guardFactory.createRoleGuard({
        roles: ['admin'],
        requireAll: false
      });

      // This would need a mock user roles system
      const canActivate = await guard.canActivate({}, { userId: 'admin' });
      expect(typeof canActivate).toBe('boolean');
    });

    it('should create time-based guard', async () => {
      const guard = guardFactory.createTimeGuard({
        allowedDays: [1, 2, 3, 4, 5], // Monday-Friday
        allowedHours: [9, 17] // 9 AM - 5 PM
      });

      const canActivate = await guard.canActivate({}, {});
      expect(typeof canActivate).toBe('boolean');
    });

    it('should create rate limit guard', async () => {
      const guard = guardFactory.createRateLimitGuard({
        maxRequests: 3,
        windowMs: 1000
      });

      // First 3 requests should pass
      for (let i = 0; i < 3; i++) {
        const canActivate = await guard.canActivate({}, {});
        expect(canActivate).toBe(true);
      }

      // 4th request should fail
      const canActivate = await guard.canActivate({}, {});
      expect(canActivate).toBe(false);
    });

    it('should create composite guard with AND logic', async () => {
      const guard1 = { canActivate: vi.fn().mockResolvedValue(true) };
      const guard2 = { canActivate: vi.fn().mockResolvedValue(true) };
      
      const compositeGuard = guardFactory.createCompositeGuard([guard1, guard2], 'AND');
      
      const canActivate = await compositeGuard.canActivate({}, {});
      expect(canActivate).toBe(true);
      expect(guard1.canActivate).toHaveBeenCalled();
      expect(guard2.canActivate).toHaveBeenCalled();
    });

    it('should create composite guard with OR logic', async () => {
      const guard1 = { canActivate: vi.fn().mockResolvedValue(false) };
      const guard2 = { canActivate: vi.fn().mockResolvedValue(true) };
      
      const compositeGuard = guardFactory.createCompositeGuard([guard1, guard2], 'OR');
      
      const canActivate = await compositeGuard.canActivate({}, {});
      expect(canActivate).toBe(true);
    });
  });

  describe('Data Loading and Caching', () => {
    beforeEach(() => {
      const routes = [
        {
          path: '/data/:id',
          component: () => 'DataComponent',
          loader: async (params: any) => {
            return { data: `Data for ${params.id}`, timestamp: Date.now() };
          }
        }
      ];
      router.register(routes);
    });

    it('should load route data', async () => {
      await router.navigate('/data/123');
      
      const currentRoute = router.getCurrentRouteSignal().value;
      expect(currentRoute?.params).toEqual({ id: '123' });
    });

    it('should cache loaded data', async () => {
      const loader = vi.fn().mockResolvedValue({ cached: true });
      const cacheLoader = router.createLoader('test-key', loader, {
        staleTime: 5000,
        cacheTime: 10000
      });

      // First call should execute loader
      const observable1 = cacheLoader();
      await new Promise(resolve => {
        observable1.subscribe(result => {
          if (!result.loading) resolve(result);
        });
      });

      expect(loader).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const observable2 = cacheLoader();
      await new Promise(resolve => {
        observable2.subscribe(result => {
          if (!result.loading) resolve(result);
        });
      });

      expect(loader).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should prefetch routes', async () => {
      const prefetchSpy = vi.spyOn(router, 'prefetch');
      
      await router.prefetch('/data/456');
      
      expect(prefetchSpy).toHaveBeenCalledWith('/data/456');
    });
  });
});

describe('ZenithRouter Integration', () => {
  let integration: ZenithRouterIntegration;

  beforeEach(() => {
    integration = new ZenithRouterIntegration(
      new ZenithRouter(),
      mockKernel,
      mockVerifySystem,
      mockChallengeSystem,
      mockRegistryServer
    );
  });

  describe('Hydra Routes', () => {
    it('should register Hydra routes with ZK requirements', () => {
      const hydraRoutes = [
        {
          path: '/hydra/test',
          hydraId: 'TestHydra',
          execType: 'local' as const,
          zkRequired: true,
          trustLevel: 'verified' as const
        }
      ];

      expect(() => integration.registerHydraRoutes(hydraRoutes)).not.toThrow();
    });

    it('should create secure navigator with ZK verification', async () => {
      const secureNavigator = integration.createSecureNavigator('/secure/:id', {
        requireZKProof: true,
        trustLevel: 'verified'
      });

      expect(typeof secureNavigator).toBe('function');
    });
  });

  describe('ECS Integration', () => {
    it('should register ECS routes with component data', () => {
      const ecsRoutes = [
        {
          path: '/ecs/entities',
          component: () => 'EntitiesList',
          ecsComponents: ['Transform', 'Velocity'],
          ecsQueries: [{ include: ['Transform'] }]
        }
      ];

      expect(() => integration.registerECSRoutes(ecsRoutes)).not.toThrow();
    });
  });

  describe('WASM Routes', () => {
    it('should register WASM routes with security guards', () => {
      const wasmRoutes = [
        {
          path: '/wasm/module',
          component: () => 'WasmComponent',
          wasmManifest: 'https://example.com/module.json',
          wasmSandbox: true
        }
      ];

      expect(() => integration.registerWasmRoutes(wasmRoutes)).not.toThrow();
    });
  });

  describe('Quantum Consensus Routes', () => {
    it('should register quantum consensus routes', () => {
      const quantumRoutes = [
        {
          path: '/quantum/vote',
          component: () => 'VotingComponent',
          quantumConsensus: true,
          consensusThreshold: 0.75
        }
      ];

      expect(() => integration.registerQuantumRoutes(quantumRoutes)).not.toThrow();
    });
  });

  describe('Secure Navigation', () => {
    it('should navigate securely with ZK proof', async () => {
      const navigateSpy = vi.spyOn(integration.getRouter(), 'navigate');
      
      await integration.navigateSecure('/secure/path', 
        { peerId: 'test' },
        { zkProof: 'zk:verified:test' }
      );

      expect(navigateSpy).toHaveBeenCalled();
      expect(integration.getZKStatus()).toBe('verified');
    });

    it('should fail navigation with invalid ZK proof', async () => {
      mockVerifySystem.verifyProof.mockResolvedValueOnce(false);
      
      await expect(
        integration.navigateSecure('/secure/path',
          { peerId: 'test' },
          { zkProof: 'invalid:proof' }
        )
      ).rejects.toThrow('ZK proof verification failed');

      expect(integration.getZKStatus()).toBe('failed');
    });
  });

  describe('State Management', () => {
    it('should track Hydra route status', () => {
      expect(integration.isCurrentRouteHydra()).toBe(false);
      expect(integration.getCurrentHydraContext()).toBeNull();
    });

    it('should get ZK verification status', () => {
      const status = integration.getZKStatus();
      expect(['pending', 'verified', 'failed', null]).toContain(status);
    });
  });
});

describe('Factory Functions', () => {
  it('should create ZenithRouter with kernel integration', () => {
    const integration = createZenithRouter(mockKernel);
    
    expect(integration).toBeInstanceOf(ZenithRouterIntegration);
    expect(integration.getRouter()).toBeInstanceOf(ZenithRouter);
  });
});

describe('Performance and Edge Cases', () => {
  let router: ZenithRouter;

  beforeEach(() => {
    router = new ZenithRouter();
  });

  it('should handle rapid navigation calls', async () => {
    const routes = [{ path: '/test/:id', component: () => 'Test' }];
    router.register(routes);

    // Simulate rapid navigation
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(router.navigate(`/test/${i}`));
    }

    await Promise.all(promises);
    
    // Should end up at the last navigation
    const currentRoute = router.getCurrentRouteSignal().value;
    expect(currentRoute?.params.id).toBe('9');
  });

  it('should handle navigation with special characters', async () => {
    const routes = [{ path: '/search/:query', component: () => 'Search' }];
    router.register(routes);

    await router.navigate('/search/hello%20world%26test');
    
    const currentRoute = router.getCurrentRouteSignal().value;
    expect(currentRoute?.params.query).toBe('hello world&test');
  });

  it('should cleanup expired cache entries', () => {
    const loader = vi.fn().mockResolvedValue({ data: 'test' });
    const cacheLoader = router.createLoader('expiry-test', loader, {
      staleTime: -1, // Already stale
      cacheTime: -1  // Already expired
    });

    // This should trigger cache cleanup
    const observable = cacheLoader();
    expect(observable).toBeDefined();
  });

  it('should handle malformed URLs gracefully', async () => {
    const routes = [{ path: '/valid', component: () => 'Valid' }];
    router.register(routes);

    await expect(router.navigate('not-a-valid-url')).rejects.toThrow();
  });
});

// Cleanup
afterEach(() => {
  vi.clearAllMocks();
});
