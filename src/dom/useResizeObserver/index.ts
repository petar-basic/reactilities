import { useCallback, useRef, useState } from 'react';

export interface ResizeObserverSize {
  readonly inlineSize: number;
  readonly blockSize: number;
}

export interface UseResizeObserverEntry {
  contentRect: DOMRectReadOnly;
  borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize: ReadonlyArray<ResizeObserverSize>;
}

/**
 * Callback ref returned by {@link useResizeObserver}.
 *
 * It is a function (valid as a `ref` prop, e.g. `<div ref={ref} />`) that also
 * exposes a `.current` property pointing at the currently observed node — so
 * existing `ref.current` access keeps working.
 */
export interface UseResizeObserverRef<T extends Element> {
  (node: T | null): void;
  /** The element currently being observed, or `null` if none is attached */
  readonly current: T | null;
}

export interface UseResizeObserverReturn<T extends Element> {
  /** Attach this ref to the element you want to observe */
  ref: UseResizeObserverRef<T>;
  /** Current width of the observed element (contentRect.width) */
  width: number;
  /** Current height of the observed element (contentRect.height) */
  height: number;
  /** Full ResizeObserverEntry for advanced usage */
  entry: UseResizeObserverEntry | undefined;
}

/**
 * Hook for observing size changes of a DOM element using ResizeObserver
 * More accurate than window resize events for individual element dimensions
 * Useful for responsive components, charts, and dynamic layouts
 *
 * @returns Object with ref, width, height, and full entry
 *
 * @example
 * function ResponsiveChart() {
 *   const { ref, width, height } = useResizeObserver<HTMLDivElement>();
 *
 *   return (
 *     <div ref={ref} style={{ width: '100%' }}>
 *       <svg width={width} height={height}>
 *         {/* chart content *\/}
 *       </svg>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Switch layout based on container width (container queries in JS)
 * function AdaptiveCard() {
 *   const { ref, width } = useResizeObserver<HTMLDivElement>();
 *   const isNarrow = width > 0 && width < 300;
 *
 *   return (
 *     <div ref={ref} className={isNarrow ? 'card--compact' : 'card--full'}>
 *       {isNarrow ? <CompactView /> : <FullView />}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Dynamic text truncation
 * function TruncatedText({ text }: { text: string }) {
 *   const { ref, width } = useResizeObserver<HTMLParagraphElement>();
 *   const charsVisible = Math.floor(width / 8);
 *
 *   return (
 *     <p ref={ref}>
 *       {text.length > charsVisible ? text.slice(0, charsVisible) + '…' : text}
 *     </p>
 *   );
 * }
 */
export function useResizeObserver<T extends Element>(): UseResizeObserverReturn<T> {
  const [entry, setEntry] = useState<UseResizeObserverEntry | undefined>(undefined);

  // The element currently being observed. Exposed via `ref.current`.
  const elementRef = useRef<T | null>(null);
  // The live ResizeObserver instance, kept across renders so the callback ref
  // can disconnect/re-observe as the target node changes.
  const observerRef = useRef<ResizeObserver | null>(null);

  // Stable callback ref: React calls it with the node when it mounts/changes
  // and with `null` when it unmounts. This fires whenever the ref attaches to a
  // late-mounted element or moves to a different element, so we always observe
  // the current node instead of only whatever existed on the first commit.
  const setRef = useCallback((node: T | null) => {
    if (node === elementRef.current) return;

    elementRef.current = node;

    // Stop watching the previous node (if any) before observing the new one.
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([observerEntry]) => {
      setEntry({
        contentRect: observerEntry.contentRect,
        borderBoxSize: observerEntry.borderBoxSize,
        contentBoxSize: observerEntry.contentBoxSize,
      });
    });

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // Build the hybrid callback ref once: a function (valid as a `ref` prop) that
  // also exposes `.current` so existing `ref.current` access keeps working.
  const refRef = useRef<UseResizeObserverRef<T> | null>(null);
  if (refRef.current === null) {
    const callbackRef = ((node: T | null) => setRef(node)) as UseResizeObserverRef<T>;
    Object.defineProperty(callbackRef, 'current', {
      get: () => elementRef.current,
      enumerable: true,
    });
    refRef.current = callbackRef;
  }

  return {
    ref: refRef.current,
    width: entry?.contentRect.width ?? 0,
    height: entry?.contentRect.height ?? 0,
    entry,
  };
}
