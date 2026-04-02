import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const dispatchStorageEvent = (key: string, newValue: string | null) => {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
};

const setItem = <T>(key: string, value: T) => {
  const stringifiedValue = JSON.stringify(value);
  window.localStorage.setItem(key, stringifiedValue);
  dispatchStorageEvent(key, stringifiedValue);
};

const removeItem = (key: string) => {
  window.localStorage.removeItem(key);
  dispatchStorageEvent(key, null);
};

const getItem = (key: string) => {
  return window.localStorage.getItem(key);
};

const subscribe = (callback: (event: StorageEvent) => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const getServerSnapshot = () => {
  throw Error("useLocalStorage is a client-only hook");
};

/**
 * Hook for managing localStorage with React state synchronization
 * Automatically syncs with localStorage changes across tabs/windows
 * Provides setState-like interface with JSON serialization
 *
 * @param key - The localStorage key to manage
 * @param initialValue - Initial value to use if key doesn't exist
 * @returns Array containing [storedValue, setStoredValue]
 *
 * @example
 * function UserPreferences() {
 *   const [theme, setTheme] = useLocalStorage('theme', 'light');
 *   const [language, setLanguage] = useLocalStorage('language', 'en');
 *
 *   return (
 *     <div>
 *       <select value={theme} onChange={(e) => setTheme(e.target.value)}>
 *         <option value="light">Light</option>
 *         <option value="dark">Dark</option>
 *       </select>
 *
 *       <select value={language} onChange={(e) => setLanguage(e.target.value)}>
 *         <option value="en">English</option>
 *         <option value="es">Spanish</option>
 *       </select>
 *     </div>
 *   );
 * }
 *
 * // Complex objects
 * const [user, setUser] = useLocalStorage('user', { name: '', email: '' });
 *
 * // Functional updates
 * setUser(prevUser => ({ ...prevUser, name: 'John' }));
 *
 * // Remove from storage
 * setUser(null); // or setUser(undefined)
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prevValue: T) => T) | null | undefined) => void] {
  // Ref ensures the initial value is stable across renders so it doesn't
  // appear in dependency arrays and cause unnecessary work when the caller
  // passes an object/array literal.
  const initialValueRef = useRef(initialValue);

  const getSnapshot = () => getItem(key);

  const store = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setState = useCallback(
    (valueOrFn: T | ((prevValue: T) => T) | null | undefined) => {
      try {
        // When the key doesn't exist yet, fall back to initialValue so
        // functional updates receive a meaningful previous value instead
        // of throwing from JSON.parse('').
        const prevValue = store !== null ? JSON.parse(store) : initialValueRef.current;
        const nextState = typeof valueOrFn === "function"
          ? (valueOrFn as (prevValue: T) => T)(prevValue)
          : valueOrFn;

        if (nextState === undefined || nextState === null) {
          removeItem(key);
        } else {
          setItem(key, nextState);
        }
      } catch (e) {
        console.warn('Error setting localStorage:', e);
      }
    },
    [key, store]
  );

  useEffect(() => {
    try {
      if (getItem(key) === null && typeof initialValueRef.current !== "undefined") {
        setItem(key, initialValueRef.current);
      }
    } catch (e) {
      console.warn('Error initializing localStorage:', e);
    }
  }, [key]);

  const parsedValue = (() => {
    if (!store) return initialValue;
    try {
      return JSON.parse(store);
    } catch {
      return initialValue;
    }
  })();

  return [parsedValue, setState];
}
