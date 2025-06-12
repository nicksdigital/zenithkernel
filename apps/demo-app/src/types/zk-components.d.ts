/**
 * Type declarations for ZenithKernel .zk components
 */

declare module '*.zk' {
  interface ZKComponent {
    template: string;
    props: Record<string, any>;
    mount: (element: HTMLElement) => void;
  }
  
  const component: (props?: Record<string, any>) => ZKComponent;
  export default component;
}

// Global ZK component types
declare global {
  interface Window {
    ZenithApp?: any;
    ZenithKernel?: any;
    ZenithRouter?: any;
  }
}

export {};
