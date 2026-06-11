import { useEffect, useRef, type RefObject } from "react";

/**
 * Possible targets for {@link useEventListener}: a RefObject, a direct
 * element, `window`, `document`, or `null`/`undefined` (no-op until present).
 */
type EventTarget =
  | RefObject<HTMLElement | null>
  | HTMLElement
  | Window
  | Document
  | null
  | undefined;

/**
 * Maps a target to its corresponding DOM event map so the `event` argument of
 * the handler is typed correctly per target + event name.
 */
type EventMapFor<T extends EventTarget> = T extends RefObject<infer E>
  ? E extends HTMLElement
    ? HTMLElementEventMap
    : GlobalEventHandlersEventMap
  : T extends Window
    ? WindowEventMap
    : T extends Document
      ? DocumentEventMap
      : T extends HTMLElement
        ? HTMLElementEventMap
        : GlobalEventHandlersEventMap;

/**
 * Hook for adding event listeners to DOM elements with automatic cleanup.
 * Accepts a RefObject, a direct element, `window`, or `document`.
 *
 * Handler updates are applied without re-registering the listener. The target
 * element is resolved on every render, so listeners are attached to
 * late-mounted refs (e.g. `{show && <div ref={ref} />}`) once the element
 * appears, and follow the element if it is replaced across renders.
 *
 * @param target - RefObject, a direct element, `window`/`document`, or null
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
 * // window / document targets are fully typed
 * useEventListener(window, 'resize', (e) => console.log(e));
 * useEventListener(document, 'keydown', (e) => console.log(e.key));
 *
 * @example
 * // With options (inline object is fine — listener is keyed on
 * // capture/once/passive, not object identity)
 * useEventListener(scrollRef, 'scroll', handleScroll, { passive: true });
 */
export function useEventListener<
  T extends EventTarget,
  K extends keyof EventMapFor<T> & string
>(
  target: T,
  eventName: K,
  handler: (event: EventMapFor<T>[K]) => void,
  options?: AddEventListenerOptions
): void;
export function useEventListener(
  target: EventTarget,
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

  // The element the listener is currently attached to, plus the exact
  // listener fn / event name / options it was registered with — so cleanup
  // always removes from the precise node + handler it was added to.
  const attachedRef = useRef<{
    el: Window | Document | HTMLElement;
    listener: (event: Event) => void;
    eventName: string;
    options?: AddEventListenerOptions;
  } | null>(null);

  // Resolve the target element on every render (refs have stable identity, so
  // a deps-based effect would never see `ref.current` change). The serialized
  // option primitives are part of the dependency so an inline options object
  // does not re-register on every render (which would reset `{ once: true }`).
  const el =
    target && typeof target === "object" && "current" in target
      ? target.current
      : (target ?? null);

  const capture = options?.capture ?? false;
  const once = options?.once ?? false;
  const passive = options?.passive ?? false;

  useEffect(() => {
    const attached = attachedRef.current;

    // Already attached to exactly the right node with the right config? Keep it.
    if (
      attached &&
      attached.el === el &&
      attached.eventName === eventName &&
      (attached.options?.capture ?? false) === capture &&
      (attached.options?.once ?? false) === once &&
      (attached.options?.passive ?? false) === passive
    ) {
      return;
    }

    // Detach from the previous node/handler before (re)attaching.
    if (attached) {
      attached.el.removeEventListener(
        attached.eventName,
        attached.listener,
        attached.options
      );
      attachedRef.current = null;
    }

    if (!el || typeof el.addEventListener !== "function") return;

    const listener = (event: Event) => handlerRef.current(event);
    el.addEventListener(eventName, listener, options);
    attachedRef.current = { el, listener, eventName, options };
    // `options` is intentionally not a dependency: it is keyed via its
    // serialized primitives (capture/once/passive) above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, eventName, capture, once, passive]);

  // Clean up on unmount, removing from the exact node + handler.
  useEffect(() => {
    return () => {
      const attached = attachedRef.current;
      if (attached) {
        attached.el.removeEventListener(
          attached.eventName,
          attached.listener,
          attached.options
        );
        attachedRef.current = null;
      }
    };
  }, []);
}
