import { useCallback, useEffect, useRef } from 'react';

interface UseLongPressOptions {
  /** Duration in ms before the long press fires (default: 500) */
  threshold?: number;
  /** Called immediately on press start */
  onStart?: (event: React.PointerEvent) => void;
  /** Called when press ends before threshold (a regular click) */
  onCancel?: (event: React.PointerEvent) => void;
}

interface UseLongPressHandlers {
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerLeave: (event: React.PointerEvent) => void;
}

/**
 * Hook that detects a long press (hold) on any element.
 * Returns pointer event handlers to spread onto any element.
 *
 * @param callback - Function called when the long press threshold is reached
 * @param options - Threshold duration and optional start/cancel callbacks
 * @returns Event handlers object to spread on the target element
 *
 * @example
 * const handlers = useLongPress(() => openContextMenu(), { threshold: 600 });
 *
 * return <button {...handlers}>Hold me</button>;
 *
 * @example
 * // With start/cancel feedback
 * const handlers = useLongPress(onLongPress, {
 *   onStart: () => setPressed(true),
 *   onCancel: () => setPressed(false),
 * });
 */
export function useLongPress(
  callback: (event: React.PointerEvent) => void,
  { threshold = 500, onStart, onCancel }: UseLongPressOptions = {}
): UseLongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const start = useCallback(
    (event: React.PointerEvent) => {
      // Clear any pending timer so a second pointerdown (e.g. a two-finger
      // touch or touch+pen) doesn't orphan the first timeout. Otherwise the
      // first timer id would be overwritten and leak: `cancel` clears only the
      // latest, so the orphaned timer would still fire after release.
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      onStart?.(event);
      const captured = event;
      timerRef.current = setTimeout(() => {
        callbackRef.current(captured);
        timerRef.current = null;
      }, threshold);
    },
    [threshold, onStart]
  );

  const cancel = useCallback(
    (event: React.PointerEvent) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        onCancel?.(event);
      }
    },
    [onCancel]
  );

  // Clear a pending timer on unmount so a long press in flight doesn't fire its
  // callback (and run setState) on an unmounted component with a stale event.
  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    },
    []
  );

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
  };
}
