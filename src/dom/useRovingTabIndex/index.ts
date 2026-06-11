import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";

interface UseRovingTabIndexReturn {
  getContainerProps: () => {
    onKeyDown: (e: KeyboardEvent) => void;
  };
  getItemProps: (index: number) => {
    tabIndex: number;
    onFocus: () => void;
    ref: (el: HTMLElement | null) => void;
  };
}

/**
 * Hook for keyboard-navigable lists and menus using the roving tabIndex pattern
 * Only the focused item is in the tab order (tabIndex=0), all others are tabIndex=-1
 * Arrow keys move focus within the container; Tab moves focus out of it entirely
 * Required for accessible menus, toolbars, tab lists, and radio groups per WAI-ARIA guidelines
 *
 * @param itemCount - Total number of navigable items
 * @param options.orientation - 'vertical' uses Up/Down arrows, 'horizontal' uses Left/Right (default: 'vertical')
 * @param options.loop - Whether arrow navigation wraps around at boundaries (default: true)
 * @returns Prop getters for the container and each item.
 *   Each item receives `tabIndex`, `onFocus` (tracks externally-set focus e.g. via click), and `ref`.
 *   Spread all three onto the item element so keyboard and pointer navigation stay in sync.
 *
 * @example
 * function Menu({ items }: { items: string[] }) {
 *   const { getContainerProps, getItemProps } = useRovingTabIndex(items.length);
 *
 *   return (
 *     <ul role="menu" {...getContainerProps()}>
 *       {items.map((item, i) => (
 *         <li key={item} role="menuitem" {...getItemProps(i)}>
 *           {item}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 *
 * @example
 * // Horizontal toolbar
 * const { getContainerProps, getItemProps } = useRovingTabIndex(buttons.length, {
 *   orientation: 'horizontal',
 *   loop: false
 * });
 */
export function useRovingTabIndex(
  itemCount: number,
  options: { orientation?: 'vertical' | 'horizontal'; loop?: boolean } = {}
): UseRovingTabIndexReturn {
  const { orientation = 'vertical', loop = true } = options;
  // The focused index lives in state so that changing it re-renders consumers and
  // updates the DOM `tabIndex` attribute on each item (the core of the roving pattern).
  const [focusedIndex, setFocusedIndex] = useState(0);
  // Mirror of focusedIndex kept in a ref so the memoized keyboard handler always
  // reads the latest index without being recreated on every focus change (avoids stale closures).
  const focusedIndexRef = useRef(0);
  focusedIndexRef.current = focusedIndex;
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Programmatically move DOM focus AND update state so the rendered tabIndex attributes rove.
  const focusItem = useCallback((index: number) => {
    const el = itemRefs.current[index];
    if (el) {
      el.focus();
    }
    focusedIndexRef.current = index;
    setFocusedIndex(index);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

    if (e.key === nextKey) {
      e.preventDefault();
      const next = focusedIndexRef.current + 1;
      if (next < itemCount) {
        focusItem(next);
      } else if (loop) {
        focusItem(0);
      }
    } else if (e.key === prevKey) {
      e.preventDefault();
      const prev = focusedIndexRef.current - 1;
      if (prev >= 0) {
        focusItem(prev);
      } else if (loop) {
        focusItem(itemCount - 1);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusItem(itemCount - 1);
    }
  }, [orientation, itemCount, loop, focusItem]);

  // Trim stale DOM refs when the list shrinks so focusItem never operates on detached elements
  useEffect(() => {
    itemRefs.current.length = itemCount;
  }, [itemCount]);

  // Keep the focused index in range if the list shrinks past the current selection.
  useEffect(() => {
    if (itemCount > 0 && focusedIndex > itemCount - 1) {
      focusedIndexRef.current = itemCount - 1;
      setFocusedIndex(itemCount - 1);
    }
  }, [itemCount, focusedIndex]);

  const getContainerProps = useCallback(() => ({
    onKeyDown: handleKeyDown
  }), [handleKeyDown]);

  // getItemProps depends on focusedIndex so it produces fresh tabIndex values whenever
  // focus moves; its identity changes only when the focused item actually changes.
  const getItemProps = useCallback((index: number) => ({
    tabIndex: index === focusedIndex ? 0 : -1,
    onFocus: () => {
      focusedIndexRef.current = index;
      setFocusedIndex(index);
    },
    ref: (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    }
  }), [focusedIndex]);

  return { getContainerProps, getItemProps };
}
