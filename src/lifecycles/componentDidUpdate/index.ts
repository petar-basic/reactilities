import { useEffect } from "react";

/**
 * React hook equivalent to componentDidUpdate lifecycle method
 * Executes a function after every render (component update)
 * 
 * @param func - Function to execute after each component update
 * 
 * @example
 * function MyComponent({ userId }) {
 *   componentDidUpdate(() => {
 *     console.log('Component updated');
 *     // Update document title or perform side effects
 *     document.title = `User ${userId}`;
 *   });
 * 
 *   return <div>User Profile</div>;
 * }
 * 
 * @example
 * // Track component updates
 * componentDidUpdate(() => {
 *   analytics.track('component_updated', { 
 *     component: 'UserProfile',
 *     timestamp: Date.now()
 *   });
 * });
 */
export function componentDidUpdate<T>(func: () => T): void {
    useEffect(() => {
        func()
    });
}