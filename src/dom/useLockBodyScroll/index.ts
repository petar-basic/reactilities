import { useIsomorphicLayoutEffect } from '../../lifecycles/useIsomorphicLayoutEffect';

/**
 * Hook for preventing body scroll while component is mounted
 * Useful for modals, drawers, and full-screen overlays
 * Automatically restores original overflow style on unmount
 * 
 * @example
 * function Modal({ isOpen, children }) {
 *   useLockBodyScroll(); // Locks scroll while modal is mounted
 *   
 *   if (!isOpen) return null;
 *   
 *   return (
 *     <div className="modal-overlay">
 *       <div className="modal-content">
 *         {children}
 *       </div>
 *     </div>
 *   );
 * }
 * 
 * // Conditional usage
 * function Drawer({ isOpen }) {
 *   if (isOpen) {
 *     useLockBodyScroll();
 *   }
 *   // ...
 * }
 */
export function useLockBodyScroll(): void {
  useIsomorphicLayoutEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle || "";
    };
  }, []);
}