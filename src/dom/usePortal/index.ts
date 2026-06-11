import { useEffect, useState } from "react";

/**
 * Tracks shared portal containers keyed by id, along with how many hook
 * consumers currently reference each one and whether this hook created it.
 * A shared container is only removed from the DOM when its refcount drops to
 * zero AND it was created by this hook (pre-existing elements are left alone).
 */
const sharedContainers = new Map<
  string,
  { element: HTMLDivElement; refCount: number; createdByHook: boolean }
>();

/**
 * Hook for creating a DOM portal container appended to document.body
 * Returns the container element once mounted, or null during SSR
 * Use the returned element with React's createPortal to render content outside the component tree
 * Prevents z-index and CSS overflow issues for modals, tooltips, and floating UI
 *
 * When an id is provided, the container is shared: multiple hook instances
 * using the same id resolve to a single DOM element (no duplicate ids).
 * The element is removed only when the last consumer unmounts, and only if
 * this hook created it. Without an id, each instance gets its own container
 * that is created on mount and removed on unmount.
 *
 * @param id - Optional id attribute for the portal container element
 * @returns The portal container HTMLDivElement once mounted, or null before mount
 *
 * @example
 * import { createPortal } from 'react-dom';
 *
 * function Modal({ children, isOpen }: { children: ReactNode; isOpen: boolean }) {
 *   const portalContainer = usePortal('modal-root');
 *
 *   if (!isOpen || !portalContainer) return null;
 *
 *   return createPortal(
 *     <div className="modal-overlay">
 *       <div className="modal">{children}</div>
 *     </div>,
 *     portalContainer
 *   );
 * }
 *
 * @example
 * // Tooltip rendered at body level to avoid overflow:hidden clipping
 * const tooltipContainer = usePortal();
 *
 * return tooltipContainer
 *   ? createPortal(<Tooltip text={label} />, tooltipContainer)
 *   : null;
 */
export function usePortal(id?: string): HTMLDivElement | null {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    // No id: per-instance container, created on mount and removed on unmount.
    if (!id) {
      const div = document.createElement('div');
      document.body.appendChild(div);
      setContainer(div);

      return () => {
        setContainer(null);
        if (div.parentNode) div.parentNode.removeChild(div);
      };
    }

    // With id: find-or-create a shared container, refcounted per id.
    let entry = sharedContainers.get(id);
    if (!entry) {
      // Reuse a matching element already in the DOM (e.g. server-rendered or
      // placed by other code) rather than creating a duplicate id.
      const existing = document.getElementById(id);
      if (existing instanceof HTMLDivElement) {
        entry = { element: existing, refCount: 0, createdByHook: false };
      } else {
        const div = document.createElement('div');
        div.id = id;
        document.body.appendChild(div);
        entry = { element: div, refCount: 0, createdByHook: true };
      }
      sharedContainers.set(id, entry);
    }

    entry.refCount += 1;
    setContainer(entry.element);

    return () => {
      setContainer(null);
      const current = sharedContainers.get(id);
      if (!current) return;
      current.refCount -= 1;
      if (current.refCount <= 0) {
        sharedContainers.delete(id);
        // Only remove elements this hook created; leave pre-existing ones.
        if (current.createdByHook && current.element.parentNode) {
          current.element.parentNode.removeChild(current.element);
        }
      }
    };
  }, [id]);

  return container;
}
