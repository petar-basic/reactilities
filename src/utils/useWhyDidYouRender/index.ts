import { useEffect, useRef } from "react";

type TrackedValues = Record<string, unknown>;

interface ChangedEntry {
  previous: unknown;
  current: unknown;
}

/**
 * Hook for debugging unnecessary re-renders by logging which props or state values changed
 * On every render after the first, compares current values with previous and logs the diff
 * Skips all work in production builds (process.env.NODE_ENV === 'production')
 * Remove this hook before shipping — it is a development-only debugging aid
 *
 * @param componentName - Label to identify the component in log output
 * @param values - Object of values to track (props, state, or any derived values)
 *
 * @example
 * function ExpensiveComponent({ userId, theme, data }: Props) {
 *   useWhyDidYouRender('ExpensiveComponent', { userId, theme, data });
 *
 *   return <div>...</div>;
 * }
 * // Console: [useWhyDidYouRender] ExpensiveComponent re-rendered because:
 * //   data: [Array(3)] → [Array(4)]
 *
 * @example
 * // Track both props and relevant state together
 * const [count, setCount] = useState(0);
 *
 * useWhyDidYouRender('Counter', { count, userId: props.userId });
 */
export function useWhyDidYouRender(componentName: string, values: TrackedValues): void {
  const previousRef = useRef<TrackedValues | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    if (previousRef.current === null) {
      previousRef.current = values;
      return;
    }

    const changed: Record<string, ChangedEntry> = {};
    const allKeys = new Set([
      ...Object.keys(previousRef.current),
      ...Object.keys(values)
    ]);

    for (const key of allKeys) {
      if (previousRef.current[key] !== values[key]) {
        changed[key] = {
          previous: previousRef.current[key],
          current: values[key]
        };
      }
    }

    if (Object.keys(changed).length > 0) {
      console.group(`[useWhyDidYouRender] ${componentName} re-rendered because:`);
      for (const [key, { previous, current }] of Object.entries(changed)) {
        console.log(`  ${key}:`, previous, '→', current);
      }
      console.groupEnd();
    }

    previousRef.current = values;
  });
}
