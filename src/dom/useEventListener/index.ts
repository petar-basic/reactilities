import { useEffect, useRef, type RefObject } from "react";

/**
 * Hook for adding event listeners to DOM elements with automatic cleanup
 * Accepts either a RefObject or a direct element reference
 * Handler updates are applied without re-registering the listener
 *
 * @param target - RefObject pointing to the target element, or a direct element/null reference
 * @param eventName - Name of the event to listen for (e.g., 'click', 'scroll')
 * @param handler - Event handler function to execute when event fires
 * @param options - Optional event listener options (capture, passive, once, etc.)
 *
 * @example
 * const buttonRef = useRef<HTMLButtonElement>(null);
 *
 * useEventListener(buttonRef, 'click', (event) => {
 *   console.log('Button clicked!', event);
 * });
 *
 * @example
 * // With options
 * useEventListener(scrollRef, 'scroll', handleScroll, { passive: true });
 *
 * @example
 * // Always use a stable options reference (useMemo or module-level const)
 * // to avoid re-registering the listener on every render
 * const options = useMemo(() => ({ passive: true }), []);
 * useEventListener(ref, 'scroll', handleScroll, options);
 */
export function useEventListener(
  target: RefObject<HTMLElement | null> | HTMLElement | null,
  eventName: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
): void {
  const handlerRef = useRef(handler);

  // Keep handlerRef current on every render so the listener always calls
  // the latest handler without needing to re-register
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const el = target && 'current' in target ? target.current : target;
    if (!el?.addEventListener) return;

    const listener = (event: Event) => handlerRef.current(event);
    el.addEventListener(eventName, listener, options);

    return () => el.removeEventListener(eventName, listener, options);
  }, [target, eventName, options]);
}
