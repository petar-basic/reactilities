import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a stable function that returns true while the component is mounted.
 * Use it to guard async callbacks against setting state after unmount.
 *
 * @returns Function that returns current mounted status
 *
 * @example
 * function MyComponent() {
 *   const isMounted = useIsMounted();
 *
 *   useEffect(() => {
 *     fetchData().then((data) => {
 *       if (isMounted()) setState(data);
 *     });
 *   }, []);
 * }
 */
export function useIsMounted(): () => boolean {
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
}
