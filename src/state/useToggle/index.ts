import { useCallback, useState } from "react";

/**
 * Hook for managing boolean toggle state with flexible value setting
 * Provides a boolean state and a toggle function that can accept explicit values
 * 
 * @param initialValue - Initial boolean value (default: true)
 * @returns Array containing [state, toggleFunction]
 * 
 * @example
 * function ToggleExample() {
 *   const [isVisible, toggleVisible] = useToggle(false);
 *   const [isEnabled, toggleEnabled] = useToggle(true);
 * 
 *   return (
 *     <div>
 *       <button onClick={() => toggleVisible()}>
 *         {isVisible ? 'Hide' : 'Show'} Content
 *       </button>
 *       
 *       {isVisible && <div>Toggled Content</div>}
 *       
 *       <button onClick={() => toggleEnabled(false)}>
 *         Disable
 *       </button>
 *       <button onClick={() => toggleEnabled(true)}>
 *         Enable
 *       </button>
 *       
 *       <input disabled={!isEnabled} placeholder="Type here..." />
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Modal toggle
 * function Modal() {
 *   const [isOpen, toggleModal] = useToggle(false);
 * 
 *   return (
 *     <>
 *       <button onClick={() => toggleModal(true)}>Open Modal</button>
 *       {isOpen && (
 *         <div className="modal">
 *           <button onClick={() => toggleModal(false)}>Close</button>
 *           <button onClick={() => toggleModal()}>Toggle</button>
 *         </div>
 *       )}
 *     </>
 *   );
 * }
 */
export function useToggle(initialValue = true): [boolean, (value?: unknown) => void] {
  const [on, setOn] = useState(() => {
    if (typeof initialValue === "boolean") {
      return initialValue;
    }

    return Boolean(initialValue)
  });

  const handleToggle = useCallback((value?: unknown) => {
    if (typeof value === "boolean") {
      return setOn(value);
    }

    return setOn((v) => !v);
  }, []);

  return [on, handleToggle];
}