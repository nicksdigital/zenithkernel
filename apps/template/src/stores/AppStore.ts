/**
 * App Store Example
 * 
 * Demonstrates global application state management
 */

import { createSignal, createEffect } from '@zenithcore/core';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AppState {
  theme: 'light' | 'dark';
  user: User | null;
  isLoading: boolean;
  notifications: Notification[];
  settings: Record<string, any>;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: Date;
  read: boolean;
}

export class AppStore {
  private themeSignal = createSignal<'light' | 'dark'>('light');
  private userSignal = createSignal<User | null>(null);
  private isLoadingSignal = createSignal(false);
  private notificationsSignal = createSignal<Notification[]>([]);
  private settingsSignal = createSignal<Record<string, any>>({});
  private subscribers = new Set<(state: AppState) => void>();

  // Getters for signals
  private theme = () => this.themeSignal[0]();
  private setTheme = (value: 'light' | 'dark') => this.themeSignal[1](value);
  private user = () => this.userSignal[0]();
  private setUser = (value: User | null) => this.userSignal[1](value);
  private isLoading = () => this.isLoadingSignal[0]();
  private setIsLoading = (value: boolean) => this.isLoadingSignal[1](value);
  private notifications = () => this.notificationsSignal[0]();
  private setNotifications = (value: Notification[]) => this.notificationsSignal[1](value);
  private settings = () => this.settingsSignal[0]();
  private setSettings = (value: Record<string, any>) => this.settingsSignal[1](value);

  constructor() {
    // Effect to persist theme to localStorage
    createEffect(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('zenith-theme', this.theme());
        document.documentElement.setAttribute('data-theme', this.theme());
      }
    });

    // Effect to notify subscribers on any state change
    createEffect(() => {
      this.notifySubscribers();
    });

    // Load persisted state
    this.loadPersistedState();
  }

  // Public getters
  getState(): AppState {
    return {
      theme: this.theme(),
      user: this.user(),
      isLoading: this.isLoading(),
      notifications: this.notifications(),
      settings: this.settings()
    };
  }

  // Theme actions
  updateTheme(newTheme: 'light' | 'dark'): void {
    this.setTheme(newTheme);
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'light' ? 'dark' : 'light');
  }

  // User actions
  updateUser(user: User | null): void {
    this.setUser(user);
    if (user) {
      this.addNotification({
        type: 'success',
        message: `Welcome back, ${user.name}!`
      });
    }
  }

  logout(): void {
    this.setUser(null);
    this.addNotification({
      type: 'info',
      message: 'You have been logged out'
    });
  }

  // Loading state
  setLoading(loading: boolean): void {
    this.setIsLoading(loading);
  }

  // Notifications
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false
    };

    this.setNotifications([...this.notifications(), newNotification]);

    // Auto-remove after 5 seconds for non-error notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, 5000);
    }
  }

  removeNotification(id: string): void {
    this.setNotifications(this.notifications().filter(n => n.id !== id));
  }

  markNotificationAsRead(id: string): void {
    this.setNotifications(
      this.notifications().map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    );
  }

  clearAllNotifications(): void {
    this.setNotifications([]);
  }

  // Settings
  updateSetting(key: string, value: any): void {
    this.setSettings({
      ...this.settings(),
      [key]: value
    });
  }

  updateSettings(newSettings: Record<string, any>): void {
    this.setSettings({
      ...this.settings(),
      ...newSettings
    });
  }

  // Computed values
  get unreadNotifications(): Notification[] {
    return this.notifications().filter(n => !n.read);
  }

  get unreadCount(): number {
    return this.unreadNotifications.length;
  }

  get isAuthenticated(): boolean {
    return this.user() !== null;
  }

  // Subscription management
  subscribe(callback: (state: AppState) => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    const state = this.getState();
    this.subscribers.forEach(callback => callback(state));
  }

  // Persistence
  private loadPersistedState(): void {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('zenith-theme') as 'light' | 'dark';
      if (savedTheme) {
        this.setTheme(savedTheme);
      }

      const savedSettings = localStorage.getItem('zenith-settings');
      if (savedSettings) {
        try {
          this.setSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.warn('Failed to parse saved settings');
        }
      }
    }
  }

  // Reset store
  reset(): void {
    this.setTheme('light');
    this.setUser(null);
    this.setIsLoading(false);
    this.setNotifications([]);
    this.setSettings({});
  }
}
