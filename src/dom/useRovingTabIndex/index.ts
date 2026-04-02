import { KeyboardEvent, useCallback, useEffect, useRef } from "react";

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
  const focusedIndexRef = useRef(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const focusItem = useCallback((index: number) => {
    const el = itemRefs.current[index];
    if (el) {
      el.focus();
      focusedIndexRef.current = index;
    }
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

  const getContainerProps = useCallback(() => ({
    onKeyDown: handleKeyDown
  }), [handleKeyDown]);

  const getItemProps = useCallback((index: number) => ({
    tabIndex: index === focusedIndexRef.current ? 0 : -1,
    onFocus: () => { focusedIndexRef.current = index; },
    ref: (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    }
  }), []);

  return { getContainerProps, getItemProps };
}
