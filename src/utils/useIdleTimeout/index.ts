import { useCallback, useEffect, useRef, useState } from "react";

// Stable default — defined at module level so it never changes reference
const DEFAULT_EVENTS = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll', 'click'];

interface UseIdleTimeoutOptions {
  timeout: number;
  events?: string[];
  onIdle?: () => void;
  onActive?: () => void;
}

interface UseIdleTimeoutReturn {
  isIdle: boolean;
  reset: () => void;
}

/**
 * Hook for detecting user inactivity after a specified timeout
 * Resets automatically on any user interaction (mouse, keyboard, touch, scroll)
 * Useful for session expiry warnings, auto-logout, screen dimming, and auto-save triggers
 *
 * @param options.timeout - Time in milliseconds of inactivity before considered idle
 * @param options.events - DOM events that count as activity (defaults to mouse/keyboard/touch/scroll).
 *   Must be a stable reference — define it outside the component or wrap with useMemo.
 *   Changing this array after mount has no effect.
 * @param options.onIdle - Callback fired when user becomes idle
 * @param options.onActive - Callback fired when user returns from idle
 * @returns Object with current idle state and a manual reset function
 *
 * @example
 * function App() {
 *   const { isIdle } = useIdleTimeout({
 *     timeout: 5 * 60 * 1000, // 5 minutes
 *     onIdle: () => showSessionWarning(),
 *     onActive: () => hideSessionWarning()
 *   });
 *
 *   return <div>{isIdle ? 'Idle' : 'Active'}</div>;
 * }
 *
 * @example
 * // Auto-logout after 10 minutes of inactivity
 * const { isIdle } = useIdleTimeout({
 *   timeout: 10 * 60 * 1000,
 *   onIdle: () => logout()
 * });
 */
export function useIdleTimeout({
  timeout,
  events = DEFAULT_EVENTS,
  onIdle,
  onActive
}: UseIdleTimeoutOptions): UseIdleTimeoutReturn {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isIdleRef = useRef(false);
  const onIdleRef = useRef(onIdle);
  const onActiveRef = useRef(onActive);

  onIdleRef.current = onIdle;
  onActiveRef.current = onActive;

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);

    if (isIdleRef.current) {
      isIdleRef.current = false;
      setIsIdle(false);
      onActiveRef.current?.();
    }

    timerRef.current = setTimeout(() => {
      isIdleRef.current = true;
      setIsIdle(true);
      onIdleRef.current?.();
    }, timeout);
  }, [timeout]);

  useEffect(() => {
    events.forEach(event => document.addEventListener(event, reset, { passive: true }));
    reset();

    return () => {
      events.forEach(event => document.removeEventListener(event, reset));
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset]);

  return { isIdle, reset };
}
