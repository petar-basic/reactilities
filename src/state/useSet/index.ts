import { useCallback, useState } from 'react';

export interface UseSetReturn<T> {
  /** Current Set state */
  set: Set<T>;
  /** Add a value to the set */
  add: (value: T) => void;
  /** Remove a value from the set */
  remove: (value: T) => void;
  /** Add if not present, remove if already present */
  toggle: (value: T) => void;
  /** Check if a value is in the set */
  has: (value: T) => boolean;
  /** Remove all values */
  clear: () => void;
  /** Replace the entire set with a new one */
  reset: (values?: T[]) => void;
}

/**
 * Hook for managing a Set with React state integration
 * All mutations create new Set instances, ensuring React re-renders
 *
 * @param initialValues - Initial values to populate the set (default: empty)
 * @returns Object containing the set and mutation methods
 *
 * @example
 * // Multi-select filter
 * function TagFilter({ tags }: { tags: string[] }) {
 *   const { set: selected, toggle, has } = useSet<string>();
 *
 *   return (
 *     <div>
 *       {tags.map(tag => (
 *         <button
 *           key={tag}
 *           onClick={() => toggle(tag)}
 *           style={{ fontWeight: has(tag) ? 'bold' : 'normal' }}
 *         >
 *           {tag}
 *         </button>
 *       ))}
 *       <p>{selected.size} selected</p>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Track visited items
 * function ItemList({ items }: { items: Item[] }) {
 *   const { add, has } = useSet<number>();
 *
 *   return (
 *     <ul>
 *       {items.map(item => (
 *         <li
 *           key={item.id}
 *           onClick={() => add(item.id)}
 *           style={{ opacity: has(item.id) ? 0.5 : 1 }}
 *         >
 *           {item.name}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 */
export function useSet<T>(initialValues?: T[]): UseSetReturn<T> {
  const [set, setSet] = useState<Set<T>>(() => new Set(initialValues));

  const add = useCallback((value: T) => setSet(s => new Set(s).add(value)), []);

  const remove = useCallback((value: T) => {
    setSet(s => {
      const next = new Set(s);
      next.delete(value);
      return next;
    });
  }, []);

  const toggle = useCallback((value: T) => {
    setSet(s => {
      const next = new Set(s);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }, []);

  const has = useCallback((value: T) => set.has(value), [set]);

  const clear = useCallback(() => setSet(new Set()), []);

  const reset = useCallback((values?: T[]) => setSet(new Set(values)), []);

  return { set, add, remove, toggle, has, clear, reset };
}
