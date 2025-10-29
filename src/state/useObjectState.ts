import { useCallback, useState } from "react";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === '[object Object]';
};

type ObjectStateUpdater<T> = (prevState: T) => Partial<T>;
type ObjectStateSetAction<T> = Partial<T> | ObjectStateUpdater<T>;

/**
 * Hook for managing object state with partial updates
 * Similar to class component setState - merges partial updates with existing state
 * Supports both direct object updates and functional updates
 * 
 * @param initialValue - Initial object state
 * @returns Array containing [state, setState]
 * 
 * @example
 * function UserProfile() {
 *   const [user, setUser] = useObjectState({
 *     name: 'John',
 *     age: 30,
 *     email: 'john@example.com'
 *   });
 * 
 *   const updateName = () => {
 *     setUser({ name: 'Jonathan' }); // { name: "Miki", age: 30, email: "miki@example.com" }
 *   };
 * 
 *   const incrementAge = () => {
 *     setUser((s) => ({ age: s.age + 1 })); // { name: "Miki", age: 31, email: "miki@example.com" }
 *   };
 * 
 *   return (
 *     <div>
 *       <p>Name: {user.name}</p>
 *       <p>Age: {user.age}</p>
 *       <p>Email: {user.email}</p>
 *       <button onClick={updateName}>Update Name</button>
 *       <button onClick={incrementAge}>Increment Age</button>
 *     </div>
 *   );
 * }
 * 
 * @example
 * // Form state management
 * function ContactForm() {
 *   const [formData, setFormData] = useObjectState({
 *     name: '',
 *     email: '',
 *     message: '',
 *     isSubmitting: false
 *   });
 * 
 *   const handleInputChange = (field: string, value: string) => {
 *     setFormData({ [field]: value });
 *   };
 * 
 *   const handleSubmit = async () => {
 *     setFormData({ isSubmitting: true });
 *     
 *     try {
 *       await submitForm(formData);
 *       setFormData({ name: '', email: '', message: '', isSubmitting: false });
 *     } catch (error) {
 *       setFormData({ isSubmitting: false });
 *     }
 *   };
 * 
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input 
 *         value={formData.name}
 *         onChange={(e) => handleInputChange('name', e.target.value)}
 *       />
 *       <button disabled={formData.isSubmitting}>
 *         {formData.isSubmitting ? 'Submitting...' : 'Submit'}
 *       </button>
 *     </form>
 *   );
 * }
 */
export function useObjectState<T extends Record<string, unknown>>(
  initialValue: T
): [T, (update: ObjectStateSetAction<T>) => void] {
  const [state, setState] = useState<T>(initialValue);

  const handleUpdate = useCallback((arg: ObjectStateSetAction<T>) => {
    if (typeof arg === "function") {
      setState((s) => {
        const newState = arg(s);

        if (isPlainObject(newState)) {
          return {
            ...s,
            ...newState
          };
        }
        
        return s; // Return current state if newState is not a plain object
      });
    } else if (isPlainObject(arg)) {
      setState((s) => ({
        ...s,
        ...arg
      }));
    }
  }, []);

  return [state, handleUpdate];
}