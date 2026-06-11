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
  const isFirst = useRef(true);

  // Reset the first-render flag in a mount-scoped cleanup so that React 18+
  // StrictMode's simulated unmount/remount restores the initial state. Without
  // this, StrictMode's mount sequence (effect → cleanup → effect) would mark
  // the hook as already-mounted on the first pass and then fire `effect()` on
  // the second pass — running on mount, the exact thing this hook prevents.
  useEffect(
    () => () => {
      isFirst.current = true;
    },
    [],
  );

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    return effect();
    // deps are intentionally forwarded as-is
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
