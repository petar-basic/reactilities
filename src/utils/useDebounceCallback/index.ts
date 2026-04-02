import { useCallback, useEffect, useRef } from "react";

/**
 * Hook for debouncing a callback function
 * Returns a stable debounced version of the callback that delays execution
 * Unlike useDebounce (which debounces values), this debounces the function call itself
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds before invoking the callback
 * @returns A debounced version of the callback
 *
 * @example
 * function SearchInput() {
 *   const [results, setResults] = useState([]);
 *
 *   const fetchResults = useDebounceCallback(async (query: string) => {
 *     const data = await searchAPI(query);
 *     setResults(data);
 *   }, 500);
 *
 *   return <input onChange={(e) => fetchResults(e.target.value)} />;
 * }
 *
 * @example
 * // Debounce a form field save
 * const saveField = useDebounceCallback((value: string) => {
 *   api.saveField('bio', value);
 * }, 1000);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Update the ref on every render so the latest callback is always used
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}
