/**
 * Fragments implementation for component composition without extra DOM nodes
 * Inspired by React Fragments but custom-built for our framework
 */

/**
 * Fragment container class for grouping elements without adding extra DOM nodes
 */
export class Fragment {
  private children: (Node | string)[] = [];
  
  constructor(children: (Node | string)[]) {
    this.children = children;
  }
  
  /**
   * Append all children to a parent node
   */
  appendTo(parent: Node): void {
    for (const child of this.children) {
      if (typeof child === 'string') {
        parent.appendChild(document.createTextNode(child));
      } else if (child instanceof Fragment) {
        child.appendTo(parent);
      } else {
        parent.appendChild(child);
      }
    }
  }
  
  /**
   * Get all child nodes as an array
   */
  getNodes(): Node[] {
    const nodes: Node[] = [];
    
    for (const child of this.children) {
      if (typeof child === 'string') {
        nodes.push(document.createTextNode(child));
      } else if (child instanceof Fragment) {
        nodes.push(...child.getNodes());
      } else {
        nodes.push(child);
      }
    }
    
    return nodes;
  }
  
  /**
   * Remove all children from their parent nodes
   */
  remove(): void {
    for (const child of this.children) {
      if (typeof child !== 'string' && !(child instanceof Fragment)) {
        if (child.parentNode) {
          child.parentNode.removeChild(child);
        }
      } else if (child instanceof Fragment) {
        child.remove();
      }
    }
  }
}

/**
 * Create a fragment containing multiple child nodes
 * This avoids adding unnecessary wrapper elements to the DOM
 */
export function createFragment(children: (Node | string | Fragment)[]): Fragment {
  return new Fragment(children);
}

/**
 * JSX compatible createElement function that supports Fragments
 */
export function createElement(
  type: string | typeof Fragment,
  props: Record<string, any> | null,
  ...children: any[]
): HTMLElement | Fragment {
  if (type === Fragment) {
    return createFragment(children);
  }
  
  // Standard element creation for other types
  const element = document.createElement(type as string);
  
  // Apply properties
  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventType = key.substring(2).toLowerCase();
        element.addEventListener(eventType, value);
      } else {
        element.setAttribute(key, value);
      }
    });
  }
  
  // Append children
  children.forEach(child => {
    if (child instanceof Fragment) {
      child.appendTo(element);
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (child !== undefined && child !== null) {
      element.appendChild(document.createTextNode(String(child)));
    }
  });
  
  return element;
}
