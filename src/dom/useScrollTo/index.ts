import { useCallback } from "react";

interface ScrollOptions {
  behavior?: ScrollBehavior;
}

interface UseScrollToReturn {
  scrollToTop: (options?: ScrollOptions) => void;
  scrollToBottom: (options?: ScrollOptions) => void;
  scrollToElement: (element: HTMLElement | null, options?: ScrollOptions & ScrollIntoViewOptions) => void;
  scrollTo: (x: number, y: number, options?: ScrollOptions) => void;
}

/**
 * Hook providing programmatic scroll control for common scroll operations
 * Includes scroll to top, bottom, a specific position, or a specific element
 *
 * @returns Object with scroll control functions
 *
 * @example
 * function Page() {
 *   const { scrollToTop } = useScrollTo();
 *
 *   return (
 *     <>
 *       <div style={{ height: '2000px' }}>Long content...</div>
 *       <button
 *         onClick={() => scrollToTop()}
 *         style={{ position: 'fixed', bottom: 20, right: 20 }}
 *       >
 *         Back to top
 *       </button>
 *     </>
 *   );
 * }
 *
 * @example
 * // Scroll to a section element
 * const { scrollToElement } = useScrollTo();
 * const sectionRef = useRef<HTMLDivElement>(null);
 *
 * <button onClick={() => scrollToElement(sectionRef.current)}>Go to section</button>
 *
 * @example
 * // Scroll to an exact position
 * const { scrollTo } = useScrollTo();
 * scrollTo(0, 500); // scroll to y=500px
 */
export function useScrollTo(): UseScrollToReturn {
  const scrollToTop = useCallback((options: ScrollOptions = {}) => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: options.behavior ?? 'smooth' });
  }, []);

  const scrollToBottom = useCallback((options: ScrollOptions = {}) => {
    if (typeof window === 'undefined') return;
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: options.behavior ?? 'smooth'
    });
  }, []);

  const scrollToElement = useCallback((
    element: HTMLElement | null,
    options: ScrollOptions & ScrollIntoViewOptions = {}
  ) => {
    if (!element) return;
    element.scrollIntoView({
      behavior: options.behavior ?? 'smooth',
      block: options.block ?? 'start',
      inline: options.inline ?? 'nearest'
    });
  }, []);

  const scrollTo = useCallback((x: number, y: number, options: ScrollOptions = {}) => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ left: x, top: y, behavior: options.behavior ?? 'smooth' });
  }, []);

  return { scrollToTop, scrollToBottom, scrollToElement, scrollTo };
}
