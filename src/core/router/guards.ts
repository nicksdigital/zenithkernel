/**
 * Router Guards - Advanced route protection and authentication
 * Integrates with ZenithKernel's security and ZKP systems
 */

import { RouteGuard, RouteParams, QueryParams } from '../router';
import { VerifySystem } from '../../modules/RegistryServer/VerifySystem';
import { ChallengeSystem } from '../../modules/RegistryServer/ChallengeSystem';

// Enhanced guard types
export interface ZKRouteGuard extends RouteGuard {
  zkProofRequired?: boolean;
  trustLevelRequired?: 'unverified' | 'local' | 'community' | 'verified';
  peerId?: string;
}

export interface RoleBasedGuard extends RouteGuard {
  roles: string[];
  requireAll?: boolean; // true = all roles required, false = any role
}

export interface TimeBasedGuard extends RouteGuard {
  startTime?: Date;
  endTime?: Date;
  allowedDays?: number[]; // 0-6, Sunday-Saturday
  allowedHours?: [number, number]; // [start, end] in 24h format
}

export interface RateLimitGuard extends RouteGuard {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

/**
 * Authentication Guard Factory
 */
export class AuthGuardFactory {
  private verifySystem: VerifySystem;
  private challengeSystem: ChallengeSystem;
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  constructor(verifySystem: VerifySystem, challengeSystem: ChallengeSystem) {
    this.verifySystem = verifySystem;
    this.challengeSystem = challengeSystem;
  }

  /**
   * Create ZK-proof based guard
   */
  createZKGuard(options: {
    zkProofRequired?: boolean;
    trustLevelRequired?: 'unverified' | 'local' | 'community' | 'verified';
    peerId?: string;
    redirectTo?: string;
  }): ZKRouteGuard {
    return {
      zkProofRequired: options.zkProofRequired ?? true,
      trustLevelRequired: options.trustLevelRequired ?? 'verified',
      peerId: options.peerId,
      redirectTo: options.redirectTo || '/auth',
      
      canActivate: async (params: RouteParams, query: QueryParams) => {
        const zkProof = query.zkProof as string;
        const peerId = options.peerId || query.peerId as string;

        if (!options.zkProofRequired) {
          return true;
        }

        if (!zkProof || !peerId) {
          return false;
        }

        try {
          const isValid = await this.verifySystem.verifyProof(peerId, zkProof);
          if (!isValid) {
            return false;
          }

          // Check trust level if required
          if (options.trustLevelRequired) {
            const trustLevel = this.getTrustLevel(zkProof);
            return this.compareTrustLevels(trustLevel, options.trustLevelRequired);
          }

          return true;
        } catch (error) {
          console.error('ZK verification failed:', error);
          return false;
        }
      },

      onFail: (params, query) => {
        console.warn('ZK guard failed for route:', params, query);
      }
    };
  }

  /**
   * Create role-based guard
   */
  createRoleGuard(options: {
    roles: string[];
    requireAll?: boolean;
    redirectTo?: string;
  }): RoleBasedGuard {
    return {
      roles: options.roles,
      requireAll: options.requireAll ?? false,
      redirectTo: options.redirectTo || '/unauthorized',

      canActivate: async (params: RouteParams, query: QueryParams) => {
        const userRoles = this.getUserRoles(query.userId as string);
        
        if (options.requireAll) {
          return options.roles.every(role => userRoles.includes(role));
        } else {
          return options.roles.some(role => userRoles.includes(role));
        }
      },

      onFail: (params, query) => {
        console.warn('Role guard failed. Required roles:', options.roles);
      }
    };
  }

  /**
   * Create time-based access guard
   */
  createTimeGuard(options: {
    startTime?: Date;
    endTime?: Date;
    allowedDays?: number[];
    allowedHours?: [number, number];
    redirectTo?: string;
  }): TimeBasedGuard {
    return {
      startTime: options.startTime,
      endTime: options.endTime,
      allowedDays: options.allowedDays,
      allowedHours: options.allowedHours,
      redirectTo: options.redirectTo || '/access-denied',

      canActivate: async () => {
        const now = new Date();

        // Check date range
        if (options.startTime && now < options.startTime) {
          return false;
        }
        if (options.endTime && now > options.endTime) {
          return false;
        }

        // Check allowed days
        if (options.allowedDays && !options.allowedDays.includes(now.getDay())) {
          return false;
        }

        // Check allowed hours
        if (options.allowedHours) {
          const hour = now.getHours();
          const [start, end] = options.allowedHours;
          if (hour < start || hour >= end) {
            return false;
          }
        }

        return true;
      },

      onFail: () => {
        console.warn('Time-based access denied');
      }
    };
  }

  /**
   * Create rate limiting guard
   */
  createRateLimitGuard(options: {
    maxRequests: number;
    windowMs: number;
    skipSuccessfulRequests?: boolean;
    keyGenerator?: (params: RouteParams, query: QueryParams) => string;
    redirectTo?: string;
  }): RateLimitGuard {
    return {
      maxRequests: options.maxRequests,
      windowMs: options.windowMs,
      skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
      redirectTo: options.redirectTo || '/rate-limited',

      canActivate: async (params: RouteParams, query: QueryParams) => {
        const key = options.keyGenerator 
          ? options.keyGenerator(params, query)
          : `${params.toString()}-${query.toString()}`;

        const now = Date.now();
        const record = this.rateLimitStore.get(key);

        if (!record || now > record.resetTime) {
          // Reset or create new record
          this.rateLimitStore.set(key, {
            count: 1,
            resetTime: now + options.windowMs
          });
          return true;
        }

        if (record.count >= options.maxRequests) {
          return false;
        }

        // Increment count
        record.count++;
        return true;
      },

      onFail: (params, query) => {
        console.warn('Rate limit exceeded for:', params, query);
      }
    };
  }

  /**
   * Create composite guard (combines multiple guards)
   */
  createCompositeGuard(guards: RouteGuard[], logic: 'AND' | 'OR' = 'AND'): RouteGuard {
    return {
      canActivate: async (params: RouteParams, query: QueryParams) => {
        if (logic === 'AND') {
          // All guards must pass
          for (const guard of guards) {
            const canActivate = await guard.canActivate(params, query);
            if (!canActivate) {
              guard.onFail?.(params, query);
              return false;
            }
          }
          return true;
        } else {
          // At least one guard must pass
          for (const guard of guards) {
            const canActivate = await guard.canActivate(params, query);
            if (canActivate) {
              return true;
            }
          }
          
          // All guards failed
          guards.forEach(guard => guard.onFail?.(params, query));
          return false;
        }
      },

      redirectTo: guards[0]?.redirectTo,
      
      onFail: (params, query) => {
        guards.forEach(guard => guard.onFail?.(params, query));
      }
    };
  }

  // Private helper methods

  private getTrustLevel(zkProof: string): 'unverified' | 'local' | 'community' | 'verified' {
    // Analyze ZK proof to determine trust level
    // This would integrate with the actual ZK system
    if (zkProof.startsWith('zk:verified:')) return 'verified';
    if (zkProof.startsWith('zk:community:')) return 'community';
    if (zkProof.startsWith('zk:local:')) return 'local';
    return 'unverified';
  }

  private compareTrustLevels(
    current: 'unverified' | 'local' | 'community' | 'verified',
    required: 'unverified' | 'local' | 'community' | 'verified'
  ): boolean {
    const levels = ['unverified', 'local', 'community', 'verified'];
    const currentLevel = levels.indexOf(current);
    const requiredLevel = levels.indexOf(required);
    return currentLevel >= requiredLevel;
  }

  private getUserRoles(userId?: string): string[] {
    // This would integrate with the actual user/role system
    if (!userId) return [];
    
    // Mock implementation
    const mockRoles = {
      'admin': ['admin', 'moderator', 'user'],
      'moderator': ['moderator', 'user'],
      'user': ['user']
    };

    return mockRoles[userId as keyof typeof mockRoles] || [];
  }
}

/**
 * Predefined common guards
 */
export const CommonGuards = {
  /**
   * Require authentication
   */
  requireAuth: (verifySystem: VerifySystem, challengeSystem: ChallengeSystem): RouteGuard => {
    const factory = new AuthGuardFactory(verifySystem, challengeSystem);
    return factory.createZKGuard({
      zkProofRequired: true,
      trustLevelRequired: 'local',
      redirectTo: '/login'
    });
  },

  /**
   * Require admin role
   */
  requireAdmin: (verifySystem: VerifySystem, challengeSystem: ChallengeSystem): RouteGuard => {
    const factory = new AuthGuardFactory(verifySystem, challengeSystem);
    return factory.createRoleGuard({
      roles: ['admin'],
      redirectTo: '/unauthorized'
    });
  },

  /**
   * Business hours only
   */
  businessHours: (): RouteGuard => {
    const factory = new AuthGuardFactory({} as any, {} as any);
    return factory.createTimeGuard({
      allowedDays: [1, 2, 3, 4, 5], // Monday-Friday
      allowedHours: [9, 17], // 9 AM - 5 PM
      redirectTo: '/outside-hours'
    });
  },

  /**
   * Rate limit to 100 requests per hour
   */
  rateLimited: (): RouteGuard => {
    const factory = new AuthGuardFactory({} as any, {} as any);
    return factory.createRateLimitGuard({
      maxRequests: 100,
      windowMs: 60 * 60 * 1000, // 1 hour
      redirectTo: '/rate-limited'
    });
  }
};

export default AuthGuardFactory;
