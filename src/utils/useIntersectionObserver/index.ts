import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: React.RefObject<HTMLElement | null>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook for observing element intersection with viewport
 * Perfect for lazy loading, infinite scroll, and animations
 * 
 * @param options - IntersectionObserver options with additional freezeOnceVisible
 * @returns Object with ref, isIntersecting state, and entry details
 * 
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.1,
 *   freezeOnceVisible: true
 * });
 * 
 * return (
 *   <div ref={ref}>
 *     {isIntersecting ? <img src="image.jpg" /> : <div>Loading...</div>}
 *   </div>
 * );
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const { freezeOnceVisible = false, ...observerOptions } = options;
  
  const ref = useRef<HTMLElement>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  const frozen = freezeOnceVisible && isIntersecting;

  useEffect(() => {
    const element = ref.current;
    if (!element || frozen) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);
      },
      observerOptions
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [frozen, observerOptions.threshold, observerOptions.root, observerOptions.rootMargin]);

  return { ref, isIntersecting, entry };
}
