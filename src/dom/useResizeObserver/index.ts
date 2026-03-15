import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface ResizeObserverSize {
  readonly inlineSize: number;
  readonly blockSize: number;
}

export interface UseResizeObserverEntry {
  contentRect: DOMRectReadOnly;
  borderBoxSize: ReadonlyArray<ResizeObserverSize>;
  contentBoxSize: ReadonlyArray<ResizeObserverSize>;
}

export interface UseResizeObserverReturn<T extends Element> {
  /** Attach this ref to the element you want to observe */
  ref: RefObject<T | null>;
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
  const ref = useRef<T | null>(null);
  const [entry, setEntry] = useState<UseResizeObserverEntry | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([observerEntry]) => {
      setEntry({
        contentRect: observerEntry.contentRect,
        borderBoxSize: observerEntry.borderBoxSize,
        contentBoxSize: observerEntry.contentBoxSize,
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return {
    ref,
    width: entry?.contentRect.width ?? 0,
    height: entry?.contentRect.height ?? 0,
    entry,
  };
}
