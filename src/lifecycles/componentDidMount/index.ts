import { useEffect } from "react";

/**
 * React hook equivalent to componentDidMount lifecycle method
 * Executes a function once after the component mounts
 *
 * **This is a React hook.** It must only be called at the top level of a
 * React component or custom hook — never inside conditions, loops, or
 * callbacks. Because the name does not start with `use`, ESLint's
 * react-hooks plugin will not enforce these rules automatically.
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
    // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
    useEffect(() => { func() }, []);
}
