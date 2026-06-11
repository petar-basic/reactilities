import { useEffect, useRef } from "react";

/**
 * React hook equivalent to componentDidUpdate lifecycle method
 * Executes a function after every render EXCEPT the initial mount, mirroring
 * the class lifecycle method which only runs on updates (re-renders), never on
 * the first render.
 *
 * **This is a React hook.** It must only be called at the top level of a
 * React component or custom hook — never inside conditions, loops, or
 * callbacks. Because the name does not start with `use`, ESLint's
 * react-hooks plugin will not enforce these rules automatically.
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
    // Skip the first render so this only fires on updates, like the class
    // lifecycle. A plain ref flag is not enough under StrictMode, which in dev
    // runs effects setup -> cleanup -> setup on mount: a naive flag would be
    // flipped during the first (discarded) pass and then treat the second mount
    // pass as an "update". The mount-only cleanup below resets the flag so the
    // real first commit is always treated as the initial render.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const isFirst = useRef(true);

    // Runs once per real mount; its cleanup re-arms the skip flag so StrictMode's
    // simulated unmount/remount cycle does not leak a spurious update call.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => () => { isFirst.current = true; }, []);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        func();
    });
}
