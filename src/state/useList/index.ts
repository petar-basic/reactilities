import { useCallback, useState } from 'react';

export interface UseListReturn<T> {
  /** Current list state */
  list: T[];
  /** Replace the entire list */
  set: (list: T[]) => void;
  /** Append one or more items to the end */
  push: (...items: T[]) => void;
  /** Remove the item at the given index */
  removeAt: (index: number) => void;
  /** Insert an item at the given index */
  insertAt: (index: number, item: T) => void;
  /** Replace the item at the given index */
  updateAt: (index: number, item: T) => void;
  /** Keep only items that pass the predicate */
  filter: (predicate: (item: T, index: number) => boolean) => void;
  /** Sort the list in-place (returns a new sorted array) */
  sort: (compareFn?: (a: T, b: T) => number) => void;
  /** Empty the list */
  clear: () => void;
}

/**
 * Hook for managing array state with a rich set of immutable operations
 * All mutations return new array references, ensuring React re-renders
 *
 * @param initialList - Initial array value (default: empty array)
 * @returns Object containing the list and mutation methods
 *
 * @example
 * function TodoList() {
 *   const { list, push, removeAt, updateAt } = useList<string>([]);
 *
 *   return (
 *     <div>
 *       <button onClick={() => push('New todo')}>Add</button>
 *       <ul>
 *         {list.map((item, i) => (
 *           <li key={i}>
 *             {item}
 *             <button onClick={() => removeAt(i)}>Remove</button>
 *             <button onClick={() => updateAt(i, item + ' (done)')}>Done</button>
 *           </li>
 *         ))}
 *       </ul>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Sorted leaderboard
 * function Leaderboard() {
 *   const { list, push, sort } = useList<{ name: string; score: number }>([]);
 *
 *   const addScore = (name: string, score: number) => {
 *     push({ name, score });
 *     sort((a, b) => b.score - a.score);
 *   };
 * }
 */
export function useList<T>(initialList: T[] = []): UseListReturn<T> {
  const [list, setList] = useState<T[]>(initialList);

  const set = useCallback((newList: T[]) => setList(newList), []);

  const push = useCallback((...items: T[]) => setList(l => [...l, ...items]), []);

  const removeAt = useCallback(
    (index: number) => setList(l => l.filter((_, i) => i !== index)),
    []
  );

  const insertAt = useCallback(
    (index: number, item: T) =>
      setList(l => [...l.slice(0, index), item, ...l.slice(index)]),
    []
  );

  const updateAt = useCallback(
    (index: number, item: T) =>
      setList(l => l.map((existing, i) => (i === index ? item : existing))),
    []
  );

  const filter = useCallback(
    (predicate: (item: T, index: number) => boolean) =>
      setList(l => l.filter(predicate)),
    []
  );

  const sort = useCallback(
    (compareFn?: (a: T, b: T) => number) =>
      setList(l => [...l].sort(compareFn)),
    []
  );

  const clear = useCallback(() => setList([]), []);

  return { list, set, push, removeAt, insertAt, updateAt, filter, sort, clear };
}
