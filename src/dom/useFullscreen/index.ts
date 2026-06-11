import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

interface UseFullscreenReturn {
  isFullscreen: boolean;
  enter: () => Promise<void>;
  exit: () => Promise<void>;
  toggle: () => Promise<void>;
  isSupported: boolean;
}

/**
 * Element with the webkit-prefixed Fullscreen API (older desktop Safari).
 */
interface WebkitFullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

/**
 * Document with the webkit-prefixed Fullscreen API (older desktop Safari).
 */
interface WebkitFullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}

const FULLSCREEN_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'] as const;

/** Returns the element currently in fullscreen, falling back to the webkit-prefixed API. */
function getFullscreenElement(): Element | null {
  const doc = document as WebkitFullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/** Whether the Fullscreen API (standard or webkit-prefixed) is available in this environment. */
function detectSupport(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as WebkitFullscreenElement;
  return (
    typeof el.requestFullscreen === 'function' ||
    typeof el.webkitRequestFullscreen === 'function'
  );
}

/**
 * Hook for controlling and tracking fullscreen state on an element.
 * Handles vendor-prefixed Fullscreen API differences across browsers
 * (e.g. older desktop Safari's `webkit`-prefixed methods and events).
 *
 * @param ref - Ref attached to the element to make fullscreen
 * @returns Object with fullscreen state, enter/exit/toggle controls, and an `isSupported` flag
 *
 * @example
 * function VideoPlayer() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { isFullscreen, toggle, isSupported } = useFullscreen(containerRef);
 *
 *   if (!isSupported) return null;
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
  const [isSupported] = useState(detectSupport);

  // Keep a stable ref to the current element for the event handler
  const elementRef = useRef(ref.current);
  useEffect(() => {
    elementRef.current = ref.current;
  });

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(getFullscreenElement() === elementRef.current);
    };

    for (const event of FULLSCREEN_EVENTS) {
      document.addEventListener(event, handleChange);
    }
    return () => {
      for (const event of FULLSCREEN_EVENTS) {
        document.removeEventListener(event, handleChange);
      }
    };
  }, []);

  const enter = useCallback(async () => {
    const el = ref.current as WebkitFullscreenElement | null;
    if (!el || getFullscreenElement()) return;
    const request = el.requestFullscreen ?? el.webkitRequestFullscreen;
    await request?.call(el);
  }, [ref]);

  const exit = useCallback(async () => {
    if (!getFullscreenElement()) return;
    const doc = document as WebkitFullscreenDocument;
    const exitFn = doc.exitFullscreen ?? doc.webkitExitFullscreen;
    await exitFn?.call(doc);
  }, []);

  const toggle = useCallback(async () => {
    if (isFullscreen) {
      await exit();
    } else {
      await enter();
    }
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, enter, exit, toggle, isSupported };
}
