import { useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../../state/useLocalStorage';
import { useMediaQuery } from '../useMediaQuery';

type ColorScheme = 'dark' | 'light' | 'system';

interface UseDarkModeReturn {
  isDark: boolean;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  toggle: () => void;
}

/**
 * Options for {@link useDarkMode}.
 */
export interface UseDarkModeOptions {
  /**
   * Value assumed for the OS `prefers-color-scheme: dark` query during
   * server-side rendering and the first client render, before
   * `window.matchMedia` can be read. Defaults to `false` (light).
   *
   * This only affects the `colorScheme === 'system'` branch; an explicitly
   * stored `'dark'`/`'light'` preference always wins.
   */
  defaultDark?: boolean;
}

/**
 * Hook for managing dark mode with system preference detection and localStorage persistence.
 * Applies a `dark` class to the `<html>` element when dark mode is active.
 *
 * SSR-safe: on the server (and the first client render) the system-preference
 * media query resolves to `defaultDark` (default `false` / light) instead of
 * throwing, and the `dark` class is only toggled in an effect that runs after
 * mount. This keeps Next.js/Remix server renders and hydration crash-free, with
 * no hydration mismatch — the real OS preference applies once mounted.
 *
 * @param storageKey - localStorage key used to persist the preference (default: 'color-scheme')
 * @param options - Optional configuration. Use `defaultDark` to choose the
 *   value assumed for the OS preference during SSR / the first render.
 * @returns Object with dark mode state and controls
 *
 * @example
 * const { isDark, toggle } = useDarkMode();
 *
 * return (
 *   <button onClick={toggle}>
 *     {isDark ? '☀️ Light mode' : '🌙 Dark mode'}
 *   </button>
 * );
 *
 * @example
 * // Explicit scheme control
 * const { colorScheme, setColorScheme } = useDarkMode();
 * setColorScheme('dark');   // force dark
 * setColorScheme('light');  // force light
 * setColorScheme('system'); // follow OS preference
 */
export function useDarkMode(
  storageKey = 'color-scheme',
  options: UseDarkModeOptions = {}
): UseDarkModeReturn {
  const { defaultDark = false } = options;
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)', {
    defaultValue: defaultDark,
  });
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>(storageKey, 'system');

  const isDark = colorScheme === 'dark' || (colorScheme === 'system' && systemPrefersDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // `setColorScheme` from useLocalStorage is already a stable reference, so
  // `toggle`'s identity only changes when `isDark` actually flips. Memo-ized
  // children receiving `toggle` won't re-render on unrelated parent renders.
  const toggle = useCallback(() => {
    setColorScheme(isDark ? 'light' : 'dark');
  }, [isDark, setColorScheme]);

  // Stable return identity when none of the underlying values change, so
  // consumers spreading/destructuring the result don't see churn either.
  return useMemo(
    () => ({ isDark, colorScheme, setColorScheme, toggle }),
    [isDark, colorScheme, setColorScheme, toggle]
  );
}
