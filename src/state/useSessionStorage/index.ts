import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

const dispatchStorageEvent = (key: string, newValue: string | null) => {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
};

const setItem = <T>(key: string, value: T) => {
  const stringifiedValue = JSON.stringify(value);
  window.sessionStorage.setItem(key, stringifiedValue);
  dispatchStorageEvent(key, stringifiedValue);
};

const removeItem = (key: string) => {
  window.sessionStorage.removeItem(key);
  dispatchStorageEvent(key, null);
};

const getItem = (key: string) => {
  return window.sessionStorage.getItem(key);
};

const subscribe = (callback: (event: StorageEvent) => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

/**
 * Hook for managing sessionStorage with React state synchronization
 * Similar to useLocalStorage but data persists only for the browser session
 * Automatically syncs with sessionStorage changes within the same tab
 *
 * SSR-safe: renders the initialValue on the server and hydrates from
 * sessionStorage after mount.
 *
 * @param key - The sessionStorage key to manage
 * @param initialValue - Initial value to use if key doesn't exist
 * @returns Array containing [storedValue, setStoredValue]
 *
 * @example
 * function ShoppingCart() {
 *   const [cart, setCart] = useSessionStorage('cart', []);
 *   const [checkoutStep, setCheckoutStep] = useSessionStorage('checkoutStep', 1);
 *
 *   const addToCart = (item) => {
 *     setCart(prevCart => [...prevCart, item]);
 *   };
 *
 *   const nextStep = () => {
 *     setCheckoutStep(step => step + 1);
 *   };
 *
 *   return (
 *     <div>
 *       <p>Items in cart: {cart.length}</p>
 *       <p>Checkout step: {checkoutStep}</p>
 *       <button onClick={nextStep}>Next Step</button>
 *     </div>
 *   );
 * }
 *
 * // Form data that should persist during session
 * const [formData, setFormData] = useSessionStorage('formData', {
 *   name: '',
 *   email: '',
 *   preferences: {}
 * });
 *
 * // Temporary UI state
 * const [sidebarOpen, setSidebarOpen] = useSessionStorage('sidebarOpen', false);
 */
export function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T | ((prevValue: T) => T) | null | undefined) => void] {
  // Ref ensures the initial value is stable across renders so it doesn't
  // appear in dependency arrays and cause unnecessary work when the caller
  // passes an object/array literal.
  const initialValueRef = useRef(initialValue);

  const getSnapshot = useCallback(() => getItem(key), [key]);

  // Server snapshot returns the serialized initialValue (same string shape as
  // getSnapshot) so the first server render is consistent with client
  // hydration and never throws. The hook updates from storage after mount.
  const getServerSnapshot = useCallback(
    () => JSON.stringify(initialValueRef.current),
    []
  );

  const store = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setState = useCallback(
    (valueOrFn: T | ((prevValue: T) => T) | null | undefined) => {
      try {
        const nextState = typeof valueOrFn === "function"
          // Read the CURRENT storage value fresh (not a captured render-time
          // snapshot) so that successive functional updates compose correctly.
          // When the key doesn't exist yet, fall back to initialValue so
          // functional updates receive a meaningful previous value instead
          // of throwing from JSON.parse('').
          ? (() => {
              const current = getItem(key);
              const prevValue = current !== null ? JSON.parse(current) : initialValueRef.current;
              return (valueOrFn as (prevValue: T) => T)(prevValue);
            })()
          : valueOrFn;

        if (nextState === undefined || nextState === null) {
          removeItem(key);
        } else {
          setItem(key, nextState);
        }
      } catch (e) {
        console.warn('Error setting sessionStorage:', e);
      }
    },
    [key]
  );

  useEffect(() => {
    try {
      if (getItem(key) === null && typeof initialValueRef.current !== "undefined") {
        setItem(key, initialValueRef.current);
      }
    } catch (e) {
      console.warn('Error initializing sessionStorage:', e);
    }
  }, [key]);

  // Memoize the parse on the snapshot string so non-primitive values keep a
  // stable identity across renders when nothing in storage changed. Without
  // this, every render produces a new object/array reference, which makes
  // consumer effects depending on the value fire on every render.
  const parsedValue = useMemo<T>(() => {
    if (store === null) return initialValueRef.current;
    try {
      return JSON.parse(store);
    } catch {
      return initialValueRef.current;
    }
  }, [store]);

  return [parsedValue, setState];
}
