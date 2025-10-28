import { useEffect, useMemo, useState } from 'react';

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

interface UseVirtualizationReturn {
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
 * @returns Object with virtual items, total size, and scroll utilities
 * 
 * @example
 * const { virtualItems, totalSize, scrollToIndex } = useVirtualization(10000, {
 *   itemHeight: 50,
 *   containerHeight: 400,
 *   overscan: 5
 * });
 * 
 * return (
 *   <div style={{ height: containerHeight, overflow: 'auto' }}>
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
export default function useVirtualization(
  itemCount: number,
  options: UseVirtualizationOptions
): UseVirtualizationReturn {
  const { 
    itemHeight, 
    containerHeight, 
    overscan = 5, 
    scrollingDelay = 150 
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

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

  const scrollToIndex = (index: number) => {
    const targetScrollTop = index * itemHeight;
    setScrollTop(targetScrollTop);
    
    // Scroll the actual container if it exists
    const container = document.querySelector('[data-virtualized-container]') as HTMLElement;
    if (container) {
      container.scrollTop = targetScrollTop;
    }
  };

  useEffect(() => {
    let timeoutId: number;

    const handleScroll = (event: Event) => {
      const target = event.target as HTMLElement;
      setScrollTop(target.scrollTop);
      setIsScrolling(true);

      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setIsScrolling(false);
      }, scrollingDelay);
    };

    const container = document.querySelector('[data-virtualized-container]');
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        container.removeEventListener('scroll', handleScroll);
        clearTimeout(timeoutId);
      };
    }
  }, [scrollingDelay]);

  return {
    virtualItems,
    totalSize,
    scrollToIndex,
    isScrolling
  };
}
