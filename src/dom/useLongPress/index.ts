import { useCallback, useRef } from 'react';

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

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
  };
}
