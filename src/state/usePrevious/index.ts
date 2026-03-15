import { useEffect, useRef } from 'react';

/**
 * Hook that returns the previous value of a variable
 * Captures the value from the previous render cycle
 * Useful for comparing current and previous values, animations, and undo functionality
 *
 * @param value - The value to track
 * @returns The value from the previous render, or undefined on the first render
 *
 * @example
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const prevCount = usePrevious(count);
 *
 *   return (
 *     <div>
 *       <p>Current: {count}</p>
 *       <p>Previous: {prevCount ?? 'none'}</p>
 *       <button onClick={() => setCount(c => c + 1)}>Increment</button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Detect direction of change
 * function PriceDisplay({ price }: { price: number }) {
 *   const prevPrice = usePrevious(price);
 *   const direction = prevPrice === undefined ? 'neutral'
 *     : price > prevPrice ? 'up'
 *     : price < prevPrice ? 'down'
 *     : 'neutral';
 *
 *   return <span className={direction}>{price}</span>;
 * }
 *
 * @example
 * // Trigger effect only when value actually changed
 * function DataFetcher({ id }: { id: string }) {
 *   const prevId = usePrevious(id);
 *
 *   useEffect(() => {
 *     if (prevId !== id) {
 *       fetchData(id);
 *     }
 *   }, [id, prevId]);
 * }
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
