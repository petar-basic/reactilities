import { useEffect, useRef } from "react";

/**
 * Hook for logging component lifecycle events to the console during development
 * Logs mount, update (with changed props), and unmount events
 * Useful for debugging re-renders and understanding component lifecycles
 *
 * @param componentName - Label to identify the component in log output
 * @param props - The component's props object to track
 *
 * @example
 * function MyComponent(props: { userId: string; theme: string }) {
 *   useLogger('MyComponent', props);
 *
 *   return <div>...</div>;
 * }
 * // Console: [MyComponent] Mounted { userId: '1', theme: 'dark' }
 * // Console: [MyComponent] Updated { userId: '2', theme: 'dark' } — changed: { userId: '2' }
 * // Console: [MyComponent] Unmounted
 *
 * @example
 * // Track only specific values
 * function DataGrid({ rows, columns, page }: Props) {
 *   useLogger('DataGrid', { rows: rows.length, columns: columns.length, page });
 *   return <table>...</table>;
 * }
 */
export function useLogger(componentName: string, props: Record<string, unknown>): void {
  const isFirstRender = useRef(true);
  const prevPropsRef = useRef(props);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.log(`[${componentName}] Mounted`, props);
    } else {
      const changed: Record<string, unknown> = {};
      const allKeys = new Set([...Object.keys(prevPropsRef.current), ...Object.keys(props)]);

      for (const key of allKeys) {
        if (prevPropsRef.current[key] !== props[key]) {
          changed[key] = props[key];
        }
      }

      console.log(`[${componentName}] Updated`, props, '— changed:', changed);
      prevPropsRef.current = props;
    }
  });

  useEffect(() => {
    return () => {
      console.log(`[${componentName}] Unmounted`);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
