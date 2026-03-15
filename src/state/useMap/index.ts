import { useCallback, useState } from 'react';

export interface UseMapReturn<K, V> {
  /** Current Map state */
  map: Map<K, V>;
  /** Set a key-value pair */
  set: (key: K, value: V) => void;
  /** Get a value by key */
  get: (key: K) => V | undefined;
  /** Delete a key-value pair */
  delete: (key: K) => void;
  /** Check if a key exists */
  has: (key: K) => boolean;
  /** Remove all entries */
  clear: () => void;
  /** Replace the entire map with new entries */
  reset: (entries?: [K, V][]) => void;
}

/**
 * Hook for managing a Map with React state integration
 * All mutations create new Map instances, ensuring React re-renders
 *
 * @param initialEntries - Initial key-value pairs (default: empty)
 * @returns Object containing the map and mutation methods
 *
 * @example
 * // Form field errors
 * function FormWithValidation() {
 *   const { map: errors, set: setError, delete: clearError, has } = useMap<string, string>();
 *
 *   const validate = (field: string, value: string) => {
 *     if (!value) setError(field, 'This field is required');
 *     else clearError(field);
 *   };
 *
 *   return (
 *     <form>
 *       <input
 *         name="email"
 *         onChange={e => validate('email', e.target.value)}
 *       />
 *       {has('email') && <span>{errors.get('email')}</span>}
 *     </form>
 *   );
 * }
 *
 * @example
 * // Cache lookup results
 * function DataCache() {
 *   const { map: cache, set, has, get } = useMap<string, ApiResponse>();
 *
 *   const fetchWithCache = async (key: string) => {
 *     if (has(key)) return get(key);
 *     const data = await fetchData(key);
 *     set(key, data);
 *     return data;
 *   };
 * }
 */
export function useMap<K, V>(initialEntries?: [K, V][]): UseMapReturn<K, V> {
  const [map, setMap] = useState<Map<K, V>>(() => new Map(initialEntries));

  const set = useCallback((key: K, value: V) => {
    setMap(m => new Map(m).set(key, value));
  }, []);

  const get = useCallback((key: K) => map.get(key), [map]);

  const deleteEntry = useCallback((key: K) => {
    setMap(m => {
      const next = new Map(m);
      next.delete(key);
      return next;
    });
  }, []);

  const has = useCallback((key: K) => map.has(key), [map]);

  const clear = useCallback(() => setMap(new Map()), []);

  const reset = useCallback((entries?: [K, V][]) => setMap(new Map(entries)), []);

  return { map, set, get, delete: deleteEntry, has, clear, reset };
}
