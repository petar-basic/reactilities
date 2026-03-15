import { useCallback, useEffect, useRef } from 'react';

interface UseTimeoutReturn {
  /** Cancel the pending timeout */
  clear: () => void;
  /** Restart the timeout from zero */
  reset: () => void;
}

/**
 * Hook for running a callback after a delay with reset and clear controls
 * Safely handles callback updates and cleans up on unmount
 * Pass null as delay to disable the timeout entirely
 *
 * @param callback - Function to call after the delay
 * @param delay - Delay in milliseconds, or null to disable
 * @returns Object with clear() and reset() controls
 *
 * @example
 * // Auto-dismiss notification
 * function Toast({ message, onDismiss }) {
 *   useTimeout(onDismiss, 3000);
 *   return <div className="toast">{message}</div>;
 * }
 *
 * @example
 * // With reset and clear controls
 * function SessionWarning() {
 *   const [visible, setVisible] = useState(false);
 *   const { reset, clear } = useTimeout(() => setVisible(true), 30 * 60 * 1000);
 *
 *   const handleActivity = () => {
 *     setVisible(false);
 *     reset(); // Restart the 30-minute timer on any activity
 *   };
 *
 *   return (
 *     <div onMouseMove={handleActivity} onClick={handleActivity}>
 *       {visible && <SessionExpiredModal onClose={clear} />}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Delayed search suggestion
 * function SearchBox() {
 *   const [query, setQuery] = useState('');
 *   const [showSuggestions, setShowSuggestions] = useState(false);
 *   const { reset } = useTimeout(() => setShowSuggestions(true), 300);
 *
 *   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     setQuery(e.target.value);
 *     setShowSuggestions(false);
 *     reset();
 *   };
 * }
 */
export function useTimeout(callback: () => void, delay: number | null): UseTimeoutReturn {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const clear = useCallback(() => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);

  const set = useCallback(() => {
    clear();
    if (delay === null) return;
    timeoutRef.current = setTimeout(() => callbackRef.current(), delay);
  }, [delay, clear]);

  useEffect(() => {
    set();
    return clear;
  }, [set, clear]);

  return { clear, reset: set };
}
