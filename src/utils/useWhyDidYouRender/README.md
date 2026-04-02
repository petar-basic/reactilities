# useWhyDidYouRender

Hook for debugging unnecessary re-renders by logging exactly which props or state values changed between renders. Only active in development — no-ops in production builds.

## Usage

```tsx
import { useWhyDidYouRender } from 'reactilities';

function ExpensiveComponent({ userId, theme, data }: Props) {
  useWhyDidYouRender('ExpensiveComponent', { userId, theme, data });

  return <div>...</div>;
}
// Console group: [useWhyDidYouRender] ExpensiveComponent re-rendered because:
//   data: [Array(3)] → [Array(4)]
```

## API

### Parameters

- **`componentName`** (`string`) - Label to identify the component in log output
- **`values`** (`Record<string, unknown>`) - Object of values to track between renders

### Returns

`void`

## Examples

### Debugging a memoized component

```tsx
const HeavyTable = memo(({ rows, filters, sortConfig }: Props) => {
  useWhyDidYouRender('HeavyTable', { rows, filters, sortConfig });

  return <table>...</table>;
});
// If memo is not working, this will tell you which prop changed reference
```

### Tracking context re-renders

```tsx
function ThemeConsumer() {
  const theme = useThemeContext();
  useWhyDidYouRender('ThemeConsumer', { theme });

  return <div style={{ color: theme.color }}>Content</div>;
}
```

### Finding unstable references

```tsx
// Common issue: inline objects/arrays create new references on every render
function Parent() {
  return (
    // This creates a new object reference on every Parent render
    <Child config={{ debug: true }} />
  );
}

function Child({ config }: { config: { debug: boolean } }) {
  useWhyDidYouRender('Child', { config });
  // Will log: config: {debug: true} → {debug: true}
  // Even though the values are the same — the reference changed!
  return <div />;
}
```

### Debugging React.memo not working

```tsx
const Button = memo(({ onClick, label, disabled }: ButtonProps) => {
  useWhyDidYouRender('Button', { onClick, label, disabled });
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
});

// If you see onClick changing on every render, wrap the parent's handler in useCallback
```

## Features

- ✅ Logs only when something actually changed — no noise on unchanged renders
- ✅ Shows both the previous and current value side-by-side in the console
- ✅ Uses `console.group` for clean, collapsible output
- ✅ **No-op in production** — `process.env.NODE_ENV === 'production'` check skips all logic
- ✅ Zero external dependencies

## Notes

- Comparison is by **reference equality** (`!==`). Primitive values (`string`, `number`, `boolean`) compare by value; objects and arrays compare by reference. A new `{}` or `[]` literal on every render will always show as changed even if the content is identical.
- The hook does **not** log on the first render — only on subsequent renders where a value changed.
- Unlike `useLogger`, this hook is silent when nothing changed, making it easier to spot the problematic renders in a noisy component tree.

## When to Use

- **React.memo not working** — find which prop broke memoization
- **useCallback/useMemo debugging** — verify stable references
- **Context performance** — find what causes context consumers to re-render
- **Performance profiling** — identify the root cause of cascade re-renders
