import { useCallback, useState } from 'react';

interface UseBooleanReturn {
  value: boolean;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
  set: (value: boolean) => void;
}

/**
 * Hook for managing boolean state with explicit named controls
 *
 * @param initialValue - Starting value (default: false)
 * @returns Object with boolean value and control functions
 *
 * @example
 * const { value: isOpen, setTrue: open, setFalse: close, toggle } = useBoolean(false);
 *
 * return (
 *   <>
 *     <button onClick={open}>Open Modal</button>
 *     <Modal isOpen={isOpen} onClose={close} />
 *   </>
 * );
 */
export function useBoolean(initialValue = false): UseBooleanReturn {
  const [value, setValue] = useState(initialValue);

  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const set = useCallback((v: boolean) => setValue(v), []);

  return { value, setTrue, setFalse, toggle, set };
}
