import { getECS } from "../../../modules/Rendering/utils/kernel-access";
import { RouterComponent } from "../components/RouterComponent";

/**
 * Saves the current scroll position for the current route
 */
export function saveScrollPosition(): void {
  if (typeof window === 'undefined') return;
  
  const ecs = getECS();
  if (!ecs) return;
  
  const routerComponents = ecs.getEntitiesWith(RouterComponent);
  if (routerComponents.length === 0) return;
  
  const [entity, router] = routerComponents[0];
  const currentPath = window.location.pathname;
  
  router.lastPosition.set(currentPath, {
    x: window.scrollX,
    y: window.scrollY
  });
}

/**
 * Restores the scroll position for a given route
 */
export function restoreScrollPosition(path: string): void {
  if (typeof window === 'undefined') return;
  
  const ecs = getECS();
  if (!ecs) return;
  
  const routerComponents = ecs.getEntitiesWith(RouterComponent);
  if (routerComponents.length === 0) return;
  
  const [entity, router] = routerComponents[0];
  
  // Check if we have a saved position for this route
  const position = router.lastPosition.get(path);
  if (position) {
    // Use requestAnimationFrame to ensure the DOM has updated
    requestAnimationFrame(() => {
      window.scrollTo(position.x, position.y);
    });
  } else {
    // Default to scrolling to top
    window.scrollTo(0, 0);
  }
}

/**
 * Sets up automatic scroll restoration
 */
export function setupScrollRestoration(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  // Save position before navigating away
  const saveHandler = () => {
    saveScrollPosition();
  };
  
  window.addEventListener('popstate', saveHandler);
  
  // When navigation occurs, restore scroll position
  const ecs = getECS();
  if (ecs) {
    const navigationHandler = (event: any) => {
      restoreScrollPosition(event.path);
    };
    
    ecs.on('navigation', navigationHandler);
    
    return () => {
      window.removeEventListener('popstate', saveHandler);
      ecs.off('navigation', navigationHandler);
    };
  }
  
  return () => {
    window.removeEventListener('popstate', saveHandler);
  };
}
