import { useRef } from "react";

/**
 * React hook equivalent to componentWillMount lifecycle method.
 *
 * Runs `func` exactly once, synchronously, during the component's first render
 * — before any render output is produced and before the component commits.
 * Because it executes in the render phase (not in a layout/passive effect), it
 * is SSR-safe: it does not emit React's "useLayoutEffect does nothing on the
 * server" warning.
 *
 * Since `func` runs during render, it should be side-effect-light and
 * idempotent (e.g. seeding configuration or computing initial values). Avoid
 * imperative side effects that touch the DOM, schedule timers, or start
 * subscriptions here — use `componentDidMount` for those.
 *
 * **This is a React hook.** It must only be called at the top level of a
 * React component or custom hook — never inside conditions, loops, or
 * callbacks. Because the name does not start with `use`, ESLint's
 * react-hooks plugin will not enforce these rules automatically.
 *
 * @param func - Function to execute once before the first render. Should be
 *   side-effect-light and idempotent.
 *
 * @example
 * function MyComponent() {
 *   componentWillMount(() => {
 *     // Set up initial configuration before first render
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const hasRun = useRef(false);
    if (!hasRun.current) {
        hasRun.current = true;
        func();
    }
}
