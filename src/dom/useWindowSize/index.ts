import { useCallback, useRef, useSyncExternalStore } from 'react';

export interface WindowSize {
  /** Current window inner width in pixels */
  width: number;
  /** Current window inner height in pixels */
  height: number;
}

const getServerSnapshot = (): WindowSize => ({ width: 0, height: 0 });

/**
 * Hook for tracking the browser window dimensions
 * Automatically updates on window resize with optimal performance
 * Returns { width: 0, height: 0 } during SSR
 *
 * @returns Object containing current window width and height in pixels
 *
 * @example
 * function ResponsiveComponent() {
 *   const { width, height } = useWindowSize();
 *
 *   return (
 *     <div>
 *       <p>Window: {width} x {height}</p>
 *       {width < 768 ? <MobileLayout /> : <DesktopLayout />}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Dynamic canvas sizing
 * function Canvas() {
 *   const { width, height } = useWindowSize();
 *   return <canvas width={width} height={height} />;
 * }
 *
 * @example
 * // Conditional rendering based on breakpoints
 * function Navigation() {
 *   const { width } = useWindowSize();
 *   const isMobile = width > 0 && width < 768;
 *   const isTablet = width >= 768 && width < 1024;
 *
 *   if (isMobile) return <HamburgerMenu />;
 *   if (isTablet) return <TabletNav />;
 *   return <DesktopNav />;
 * }
 */
export function useWindowSize(): WindowSize {
  const cache = useRef<WindowSize>({ width: 0, height: 0 });

  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener('resize', cb, { passive: true });
    return () => window.removeEventListener('resize', cb);
  }, []);

  const getSnapshot = useCallback((): WindowSize => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (cache.current.width !== width || cache.current.height !== height) {
      cache.current = { width, height };
    }
    return cache.current;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
