import { useEffect, useState } from "react";

type OrientationType = 'portrait' | 'landscape';

interface UseOrientationReturn {
  orientation: OrientationType;
  angle: number;
}

function getOrientation(): UseOrientationReturn {
  if (typeof window === 'undefined') {
    return { orientation: 'portrait', angle: 0 };
  }

  const angle = screen.orientation?.angle ?? (window as Window & { orientation?: number }).orientation ?? 0;
  const orientation: OrientationType = Math.abs(Number(angle)) === 90 ? 'landscape' : 'portrait';

  return { orientation, angle: Number(angle) };
}

/**
 * Hook for tracking device screen orientation
 * Returns whether the device is in portrait or landscape mode and the rotation angle
 * Registers both screen.orientation 'change' and window 'orientationchange' for maximum browser compatibility:
 * modern browsers use the Screen Orientation API; legacy iOS Safari uses window.orientationchange
 * Useful for adapting layouts in mobile-first or PWA applications
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
  const [state, setState] = useState<UseOrientationReturn>(getOrientation);

  useEffect(() => {
    const handleChange = () => setState(getOrientation());

    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleChange);
    }

    window.addEventListener('orientationchange', handleChange);

    return () => {
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', handleChange);
      }
      window.removeEventListener('orientationchange', handleChange);
    };
  }, []);

  return state;
}
