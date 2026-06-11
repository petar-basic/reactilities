import { useEffect, useRef, type RefObject } from 'react';

/**
 * Hook that detects clicks outside of a specified element
 * Useful for closing modals, dropdowns, or other overlay components
 * Uses a single `pointerdown` listener so it fires on press (not release),
 * which avoids closing on text selections that start inside and end outside,
 * and avoids the touch double-fire of separate `click` + `touchstart` handlers.
 *
 * @param ref - React ref object pointing to the target element
 * @param handler - Callback invoked with the `PointerEvent` when pressing outside
 * 
 * @example
 * function Dropdown() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   const dropdownRef = useRef<HTMLDivElement>(null);
 * 
 *   useClickOutside(dropdownRef, () => {
 *     setIsOpen(false);
 *   });
 * 
 *   return (
 *     <div ref={dropdownRef}>
 *       <button onClick={() => setIsOpen(!isOpen)}>
 *         Toggle Dropdown
 *       </button>
 *       {isOpen && (
 *         <div className="dropdown-menu">
 *           <div>Option 1</div>
 *           <div>Option 2</div>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Modal with click outside to close
 * function Modal({ onClose }) {
 *   const modalRef = useRef<HTMLDivElement>(null);
 * 
 *   useClickOutside(modalRef, onClose);
 * 
 *   return (
 *     <div className="modal-overlay">
 *       <div ref={modalRef} className="modal-content">
 *         <h2>Modal Title</h2>
 *         <p>Click outside to close</p>
 *       </div>
 *     </div>
 *   );
 * }
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: PointerEvent) => void
): void {
  // Keep the latest handler in a ref so the listener is attached once and not
  // torn down/re-added on every render when the consumer passes an inline fn.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const listener = (event: PointerEvent): void => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handlerRef.current(event);
    };

    // A single `pointerdown` listener fires on press for both mouse and touch.
    // Listening on press (not `click`/release) means a drag that starts inside
    // the element and releases outside does not trigger the handler, and a tap
    // fires exactly once instead of the touchstart+click double-fire.
    document.addEventListener('pointerdown', listener);

    return () => {
      document.removeEventListener('pointerdown', listener);
    };
  }, [ref]);
}
