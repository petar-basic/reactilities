import { useCallback, useRef, useSyncExternalStore } from 'react';

export interface ScrollPosition {
  /** Horizontal scroll position in pixels */
  x: number;
  /** Vertical scroll position in pixels */
  y: number;
}

const getServerSnapshot = (): ScrollPosition => ({ x: 0, y: 0 });

/**
 * Hook for tracking the window scroll position
 * Automatically updates on scroll with optimal performance via passive listener
 * Returns { x: 0, y: 0 } during SSR
 *
 * @returns Object containing current horizontal (x) and vertical (y) scroll position
 *
 * @example
 * // Show back-to-top button after scrolling down
 * function BackToTop() {
 *   const { y } = useScrollPosition();
 *
 *   if (y < 300) return null;
 *
 *   return (
 *     <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
 *       Back to top
 *     </button>
 *   );
 * }
 *
 * @example
 * // Sticky header with shadow on scroll
 * function Header() {
 *   const { y } = useScrollPosition();
 *   return (
 *     <header className={y > 0 ? 'header--scrolled' : ''}>
 *       Navigation
 *     </header>
 *   );
 * }
 *
 * @example
 * // Scroll progress indicator
 * function ReadingProgress() {
 *   const { y } = useScrollPosition();
 *   const docHeight = document.documentElement.scrollHeight - window.innerHeight;
 *   const progress = docHeight > 0 ? (y / docHeight) * 100 : 0;
 *
 *   return <div style={{ width: `${progress}%` }} className="progress-bar" />;
 * }
 */
export function useScrollPosition(): ScrollPosition {
  const cache = useRef<ScrollPosition>({ x: 0, y: 0 });

  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener('scroll', cb, { passive: true });
    return () => window.removeEventListener('scroll', cb);
  }, []);

  const getSnapshot = useCallback((): ScrollPosition => {
    const x = window.scrollX;
    const y = window.scrollY;
    if (cache.current.x !== x || cache.current.y !== y) {
      cache.current = { x, y };
    }
    return cache.current;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
