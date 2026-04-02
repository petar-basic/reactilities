import { useEffect } from "react";

/**
 * React hook equivalent to componentWillUnmount lifecycle method
 * Executes a cleanup function when the component unmounts
 *
 * **This is a React hook.** It must only be called at the top level of a
 * React component or custom hook — never inside conditions, loops, or
 * callbacks. Because the name does not start with `use`, ESLint's
 * react-hooks plugin will not enforce these rules automatically.
 *
 * @param func - Cleanup function to execute before component unmounts
 *
 * @example
 * function MyComponent() {
 *   componentWillUnmount(() => {
 *     console.log('Component will unmount');
 *     // Cleanup subscriptions, timers, etc.
 *     clearInterval(intervalId);
 *     socket.disconnect();
 *   });
 *
 *   return <div>My Component</div>;
 * }
 *
 * @example
 * // Cleanup event listeners
 * componentWillUnmount(() => {
 *   window.removeEventListener('resize', handleResize);
 *   document.removeEventListener('click', handleClick);
 * });
 *
 * @example
 * // Save data before unmount
 * componentWillUnmount(() => {
 *   localStorage.setItem('lastVisited', Date.now().toString());
 *   analytics.track('component_unmounted');
 * });
 */
export function componentWillUnmount<T>(func: () => T): void {
  // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
  useEffect(() => { return () => { func(); }; }, []);
}
