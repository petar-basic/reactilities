import { useCallback, useRef, useSyncExternalStore } from "react";

type OrientationType = 'portrait' | 'landscape';

interface UseOrientationReturn {
  orientation: OrientationType;
  angle: number;
}

const SERVER_SNAPSHOT: UseOrientationReturn = { orientation: 'portrait', angle: 0 };

function readOrientation(): UseOrientationReturn {
  // Prefer the Screen Orientation API's semantic type — it is correct on every
  // device regardless of the device's natural orientation (e.g. desktop monitors
  // and many tablets are landscape-natural and report angle 0 while landscape).
  const screenOrientation = screen.orientation;
  if (screenOrientation) {
    const angle = screenOrientation.angle ?? 0;
    if (typeof screenOrientation.type === 'string') {
      const orientation: OrientationType = screenOrientation.type.startsWith('landscape')
        ? 'landscape'
        : 'portrait';
      return { orientation, angle: Number(angle) };
    }
    // Screen Orientation API present but no type string — fall back to matchMedia.
    if (typeof window.matchMedia === 'function') {
      const orientation: OrientationType = window.matchMedia('(orientation: landscape)').matches
        ? 'landscape'
        : 'portrait';
      return { orientation, angle: Number(angle) };
    }
    return { orientation: 'portrait', angle: Number(angle) };
  }

  // No Screen Orientation API — prefer matchMedia for correct landscape detection.
  if (typeof window.matchMedia === 'function') {
    const legacyAngle = (window as Window & { orientation?: number }).orientation ?? 0;
    const orientation: OrientationType = window.matchMedia('(orientation: landscape)').matches
      ? 'landscape'
      : 'portrait';
    return { orientation, angle: Number(legacyAngle) };
  }

  // Legacy fallback: derive from the deprecated window.orientation angle heuristic.
  const legacyAngle = (window as Window & { orientation?: number }).orientation ?? 0;
  const orientation: OrientationType = Math.abs(Number(legacyAngle)) === 90 ? 'landscape' : 'portrait';
  return { orientation, angle: Number(legacyAngle) };
}

/**
 * SSR / server snapshot. Returns a stable, sensible default and never throws,
 * guaranteeing a consistent first render and no hydration mismatch.
 */
export const getServerSnapshot = (): UseOrientationReturn => SERVER_SNAPSHOT;

/**
 * Hook for tracking device screen orientation
 * Returns whether the device is in portrait or landscape mode and the rotation angle
 * Backed by `useSyncExternalStore` so it is SSR-safe (no hydration mismatch) and tear-free
 * under concurrent rendering.
 *
 * Orientation type is derived from `screen.orientation.type` when available, falling back to
 * `matchMedia('(orientation: landscape)')`, and finally the legacy `window.orientation` angle
 * heuristic. This is correct on landscape-natural devices (desktops, many tablets) and for
 * landscape-secondary (angle 270 / -90), where the old `Math.abs(angle) === 90` check failed.
 *
 * Subscribes to both `screen.orientation` 'change' and the legacy window 'orientationchange'
 * event (plus the matchMedia change event) for maximum browser compatibility.
 *
 * @returns Object with semantic orientation type ('portrait' | 'landscape') and angle in degrees
 *
 * @example
 * function MobileLayout() {
 *   const { orientation } = useOrientation();
 *
 *   return (
 *     <div className={orientation === 'landscape' ? 'layout-horizontal' : 'layout-vertical'}>
 *       {orientation === 'landscape' ? <SideBySideView /> : <StackedView />}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Show a rotation prompt for landscape-only content
 * const { orientation } = useOrientation();
 *
 * if (orientation === 'portrait') {
 *   return <p>Please rotate your device</p>;
 * }
 */
export function useOrientation(): UseOrientationReturn {
  const cache = useRef<UseOrientationReturn>(SERVER_SNAPSHOT);

  const subscribe = useCallback((cb: () => void) => {
    const screenOrientation = screen.orientation;
    const mql = typeof window.matchMedia === 'function'
      ? window.matchMedia('(orientation: landscape)')
      : null;

    if (screenOrientation) {
      screenOrientation.addEventListener('change', cb);
    }
    window.addEventListener('orientationchange', cb);
    if (mql) {
      // Older Safari only supports the deprecated MediaQueryList.addListener.
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', cb);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(cb);
      }
    }

    return () => {
      if (screenOrientation) {
        screenOrientation.removeEventListener('change', cb);
      }
      window.removeEventListener('orientationchange', cb);
      if (mql) {
        if (typeof mql.removeEventListener === 'function') {
          mql.removeEventListener('change', cb);
        } else if (typeof mql.removeListener === 'function') {
          mql.removeListener(cb);
        }
      }
    };
  }, []);

  const getSnapshot = useCallback((): UseOrientationReturn => {
    const next = readOrientation();
    // Keep a stable reference when nothing changed so useSyncExternalStore
    // does not trigger an extra re-render (and stays tear-free).
    if (
      cache.current.orientation !== next.orientation ||
      cache.current.angle !== next.angle
    ) {
      cache.current = next;
    }
    return cache.current;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
