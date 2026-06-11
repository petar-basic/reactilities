import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

interface UseIntersectionObserverReturn<T extends HTMLElement = HTMLElement> {
  ref: React.RefObject<T | null>;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

/**
 * Hook for observing element intersection with viewport
 * Perfect for lazy loading, infinite scroll, and animations
 *
 * @typeParam T - The element type to observe (defaults to `HTMLElement`).
 *   Pass a concrete element type so the returned ref matches your JSX element,
 *   e.g. `useIntersectionObserver<HTMLDivElement>()`.
 * @param options - IntersectionObserver options with additional freezeOnceVisible
 * @returns Object with ref, isIntersecting state, and entry details
 *
 * @remarks
 * The returned `ref` behaves like a normal `RefObject` (you can read
 * `ref.current`), but assignment to it also notifies the hook. This means the
 * observer attaches correctly even when the target element mounts *after* the
 * first render (e.g. it is conditionally rendered), without breaking the
 * `RefObject` public API.
 *
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
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
export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn<T> {
  const { freezeOnceVisible = false, ...observerOptions } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // Track the observed element in state so that a late-mounted element (one that
  // appears after the first effect run) still gets observed: writing to
  // `ref.current` updates state, which re-runs the effect below.
  const [element, setElement] = useState<T | null>(null);

  // A RefObject-compatible handle. React (and consumers) read/write `.current`;
  // the setter mirrors the value into state so the hook reacts to mounts.
  const refHandle = useRef<React.RefObject<T | null> | null>(null);
  if (refHandle.current === null) {
    let node: T | null = null;
    refHandle.current = {
      get current() {
        return node;
      },
      set current(value: T | null) {
        if (value === node) return;
        node = value;
        setElement(value);
      },
    };
  }
  const ref = refHandle.current;

  // Keep the latest options in a ref so the effect can read them without
  // depending on the (often inline, new-identity-every-render) options object.
  const optionsRef = useRef(observerOptions);
  optionsRef.current = observerOptions;

  const frozen = freezeOnceVisible && isIntersecting;

  // Normalize array/object options into stable primitive keys so an inline
  // `threshold: [0, 0.5, 1]` (new array identity every render) does not tear
  // down and recreate the observer on every render.
  const thresholdKey = Array.isArray(observerOptions.threshold)
    ? observerOptions.threshold.join(',')
    : observerOptions.threshold;
  const root = observerOptions.root ?? null;
  const rootMargin = observerOptions.rootMargin;

  useEffect(() => {
    if (!element || frozen) return;

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
      setIsIntersecting(entry.isIntersecting);
    }, optionsRef.current);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
    // We intentionally depend on normalized primitive keys (thresholdKey, root,
    // rootMargin) plus the observed element instead of the raw options object.
    // The observer is built from optionsRef.current, which holds the latest
    // values.
     
  }, [element, frozen, thresholdKey, root, rootMargin]);

  return { ref, isIntersecting, entry };
}
