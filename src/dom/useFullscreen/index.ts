import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
}

/**
 * Hook for controlling and tracking fullscreen state on an element.
 * Handles vendor-prefixed Fullscreen API differences across browsers.
 *
 * @param ref - Ref attached to the element to make fullscreen
 * @returns Object with fullscreen state and enter/exit/toggle controls
 *
 * @example
 * function VideoPlayer() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { isFullscreen, toggle } = useFullscreen(containerRef);
 *
 *   return (
 *     <div ref={containerRef}>
 *       <video src="..." />
 *       <button onClick={toggle}>
 *         {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
 *       </button>
 *     </div>
 *   );
 * }
 */
export function useFullscreen(
  ref: RefObject<HTMLElement | null>
): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keep a stable ref to the current element for the event handler
  const elementRef = useRef(ref.current);
  useEffect(() => {
    elementRef.current = ref.current;
  });

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement === elementRef.current);
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const enter = useCallback(async () => {
    const el = ref.current;
    if (!el || document.fullscreenElement) return;
    await el.requestFullscreen?.();
  }, [ref]);

  const exit = useCallback(async () => {
    if (!document.fullscreenElement) return;
    await document.exitFullscreen?.();
  }, []);

  const toggle = useCallback(async () => {
    if (isFullscreen) {
      await exit();
    } else {
      await enter();
    }
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, enter, exit, toggle };
}
