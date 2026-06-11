import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Hook that traps keyboard focus within an element while active
 * Useful for modals, dialogs, and drawers
 *
 * The trap is enforced at the `document` level rather than on the container
 * alone, so it cannot be escaped by clicking the backdrop/body or otherwise
 * moving focus outside the container: a `focusin` listener pulls focus back in,
 * and the `keydown` listener wraps Tab/Shift+Tab at the boundaries. On
 * deactivation, focus is restored to the element that was focused before the
 * trap engaged.
 *
 * @typeParam T - The container element type (defaults to `HTMLElement`).
 * @param active - Whether the focus trap is currently active
 * @returns Ref to attach to the container element
 *
 * @example
 * function Modal({ isOpen, onClose }) {
 *   const ref = useFocusTrap<HTMLDivElement>(isOpen);
 *
 *   if (!isOpen) return null;
 *   return (
 *     <div ref={ref} role="dialog">
 *       <button>First focusable</button>
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   );
 * }
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  active = true
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Remember what was focused so we can restore it on deactivation.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Recompute the focusable elements on demand so the list never goes stale
    // (children can be added/removed while the trap is active).
    const getFocusable = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));

    // Focus the first focusable element on activation.
    const initial = getFocusable();
    if (initial.length > 0) {
      initial[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      // Only act when focus is within the trapped container. The document-level
      // listener still sees the Tab while focus is inside; the focusin handler
      // covers the case where focus has already escaped.
      if (!container.contains(document.activeElement)) return;

      const elements = getFocusable();
      if (elements.length === 0) {
        // Nothing focusable inside — keep focus pinned, don't let Tab escape.
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    // If focus escapes the container while the trap is active (e.g. the user
    // clicks the backdrop/body), pull it back to the first focusable element.
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as Node | null;
      if (target && container.contains(target)) return;

      const elements = getFocusable();
      if (elements.length > 0) {
        elements[0].focus();
      } else {
        // No focusable children: keep focus on the container itself.
        container.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);

      // Restore focus to wherever it was before the trap engaged.
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [active]);

  return containerRef;
}
