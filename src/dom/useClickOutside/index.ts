import { useEffect, type RefObject } from 'react';

/**
 * Hook that detects clicks outside of a specified element
 * Useful for closing modals, dropdowns, or other overlay components
 * Handles both mouse clicks and touch events
 * 
 * @param ref - React ref object pointing to the target element
 * @param handler - Callback function to execute when clicking outside
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
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent): void => {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('click', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('click', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
