import { useEffectEvent, useEffect, type RefObject } from "react";

/**
 * Hook for adding event listeners to DOM elements with automatic cleanup
 * Handles both ref objects and direct element references safely
 * 
 * @param target - RefObject pointing to the target HTML element
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
 * // With options
 * useEventListener(scrollRef, 'scroll', handleScroll, { passive: true });
 */
export default function useEventListener(
  target: RefObject<HTMLElement>, 
  eventName: string, 
  handler: (event: Event) => void, 
  options?: AddEventListenerOptions
): void {
  const onEvent = useEffectEvent(handler);

  useEffect(() => {
    const targetElement = target.current ?? target;

    if (!targetElement?.addEventListener) return;

    targetElement.addEventListener(eventName, onEvent, options);

    return () => {
      targetElement.removeEventListener(eventName, onEvent, options);
    };
  }, [target, eventName, options, onEvent]);
}