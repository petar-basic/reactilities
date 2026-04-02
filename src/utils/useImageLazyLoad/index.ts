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

  const ref = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState(placeholder);
  const [status, setStatus] = useState<ImageLoadStatus>('idle');

  useEffect(() => {
    const element = ref.current;
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
  }, [imageSrc, threshold, rootMargin]);

  return { ref, src, status, isLoaded: status === 'loaded' };
}
