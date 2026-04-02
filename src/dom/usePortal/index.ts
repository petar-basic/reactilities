import { useEffect, useState } from "react";

/**
 * Hook for creating a DOM portal container appended to document.body
 * Returns the container element once mounted, or null during SSR
 * Use the returned element with React's createPortal to render content outside the component tree
 * Prevents z-index and CSS overflow issues for modals, tooltips, and floating UI
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
    const div = document.createElement('div');
    if (id) div.id = id;
    document.body.appendChild(div);
    setContainer(div);

    return () => {
      setContainer(null);
      document.body.removeChild(div);
    };
  }, [id]);

  return container;
}
