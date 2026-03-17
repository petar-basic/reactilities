import { useCallback, useState } from 'react';

interface UseCounterOptions {
  min?: number;
  max?: number;
  step?: number;
}

interface UseCounterReturn {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
}

/**
 * Hook for managing a numeric counter with optional min/max bounds
 *
 * @param initialValue - Starting value (default: 0)
 * @param options - Optional min, max, and step constraints
 * @returns Object with count value and control functions
 *
 * @example
 * const { count, increment, decrement, reset } = useCounter(0);
 *
 * @example
 * // With bounds and custom step
 * const { count, increment } = useCounter(1, { min: 1, max: 10, step: 2 });
 */
export function useCounter(
  initialValue = 0,
  { min, max, step = 1 }: UseCounterOptions = {}
): UseCounterReturn {
  const clamp = (value: number) => {
    let clamped = value;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    return clamped;
  };

  const [count, setCount] = useState(() => clamp(initialValue));

  const increment = useCallback(
    () => setCount((c) => clamp(c + step)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, min, max]
  );

  const decrement = useCallback(
    () => setCount((c) => clamp(c - step)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, min, max]
  );

  const reset = useCallback(
    () => setCount(clamp(initialValue)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialValue, min, max]
  );

  const set = useCallback(
    (value: number) => setCount(clamp(value)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max]
  );

  return { count, increment, decrement, reset, set };
}
