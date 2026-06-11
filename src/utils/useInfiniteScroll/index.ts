import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** Called when the loader element enters the viewport */
  onLoadMore: () => void | Promise<void>;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether a load is currently in progress */
  isLoading?: boolean;
  /** IntersectionObserver threshold (0–1) */
  threshold?: number;
  /** IntersectionObserver root margin */
  rootMargin?: string;
}

interface UseInfiniteScrollReturn<T extends HTMLElement = HTMLElement> {
  /** Attach to the loader/sentinel element at the bottom of the list */
  loaderRef: RefCallback<T | null>;
  /** Whether onLoadMore is currently executing (async-aware) */
  isLoading: boolean;
}

/**
 * Hook for infinite scroll using IntersectionObserver
 * Observes a sentinel/loader element and calls onLoadMore when it becomes visible
 *
 * @typeParam T - The element type the loader ref is attached to (defaults to HTMLElement)
 * @param options - Configuration options
 * @returns loaderRef to attach to the sentinel element, and isLoading state
 *
 * @example
 * function Feed() {
 *   const [items, setItems] = useState([]);
 *   const [hasMore, setHasMore] = useState(true);
 *
 *   const { loaderRef, isLoading } = useInfiniteScroll<HTMLDivElement>({
 *     onLoadMore: async () => {
 *       const next = await fetchNextPage();
 *       setItems(prev => [...prev, ...next]);
 *       if (next.length < PAGE_SIZE) setHasMore(false);
 *     },
 *     hasMore,
 *   });
 *
 *   return (
 *     <div>
 *       {items.map(item => <Item key={item.id} {...item} />)}
 *       {hasMore && <div ref={loaderRef}>{isLoading ? 'Loading...' : ''}</div>}
 *     </div>
 *   );
 * }
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLElement>({
  onLoadMore,
  hasMore,
  isLoading: externalLoading = false,
  threshold = 0.1,
  rootMargin = '0px',
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn<T> {
  const [element, setElement] = useState<T | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const onLoadMoreRef = useRef(onLoadMore);
  // Synchronous guard: prevents duplicate onLoadMore calls when the observer
  // fires again before the `internalLoading` state commits (scroll jitter / slow render).
  const inFlightRef = useRef(false);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  const isLoading = externalLoading || internalLoading;

  const handleIntersect = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (
        !entry.isIntersecting ||
        !hasMore ||
        externalLoading ||
        inFlightRef.current
      ) {
        return;
      }

      inFlightRef.current = true;
      try {
        const result = onLoadMoreRef.current();
        if (result instanceof Promise) {
          setInternalLoading(true);
          try {
            await result;
          } finally {
            setInternalLoading(false);
          }
        }
      } finally {
        inFlightRef.current = false;
      }
    },
    [hasMore, externalLoading]
  );

  // Callback ref backed by state so the observer (re)attaches whenever the
  // sentinel element mounts — including when it mounts later than the hook.
  const loaderRef = useCallback<RefCallback<T | null>>((node) => {
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, handleIntersect, threshold, rootMargin]);

  return { loaderRef, isLoading };
}
