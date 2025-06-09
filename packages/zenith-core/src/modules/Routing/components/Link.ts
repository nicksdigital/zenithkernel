import { jsx } from "../../../modules/Rendering";
import { navigate, prefetch } from "../index";

interface LinkProps {
  to: string;
  children: any;
  replace?: boolean;
  prefetch?: boolean;
  className?: string;
  activeClassName?: string;
  style?: Record<string, any>;
  [key: string]: any;
}

/**
 * A specialized link component that uses the router for navigation
 */
export function Link(props: LinkProps) {
  const { 
    to, 
    children, 
    replace = false, 
    prefetch: shouldPrefetch = false,
    className = '',
    activeClassName = '',
    style = {},
    ...rest 
  } = props;
  
  // Prevent normal link behavior and use router navigation
  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    navigate(to, { replace });
  };
  
  // Handle prefetching when mouse hovers over link
  const handleMouseEnter = () => {
    if (shouldPrefetch) {
      prefetch(to);
    }
  };
  
  // Determine if the link is for the active route
  const isActive = () => {
    if (typeof window === 'undefined') return false;
    
    const currentPath = window.location.pathname;
    return currentPath === to || 
          (activeClassName && currentPath.startsWith(`${to}/`));
  };
  
  // Combine classes including active class if applicable
  const combinedClassName = isActive() 
    ? `${className} ${activeClassName}`.trim() 
    : className;
  
  return jsx(
    'a',
    {
      href: to,
      onClick: handleClick,
      onMouseEnter: handleMouseEnter,
      className: combinedClassName,
      style,
      ...rest
    },
    children
  );
}
