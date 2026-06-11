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
 * If `func` returns a function, that function is treated as a cleanup and is
 * invoked when the component unmounts — mirroring `useEffect`'s cleanup
 * contract. This lets you port `useEffect(() => { ...; return cleanup; }, [])`
 * code without silently leaking subscriptions, timers, or listeners.
 *
 * @param func - Function to execute after component mounts. May optionally
 *   return a cleanup function to run on unmount.
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
 * // Set up and tear down a subscription
 * componentDidMount(() => {
 *   const id = setInterval(tick, 1000);
 *   return () => clearInterval(id);
 * });
 *
 * @example
 * // Initialize analytics
 * componentDidMount(() => {
 *   analytics.track('page_view', { page: 'home' });
 * });
 */
export function componentDidMount<T>(func: () => T): void {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        const ret = func();
        return typeof ret === 'function' ? (ret as () => void) : undefined;
        // run once on mount; func is intentionally captured at mount time
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
