/**
 * types.ts
 * 
 * Common types for the Zenith framework
 */

import { ZenithKernel } from "./core/ZenithKernel";

export interface IZenithModule {
  id: string;
  onLoad: (kernel: ZenithKernel) => void;
  onUnload?: () => void;
}

export interface Message {
  type: string;
  payload: any;
}

export type Entity = number;