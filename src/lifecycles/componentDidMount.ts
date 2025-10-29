import { useEffect } from "react";

/**
 * React hook equivalent to componentDidMount lifecycle method
 * Executes a function once after the component mounts
 * 
 * @param func - Function to execute after component mounts
 * 
 * @example
 * function MyComponent() {
 *   componentDidMount(() => {
 *     console.log('Component mounted');
 *     // Fetch initial data
 *     fetchUserData();
 *   });
 * 
 *   return <div>My Component</div>;
 * }
 * 
 * @example
 * // Initialize analytics
 * componentDidMount(() => {
 *   analytics.track('page_view', { page: 'home' });
 * });
 */
export function componentDidMount<T>(func: () => T): void {
    useEffect(() => {
        func()
    }, []);
}
