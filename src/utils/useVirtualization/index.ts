import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseVirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollingDelay?: number;
}

interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
}

/**
 * Callback ref for the scroll container. Assign it directly to an element's
 * `ref` prop (e.g. `<div ref={containerRef}>`). Because it is a callback ref,
 * the scroll subscription follows the actual DOM node even when the container
 * is mounted later or swapped out.
 */
type ContainerRef<T extends HTMLElement> = (node: T | null) => void;

interface UseVirtualizationReturn<T extends HTMLElement> {
  containerRef: ContainerRef<T>;
  virtualItems: VirtualItem[];
  totalSize: number;
  scrollToIndex: (index: number) => void;
  isScrolling: boolean;
}

/**
 * Hook for virtualizing large lists to improve performance
 * Only renders visible items plus overscan buffer
 *
 * @param itemCount - Total number of items in the list
 * @param options - Virtualization configuration options
 * @returns Object with containerRef, virtual items, total size, and scroll utilities
 *
 * @example
 * const { containerRef, virtualItems, totalSize, scrollToIndex } = useVirtualization<HTMLDivElement>(10000, {
 *   itemHeight: 50,
 *   containerHeight: 400,
 *   overscan: 5
 * });
 *
 * return (
 *   <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
 *     <div style={{ height: totalSize, position: 'relative' }}>
 *       {virtualItems.map(item => (
 *         <div
 *           key={item.index}
 *           style={{
 *             position: 'absolute',
 *             top: item.start,
 *             height: item.size,
 *             width: '100%'
 *           }}
 *         >
 *           Item {item.index}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 */
export function useVirtualization<T extends HTMLElement = HTMLDivElement>(
  itemCount: number,
  options: UseVirtualizationOptions
): UseVirtualizationReturn<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    scrollingDelay = 150
  } = options;

  // State-backed container node so the scroll subscription re-runs whenever the
  // actual DOM element is attached, swapped, or removed (e.g. conditional render).
  const [container, setContainer] = useState<T | null>(null);
  // Keep a synchronous reference too, so scrollToIndex works the moment the node
  // is attached without waiting for a re-render.
  const containerNodeRef = useRef<T | null>(null);

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const containerRef = useCallback<ContainerRef<T>>((node) => {
    containerNodeRef.current = node;
    setContainer(node);
  }, []);

  const totalSize = itemCount * itemHeight;

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const items: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        size: itemHeight
      });
    }

    return items;
  }, [scrollTop, itemHeight, containerHeight, overscan, itemCount]);

  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = index * itemHeight;
    setScrollTop(targetScrollTop);

    if (containerNodeRef.current) {
      containerNodeRef.current.scrollTop = targetScrollTop;
    }
  }, [itemHeight]);

  useEffect(() => {
    if (!container) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      setScrollTop(target.scrollTop);
      setIsScrolling(true);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsScrolling(false);
      }, scrollingDelay);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [container, scrollingDelay]);

  return {
    containerRef,
    virtualItems,
    totalSize,
    scrollToIndex,
    isScrolling
  };
}
