/**
 * Utility type for functions that return void with typed parameters
 * Useful for event handlers, callbacks, and side-effect functions
 * 
 * @template T - Tuple type representing the function parameters
 * 
 * @example
 * // Basic event handler
 * type ClickHandler = VoidFunction<[MouseEvent]>;
 * 
 * const handleClick: ClickHandler = (event) => {
 *   console.log('Clicked at:', event.clientX, event.clientY);
 * };
 * 
 * button.addEventListener('click', handleClick);
 * 
 * @example
 * // Multiple parameters
 * type UpdateUserHandler = VoidFunction<[userId: string, data: UserData]>;
 * 
 * const updateUser: UpdateUserHandler = (userId, data) => {
 *   // Update user in database
 *   database.users.update(userId, data);
 * };
 * 
 * updateUser('123', { name: 'John', age: 30 });
 * 
 * @example
 * // No parameters
 * type SimpleCallback = VoidFunction<[]>;
 * 
 * const onComplete: SimpleCallback = () => {
 *   console.log('Operation completed');
 * };
 * 
 * @example
 * // React component props
 * interface ButtonProps {
 *   onClick: VoidFunction<[event: React.MouseEvent]>;
 *   onHover: VoidFunction<[]>;
 *   onSubmit: VoidFunction<[formData: FormData]>;
 * }
 * 
 * function Button({ onClick, onHover, onSubmit }: ButtonProps) {
 *   return (
 *     <button 
 *       onClick={onClick}
 *       onMouseEnter={onHover}
 *       onSubmit={(e) => {
 *         e.preventDefault();
 *         const formData = new FormData(e.target as HTMLFormElement);
 *         onSubmit(formData);
 *       }}
 *     >
 *       Click me
 *     </button>
 *   );
 * }
 * 
 * @example
 * // Generic callback with optional parameters
 * type Logger = VoidFunction<[message: string, level?: 'info' | 'warn' | 'error']>;
 * 
 * const log: Logger = (message, level = 'info') => {
 *   console[level](message);
 * };
 * 
 * log('Hello'); // Uses default 'info'
 * log('Warning!', 'warn');
 */
export type VoidFunction<T extends unknown[] = unknown[]> = (...args: T) => void;
