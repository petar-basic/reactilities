import { useIsomorphicLayoutEffect } from '../../lifecycles/useIsomorphicLayoutEffect';

/**
 * Module-level reference count of active locks.
 * Shared across every instance of the hook so that stacked overlays
 * (e.g. a modal opening a drawer) cooperate instead of clobbering each other.
 */
let lockCount = 0;

/**
 * The body's original INLINE overflow value, captured exactly once when the
 * first lock is applied (count 0 -> 1). We store the inline value
 * (`document.body.style.overflow`, which is '' when unset) rather than the
 * computed value, so restoring it never leaks a computed result into an inline
 * style or clobbers a stylesheet rule.
 */
let originalOverflow = '';

/**
 * Hook for preventing body scroll while component is mounted
 * Useful for modals, drawers, and full-screen overlays
 * Automatically restores original overflow style when the last lock releases
 *
 * Stacked locks are reference-counted: the lock is applied only on the first
 * active instance and the original inline overflow is restored only when the
 * last instance unmounts. This keeps nested overlays correct regardless of
 * mount/unmount order.
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
    // Capture the original inline overflow exactly when the lock stack goes
    // from inactive (0) to active (1), then apply the lock.
    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      // Only restore once the last lock releases (stack returns to 0).
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, []);
}
