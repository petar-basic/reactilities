import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
};

const getSnapshot = () => document.visibilityState === 'visible';

const getServerSnapshot = () => true;

/**
 * Hook that tracks whether the current browser tab is visible.
 * Uses the Page Visibility API (`document.visibilityState`).
 * Useful for pausing timers, animations, video, or polling when the tab is hidden.
 *
 * @returns true when the tab is active/visible, false when hidden
 *
 * @example
 * const isVisible = usePageVisibility();
 *
 * useEffect(() => {
 *   if (!isVisible) pauseVideo();
 *   else playVideo();
 * }, [isVisible]);
 */
export function usePageVisibility(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
