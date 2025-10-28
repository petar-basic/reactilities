import { useCallback, useSyncExternalStore } from "react";

/**
 * Predefined media query constants for common breakpoints
 * Based on Bootstrap-like responsive design patterns
 */
export const MEDIA_QUERIES = {
    IS_SMALL_DEVICE: 'only screen and (max-width : 768px)',
    IS_MEDIUM_DEVICE: 'only screen and (min-width : 769px) and (max-width : 992px)',
    IS_LARGE_DEVICE: 'only screen and (min-width : 993px) and (max-width : 1200px)',
    IS_LARGER_DEVICE: 'only screen and (min-width : 993px)',
    IS_EXTRA_LARGE_DEVICE: 'only screen and (min-width : 1201px)'
}

/**
 * Hook for responsive design using CSS media queries
 * Returns boolean indicating if the media query currently matches
 * Uses useSyncExternalStore for optimal performance and SSR safety
 * 
 * @param query - CSS media query string to evaluate
 * @returns Boolean indicating if the media query matches
 * 
 * @example
 * // Using predefined queries
 * const isMobile = useMediaQuery(MEDIA_QUERIES.IS_SMALL_DEVICE);
 * const isDesktop = useMediaQuery(MEDIA_QUERIES.IS_LARGER_DEVICE);
 * 
 * // Custom queries
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 * const isLandscape = useMediaQuery('(orientation: landscape)');
 * const isHighDPI = useMediaQuery('(min-resolution: 2dppx)');
 * 
 * // Conditional rendering
 * return (
 *   <div>
 *     {isMobile ? <MobileNav /> : <DesktopNav />}
 *     {isDarkMode && <DarkModeStyles />}
 *   </div>
 * );
 */
export default function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const matchMedia = window.matchMedia(query);

      matchMedia.addEventListener("change", cb);
      return () => {
        matchMedia.removeEventListener("change", cb);
      };
    },
    [query]
  );

  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => {
    throw Error("useMediaQuery is a client-only hook");
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}