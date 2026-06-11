import { useEffect, useState } from 'react';

/**
 * A callback ref that also exposes the current element via `.current`.
 *
 * It is a valid React `ref` prop (a `RefCallback`), so `<div ref={ref}>` keeps
 * working, while also behaving like a `RefObject` for reads (`ref.current`).
 */
export interface HoverRef<T extends HTMLElement> {
  (node: T | null): void;
  current: T | null;
}

/**
 * Hook for detecting when the user hovers over an element
 * Attaches mouseenter and mouseleave listeners to the returned ref
 *
 * Uses a state-backed callback ref so listeners are (re)attached whenever the
 * target element changes — including elements rendered conditionally after
 * mount, and elements that are removed/replaced (which resets `isHovered`).
 *
 * @returns Tuple of [ref, isHovered] — attach ref to the target element
 *
 * @example
 * function HoverCard() {
 *   const [ref, isHovered] = useHover<HTMLDivElement>();
 *
 *   return (
 *     <div ref={ref} style={{ background: isHovered ? '#f0f0f0' : 'white' }}>
 *       {isHovered ? 'Hovered!' : 'Hover me'}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Show tooltip on hover
 * function TooltipButton({ label, tooltip }: { label: string; tooltip: string }) {
 *   const [ref, isHovered] = useHover<HTMLButtonElement>();
 *
 *   return (
 *     <div style={{ position: 'relative' }}>
 *       <button ref={ref}>{label}</button>
 *       {isHovered && (
 *         <div className="tooltip">{tooltip}</div>
 *       )}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Prefetch on hover
 * function NavLink({ href, children }) {
 *   const [ref, isHovered] = useHover<HTMLAnchorElement>();
 *
 *   useEffect(() => {
 *     if (isHovered) prefetch(href);
 *   }, [isHovered, href]);
 *
 *   return <a ref={ref} href={href}>{children}</a>;
 * }
 */
export function useHover<T extends HTMLElement>(): [HoverRef<T>, boolean] {
  const [isHovered, setIsHovered] = useState(false);
  const [element, setElement] = useState<T | null>(null);

  // Hybrid callback ref (stable identity across renders): stores the node in
  // state to re-run the listener effect, while also exposing `.current` for
  // RefObject-style reads.
  const [ref] = useState<HoverRef<T>>(() => {
    const callback = ((node: T | null) => {
      callback.current = node;
      setElement(node);
    }) as HoverRef<T>;
    callback.current = null;
    return callback;
  });

  useEffect(() => {
    if (!element) {
      // No element attached (e.g. unmounted/removed) — never stay sticky.
      setIsHovered(false);
      return;
    }

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      // Element is changing/detaching — drop any stale hover state so a
      // removed/replaced node can't leave `isHovered` stuck at true.
      setIsHovered(false);
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [element]);

  return [ref, isHovered];
}
