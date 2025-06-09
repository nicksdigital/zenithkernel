/**
 * UserSystem
 * 
 * A system that manages user entities and authentication in the test app.
 */

import { BaseSystem, ZenithKernel } from '../lib/core';

// User data interface
interface UserData {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'guest';
  lastActive: number;
  zkProof?: string;
}

export class UserSystem extends BaseSystem {
  private users: Map<string, UserData> = new Map();
  private currentUser: string | null = null;
  
  constructor(kernel: ZenithKernel) {
    super(kernel);
    console.log('UserSystem: Created');
  }
  
  /**
   * Called when the system is loaded
   */
  onLoad(): void {
    console.log('UserSystem: Loaded');
    
    // Register message handlers
    this.kernel.registerMessageHandler('user:login', this.handleLogin.bind(this));
    this.kernel.registerMessageHandler('user:logout', this.handleLogout.bind(this));
    this.kernel.registerMessageHandler('user:register', this.handleRegister.bind(this));
    this.kernel.registerMessageHandler('user:verify', this.handleVerify.bind(this));
    
    // Create some demo users
    this.createDemoUsers();
  }
  
  /**
   * Called when the system is unloaded
   */
  onUnload(): void {
    console.log('UserSystem: Unloaded');
    this.users.clear();
    this.currentUser = null;
  }
  
  /**
   * Called on each update tick
   */
  update(deltaTime: number): void {
    // Update last active timestamp for current user if any
    if (this.currentUser) {
      const user = this.users.get(this.currentUser);
      if (user) {
        user.lastActive = Date.now();
      }
    }
  }
  
  /**
   * Create demo users for testing
   */
  private createDemoUsers(): void {
    this.users.set('user1', {
      id: 'user1',
      username: 'admin',
      role: 'admin',
      lastActive: Date.now(),
      zkProof: 'zk:verified:admin-proof-123'
    });
    
    this.users.set('user2', {
      id: 'user2',
      username: 'testuser',
      role: 'user',
      lastActive: Date.now(),
      zkProof: 'zk:local:user-proof-456'
    });
    
    this.users.set('user3', {
      id: 'user3',
      username: 'guest',
      role: 'guest',
      lastActive: Date.now()
    });
    
    console.log('UserSystem: Created demo users');
  }
  
  /**
   * Handle login message
   */
  private handleLogin(message: any): void {
    const { username, password } = message;
    
    // Find user by username (in a real app, we'd validate password)
    let foundUserId: string | null = null;
    
    this.users.forEach((user) => {
      if (user.username === username) {
        foundUserId = user.id;
      }
    });
    
    if (foundUserId) {
      this.currentUser = foundUserId;
      const user = this.users.get(foundUserId)!;
      
      console.log(`UserSystem: User ${username} logged in`);
      
      // Send login success response
      this.kernel.send('user:login:success', {
        type: 'user:login:success',
        payload: {
          userId: user.id,
          username: user.username,
          role: user.role,
          zkProof: user.zkProof
        }
      });
    } else {
      console.log(`UserSystem: Login failed for ${username}`);
      
      // Send login failure response
      this.kernel.send('user:login:failure', {
        type: 'user:login:failure',
        payload: {
          error: 'Invalid username or password'
        }
      });
    }
  }
  
  /**
   * Handle logout message
   */
  private handleLogout(message: any): void {
    if (this.currentUser) {
      const user = this.users.get(this.currentUser);
      console.log(`UserSystem: User ${user?.username} logged out`);
      this.currentUser = null;
      
      // Send logout success response
      this.kernel.send('user:logout:success', {
        type: 'user:logout:success',
        payload: {}
      });
    }
  }
  
  /**
   * Handle register message
   */
  private handleRegister(message: any): void {
    const { username, role = 'user' } = message;
    
    // Check if username is already taken
    let usernameTaken = false;
    this.users.forEach((user) => {
      if (user.username === username) {
        usernameTaken = true;
      }
    });
    
    if (usernameTaken) {
      console.log(`UserSystem: Registration failed. Username ${username} already taken`);
      
      // Send registration failure response
      this.kernel.send('user:register:failure', {
        type: 'user:register:failure',
        payload: {
          error: 'Username already taken'
        }
      });
      return;
    }
    
    // Create new user
    const userId = `user${Date.now()}`;
    const userData: UserData = {
      id: userId,
      username,
      role: role as 'admin' | 'user' | 'guest',
      lastActive: Date.now()
    };
    
    this.users.set(userId, userData);
    console.log(`UserSystem: Registered new user ${username} with ID ${userId}`);
    
    // Send registration success response
    this.kernel.send('user:register:success', {
      type: 'user:register:success',
      payload: {
        userId,
        username
      }
    });
  }
  
  /**
   * Handle verify message
   */
  private handleVerify(message: any): void {
    const { userId, proof } = message;
    
    const user = this.users.get(userId);
    if (!user) {
      console.log(`UserSystem: Verification failed. User ${userId} not found`);
      
      // Send verification failure response
      this.kernel.send('user:verify:failure', {
        type: 'user:verify:failure',
        payload: {
          error: 'User not found'
        }
      });
      return;
    }
    
    // In a real app, we would verify the ZK proof
    // Here we just assign it
    user.zkProof = proof;
    console.log(`UserSystem: Assigned ZK proof to user ${user.username}`);
    
    // Send verification success response
    this.kernel.send('user:verify:success', {
      type: 'user:verify:success',
      payload: {
        userId,
        username: user.username,
        zkProof: user.zkProof
      }
    });
  }
  
  /**
   * Get the current user
   */
  getCurrentUser(): UserData | null {
    if (!this.currentUser) return null;
    return this.users.get(this.currentUser) || null;
  }
  
  /**
   * Get user by ID
   */
  getUserById(userId: string): UserData | null {
    return this.users.get(userId) || null;
  }
  
  /**
   * Get all users (for admin purposes)
   */
  getAllUsers(): UserData[] {
    return Array.from(this.users.values());
  }
  
  /**
   * Check if a user has a valid ZK proof
   */
  hasValidZkProof(userId: string): boolean {
    const user = this.users.get(userId);
    return !!(user && user.zkProof);
  }
  
  /**
   * Get the trust level of a user based on their ZK proof
   */
  getUserTrustLevel(userId: string): 'unverified' | 'local' | 'community' | 'verified' {
    const user = this.users.get(userId);
    if (!user || !user.zkProof) return 'unverified';
    
    if (user.zkProof.startsWith('zk:verified:')) return 'verified';
    if (user.zkProof.startsWith('zk:community:')) return 'community';
    if (user.zkProof.startsWith('zk:local:')) return 'local';
    return 'unverified';
  }
}
