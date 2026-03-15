import { useLayoutEffect } from "react";

/**
 * React hook equivalent to componentWillMount lifecycle method
 * Executes a function synchronously before the component renders
 * Uses useLayoutEffect to run before browser paint
 * 
 * @param func - Function to execute before component renders
 * 
 * @example
 * function MyComponent() {
 *   componentWillMount(() => {
 *     console.log('Component will mount');
 *     // Set up initial state or configuration
 *     initializeComponent();
 *   });
 * 
 *   return <div>My Component</div>;
 * }
 * 
 * @example
 * // Prepare data before render
 * componentWillMount(() => {
 *   prepareInitialData();
 *   setTheme('dark');
 * });
 */
export function componentWillMount<T>(func: () => T): void {
    // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
    useLayoutEffect(() => { func() }, []);
}
