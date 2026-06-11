import { useEffect, useRef, useState } from "react";

type ImageLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface UseImageLazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  placeholder?: string;
}

interface UseImageLazyLoadReturn {
  ref: React.RefObject<HTMLImageElement | null>;
  src: string;
  status: ImageLoadStatus;
  isLoaded: boolean;
}

/**
 * Hook for lazy loading images — only starts loading when the image enters the viewport
 * Higher-level than useIntersectionObserver: handles the full load lifecycle with status tracking
 * Optionally shows a placeholder until the image has loaded
 *
 * @param imageSrc - The real image URL to load when visible
 * @param options.threshold - Intersection threshold to trigger load (default: 0)
 * @param options.rootMargin - Margin around root before triggering (default: '200px')
 * @param options.placeholder - URL shown before the image loads (default: empty string)
 * @returns Object with ref to attach to <img>, the current src, load status, and isLoaded flag
 *
 * @example
 * function LazyImage({ src, alt }: { src: string; alt: string }) {
 *   const { ref, src: currentSrc, isLoaded } = useImageLazyLoad(src, {
 *     placeholder: '/spinner.gif'
 *   });
 *
 *   return (
 *     <img
 *       ref={ref}
 *       src={currentSrc}
 *       alt={alt}
 *       style={{ opacity: isLoaded ? 1 : 0.3, transition: 'opacity 0.3s' }}
 *     />
 *   );
 * }
 *
 * @example
 * // Gallery with blur-up effect
 * const { ref, src, status } = useImageLazyLoad(highResSrc, {
 *   placeholder: lowResSrc,
 *   rootMargin: '400px'
 * });
 */
export function useImageLazyLoad(
  imageSrc: string,
  options: UseImageLazyLoadOptions = {}
): UseImageLazyLoadReturn {
  const { threshold = 0, rootMargin = '200px', placeholder = '' } = options;

  const [src, setSrc] = useState(placeholder);
  const [status, setStatus] = useState<ImageLoadStatus>('idle');

  // Track the observed element in state so that a late-mounted element (one that
  // appears after the first effect run) still gets observed: writing to
  // `ref.current` updates state, which re-runs the effect below. (BUG 2)
  const [element, setElement] = useState<HTMLImageElement | null>(null);

  // A RefObject-compatible handle. React (and consumers) read/write `.current`;
  // the setter mirrors the value into state so the hook reacts to mounts. This
  // keeps the public `<img ref={ref} />` API working unchanged.
  const refHandle = useRef<React.RefObject<HTMLImageElement | null> | null>(null);
  if (refHandle.current === null) {
    let node: HTMLImageElement | null = null;
    refHandle.current = {
      get current() {
        return node;
      },
      set current(value: HTMLImageElement | null) {
        if (value === node) return;
        node = value;
        setElement(value);
      },
    };
  }
  const ref = refHandle.current;

  // When `imageSrc` changes, reset state so the UI does not keep showing the
  // previously loaded image as "loaded". Skip the very first run so initial
  // behavior is unchanged. (BUG 1)
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    setSrc(placeholder);
    setStatus('idle');
  }, [imageSrc, placeholder]);

  useEffect(() => {
    if (!element) return;

    let cancelled = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.disconnect();
        setStatus('loading');

        const img = new Image();
        img.src = imageSrc;

        img.onload = () => {
          if (!cancelled) {
            setSrc(imageSrc);
            setStatus('loaded');
          }
        };

        img.onerror = () => {
          if (!cancelled) setStatus('error');
        };
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [element, imageSrc, threshold, rootMargin]);

  return { ref, src, status, isLoaded: status === 'loaded' };
}
