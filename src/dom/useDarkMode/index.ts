import { useEffect } from 'react';
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
 * Hook for managing dark mode with system preference detection and localStorage persistence.
 * Applies a `dark` class to the `<html>` element when dark mode is active.
 *
 * @param storageKey - localStorage key used to persist the preference (default: 'color-scheme')
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
export function useDarkMode(storageKey = 'color-scheme'): UseDarkModeReturn {
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');
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

  const toggle = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return { isDark, colorScheme, setColorScheme, toggle };
}
