import { useCallback, useSyncExternalStore } from "react";

/**
 * Predefined media query constants for common breakpoints
 * Based on Bootstrap-like responsive design patterns
 */
export const MEDIA_QUERIES = {
    IS_SMALL_DEVICE: 'only screen and (max-width : 768px)',
    IS_MEDIUM_DEVICE: 'only screen and (min-width : 769px) and (max-width : 992px)',
    IS_LARGE_DEVICE: 'only screen and (min-width : 993px) and (max-width : 1200px)',
    IS_LARGER_DEVICE: 'only screen and (min-width : 993px)',
    IS_EXTRA_LARGE_DEVICE: 'only screen and (min-width : 1201px)'
}

/**
 * Options for {@link useMediaQuery}.
 */
export interface UseMediaQueryOptions {
  /**
   * Value returned during server-side rendering and the very first client
   * render (hydration), before `window.matchMedia` can be read. Defaults to
   * `false`.
   *
   * Returning a deterministic value here keeps the first client render
   * identical to the server-rendered HTML, so there is no hydration mismatch.
   * The real `matchMedia` result is applied after mount.
   */
  defaultValue?: boolean;
  /**
   * Alias for {@link UseMediaQueryOptions.defaultValue}. When both are
   * provided, `defaultValue` takes precedence.
   */
  serverDefault?: boolean;
}

/**
 * Hook for responsive design using CSS media queries
 * Returns boolean indicating if the media query currently matches
 * Uses useSyncExternalStore for optimal performance and SSR safety
 *
 * SSR-safe: on the server (and the first client render) it returns the
 * `defaultValue`/`serverDefault` option (default `false`) instead of throwing,
 * so components using it can be server-rendered and hydrated without crashing.
 * After mount it reads the real `window.matchMedia(query).matches`.
 *
 * @param query - CSS media query string to evaluate
 * @param options - Optional configuration. Use `defaultValue` (a.k.a.
 *   `serverDefault`) to choose the value used during SSR / first render.
 * @returns Boolean indicating if the media query matches
 *
 * @example
 * // Using predefined queries
 * const isMobile = useMediaQuery(MEDIA_QUERIES.IS_SMALL_DEVICE);
 * const isDesktop = useMediaQuery(MEDIA_QUERIES.IS_LARGER_DEVICE);
 *
 * // Custom queries
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 * const isLandscape = useMediaQuery('(orientation: landscape)');
 * const isHighDPI = useMediaQuery('(min-resolution: 2dppx)');
 *
 * // Choosing the SSR/first-render default
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { defaultValue: false });
 *
 * // Conditional rendering
 * return (
 *   <div>
 *     {isMobile ? <MobileNav /> : <DesktopNav />}
 *     {isDarkMode && <DarkModeStyles />}
 *   </div>
 * );
 */
export function useMediaQuery(
  query: string,
  options: UseMediaQueryOptions = {}
): boolean {
  const serverDefault = options.defaultValue ?? options.serverDefault ?? false;

  const subscribe = useCallback(
    (cb: () => void) => {
      const matchMedia = window.matchMedia(query);

      matchMedia.addEventListener("change", cb);
      return () => {
        matchMedia.removeEventListener("change", cb);
      };
    },
    [query]
  );

  const getSnapshot = () => {
    return window.matchMedia(query).matches;
  };

  // Return a deterministic default on the server / first render instead of
  // throwing. This keeps SSR (Next.js, Remix) and hydration from crashing and
  // guarantees the first client render matches the server-rendered HTML.
  const getServerSnapshot = () => serverDefault;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}