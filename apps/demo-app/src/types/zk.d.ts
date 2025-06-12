/**
 * Type declarations for ZenithKernel .zk Single File Components
 */

declare module '*.zk' {
  import { Signal, ComputedSignal } from '@core/signals';
  
  interface ZKComponent {
    name: string;
    signals?: Record<string, Signal<any>>;
    computed?: Record<string, ComputedSignal<any>>;
    methods?: Record<string, (...args: any[]) => any>;
    mounted?(): void;
    unmounted?(): void;
    template?: string;
    script?: string;
    styles?: string;
  }
  
  const component: ZKComponent;
  export default component;
  
  // Also export any named exports from the script section
  export * from '*.ts';
}

// Global type augmentations for ZK components
declare global {
  interface Window {
    __ZK_COMPONENTS__?: Map<string, any>;
    __ZK_DEV_MODE__?: boolean;
  }
}

export {};
