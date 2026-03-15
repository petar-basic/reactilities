import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Hook for detecting when the user hovers over an element
 * Attaches mouseenter and mouseleave listeners to the returned ref
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
export function useHover<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return [ref, isHovered];
}
