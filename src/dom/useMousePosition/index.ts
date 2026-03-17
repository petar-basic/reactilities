import { useEffect, useState } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

/**
 * Hook that tracks the current mouse cursor position within the viewport.
 *
 * @returns Object with current cursor x and y coordinates (both 0 on SSR)
 *
 * @example
 * const { x, y } = useMousePosition();
 *
 * return (
 *   <div
 *     style={{
 *       position: 'fixed',
 *       left: x + 16,
 *       top: y + 16,
 *       pointerEvents: 'none',
 *     }}
 *   >
 *     Custom cursor
 *   </div>
 * );
 */
export function useMousePosition(): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return position;
}
