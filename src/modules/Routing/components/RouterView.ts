import { jsx } from "../../../modules/Rendering";
import { currentRouteSignal } from "../index";
import { RouteErrorBoundaryComponent } from "./RouteErrorBoundaryComponent";
import { getECS } from "../../../modules/Rendering/utils/kernel-access";

interface RouterViewProps {
  // Optional fallback component when route is not found
  notFound?: any;
}

/**
 * Component that renders the current route's component
 */
export function RouterView(props: RouterViewProps) {
  const { notFound } = props;
  
  // Check if we have a current route
  const currentRoute = currentRouteSignal?.value;
  if (!currentRoute) {
    return notFound 
      ? jsx(notFound, {})
      : jsx('div', {}, 'Route not found');
  }
  
  // Get the component to render
  const Component = currentRoute.route.component;
  if (!Component) {
    return jsx('div', {}, 'No component defined for this route');
  }
  
  // Check for errors in this route
  const ecs = getECS();
  if (ecs) {
    const errorBoundaries = ecs.getEntitiesWith(RouteErrorBoundaryComponent);
    for (const [entity, errorBoundary] of errorBoundaries) {
      if (errorBoundary.routeErrors.has(currentRoute.route.path)) {
        const error = errorBoundary.routeErrors.get(currentRoute.route.path)!;
        const fallback = errorBoundary.getFallback(currentRoute.route.path);
        return fallback(error);
      }
    }
  }
  
  // Render the component, passing route data as props
  return jsx(Component, {
    route: currentRoute.route,
    params: currentRoute.params,
    search: currentRoute.search
  });
}
