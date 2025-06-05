/**
 * Portal implementation for rendering content outside the normal component tree
 * Useful for modals, tooltips, and other overlays
 */

/**
 * Portal container to render content outside the normal component tree
 */
export class Portal {
  private content: Node;
  private target: HTMLElement;
  private originalParent: Node | null = null;
  private mounted: boolean = false;
  
  /**
   * Create a new portal
   * @param content The content to render in the portal
   * @param target The target DOM element to render the portal into
   */
  constructor(content: Node, target: HTMLElement = document.body) {
    this.content = content;
    this.target = target;
  }
  
  /**
   * Mount the portal content to the target
   */
  mount(): void {
    if (this.mounted) return;
    
    this.originalParent = this.content.parentNode;
    this.target.appendChild(this.content);
    this.mounted = true;
    
    // Dispatch a custom event when portal is mounted
    const event = new CustomEvent('portal:mounted', {
      detail: { content: this.content, target: this.target }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Unmount the portal content from the target
   */
  unmount(): void {
    if (!this.mounted) return;
    
    if (this.content.parentNode === this.target) {
      this.target.removeChild(this.content);
    }
    
    this.mounted = false;
    
    // Dispatch a custom event when portal is unmounted
    const event = new CustomEvent('portal:unmounted', {
      detail: { content: this.content, target: this.target }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Change the portal target
   */
  setTarget(newTarget: HTMLElement): void {
    if (this.mounted) {
      this.unmount();
      this.target = newTarget;
      this.mount();
    } else {
      this.target = newTarget;
    }
  }
  
  /**
   * Update the portal content
   */
  setContent(newContent: Node): void {
    if (this.mounted) {
      this.target.replaceChild(newContent, this.content);
    }
    this.content = newContent;
  }
  
  /**
   * Check if portal is currently mounted
   */
  isMounted(): boolean {
    return this.mounted;
  }
  
  /**
   * Get the target element
   */
  getTarget(): HTMLElement {
    return this.target;
  }
  
  /**
   * Get the portal content
   */
  getContent(): Node {
    return this.content;
  }
}

/**
 * Create and mount a portal
 */
export function createPortal(content: Node, target: HTMLElement = document.body): Portal {
  const portal = new Portal(content, target);
  portal.mount();
  return portal;
}

/**
 * Get or create a portal container by ID
 */
export function getPortalContainer(id: string): HTMLElement {
  let container = document.getElementById(id);
  
  if (!container) {
    container = document.createElement('div');
    container.id = id;
    document.body.appendChild(container);
  }
  
  return container;
}
