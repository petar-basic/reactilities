import { useCallback, useEffect, useRef } from "react";

/**
 * Hook for throttling a callback function
 * Returns a stable throttled version of the callback that limits how often it can be called
 * Unlike useThrottle (which throttles values), this throttles the function call itself
 *
 * @param callback - The function to throttle
 * @param interval - Minimum time in milliseconds between invocations (default: 500ms)
 * @returns A throttled version of the callback
 *
 * @example
 * function InfiniteList() {
 *   const loadMore = useThrottleCallback(() => {
 *     fetchNextPage();
 *   }, 1000);
 *
 *   return <div onScroll={loadMore}>...</div>;
 * }
 *
 * @example
 * // Throttle window resize handler
 * const handleResize = useThrottleCallback(() => {
 *   recalculateLayout();
 * }, 200);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  interval = 500
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const lastCalledRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Update the ref on every render so the latest callback is always used
  callbackRef.current = callback;

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (lastCalledRef.current === null || now >= lastCalledRef.current + interval) {
        lastCalledRef.current = now;
        callbackRef.current(...args);
      } else {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          lastCalledRef.current = Date.now();
          callbackRef.current(...args);
        }, interval - (now - lastCalledRef.current));
      }
    },
    [interval]
  );
}
