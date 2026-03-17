import { useEffect, useRef, type DependencyList, type EffectCallback } from 'react';

/**
 * Like useEffect, but skips execution on the initial mount.
 * Only runs when dependencies change after the first render.
 *
 * @param effect - Effect callback (same as useEffect)
 * @param deps - Dependency array (same as useEffect)
 *
 * @example
 * // Won't fire on mount — only when `query` changes
 * useUpdateEffect(() => {
 *   fetchResults(query);
 * }, [query]);
 */
export function useUpdateEffect(effect: EffectCallback, deps?: DependencyList): void {
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    return effect();
    // deps are intentionally forwarded as-is
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
