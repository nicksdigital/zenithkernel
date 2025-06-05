// Virtual JSX runtime for SSR (ZenithKernel)
// Returns virtual nodes for use with renderToString

export type VirtualNode = {
  type: string | ((props: any) => VirtualNode | string);
  props: Record<string, any>;
};

export function jsx(type: any, props: Record<string, any> = {}): VirtualNode {
  return { type, props };
}

export const jsxs = jsx;

export const Fragment = 'Fragment'; 