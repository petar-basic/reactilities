import { useEffect, useRef, useState } from "react";

/**
 * Hook for throttling rapidly changing values
 * Limits the rate at which the returned value can update
 * Useful for scroll events, resize handlers, and performance optimization
 * 
 * @param value - The value to throttle
 * @param interval - Minimum time in milliseconds between updates (default: 500ms)
 * @returns The throttled value
 * 
 * @example
 * function ScrollTracker() {
 *   const [scrollY, setScrollY] = useState(0);
 *   const throttledScrollY = useThrottle(scrollY, 100);
 * 
 *   useEffect(() => {
 *     const handleScroll = () => setScrollY(window.scrollY);
 *     window.addEventListener('scroll', handleScroll);
 *     return () => window.removeEventListener('scroll', handleScroll);
 *   }, []);
 * 
 *   return <div>Scroll position: {throttledScrollY}px</div>;
 * }
 * 
 * // Mouse position tracking
 * const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
 * const throttledMousePos = useThrottle(mousePos, 50);
 */
export function useThrottle<T>(value: T, interval = 500): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdated = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();

    if (lastUpdated.current && now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const id = setTimeout(() => {
        lastUpdated.current = now;
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(id);
    }
  }, [value, interval]);

  return throttledValue;
}