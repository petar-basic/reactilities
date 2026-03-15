import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

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

interface UseInfiniteScrollReturn {
  /** Attach to the loader/sentinel element at the bottom of the list */
  loaderRef: RefObject<HTMLElement | null>;
  /** Whether onLoadMore is currently executing (async-aware) */
  isLoading: boolean;
}

/**
 * Hook for infinite scroll using IntersectionObserver
 * Observes a sentinel/loader element and calls onLoadMore when it becomes visible
 *
 * @param options - Configuration options
 * @returns loaderRef to attach to the sentinel element, and isLoading state
 *
 * @example
 * function Feed() {
 *   const [items, setItems] = useState([]);
 *   const [hasMore, setHasMore] = useState(true);
 *
 *   const { loaderRef, isLoading } = useInfiniteScroll({
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
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading: externalLoading = false,
  threshold = 0.1,
  rootMargin = '0px',
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const loaderRef = useRef<HTMLElement | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  const isLoading = externalLoading || internalLoading;

  const handleIntersect = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry.isIntersecting || !hasMore || isLoading) return;

      const result = onLoadMoreRef.current();
      if (result instanceof Promise) {
        setInternalLoading(true);
        try {
          await result;
        } finally {
          setInternalLoading(false);
        }
      }
    },
    [hasMore, isLoading]
  );

  useEffect(() => {
    const element = loaderRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleIntersect, threshold, rootMargin]);

  return { loaderRef, isLoading };
}
