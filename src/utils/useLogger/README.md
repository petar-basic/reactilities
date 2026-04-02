# useLogger

Hook for logging component lifecycle events to the console during development. Logs mount, update (with changed props diff), and unmount events. Useful for debugging re-renders and understanding component lifecycles without a browser extension.

## Usage

```tsx
import { useLogger } from 'reactilities';

function MyComponent(props: { userId: string; theme: string }) {
  useLogger('MyComponent', props);

  return <div>...</div>;
}
// Console: [MyComponent] Mounted { userId: '1', theme: 'dark' }
// Console: [MyComponent] Updated { userId: '2', theme: 'dark' } — changed: { userId: '2' }
// Console: [MyComponent] Unmounted
```

## API

### Parameters

- **`componentName`** (`string`) - Label used to identify the component in log output
- **`props`** (`Record<string, unknown>`) - Object of values to track — can include props, state, or any derived values

### Returns

`void`

## Examples

### Debugging a data grid

```tsx
function DataGrid({ rows, columns, page, sortKey }: Props) {
  useLogger('DataGrid', { rowCount: rows.length, columns: columns.length, page, sortKey });

  return <table>...</table>;
}
```

### Tracking expensive renders

```tsx
function ExpensiveChart({ data, config, theme }: ChartProps) {
  useLogger('ExpensiveChart', { dataLength: data.length, config, theme });

  return <canvas />;
}
// If only `theme` changed, you'll see:
// [ExpensiveChart] Updated {...} — changed: { theme: 'light' }
// This tells you the component is re-rendering only because of theme
```

### Combined props and state

```tsx
function SearchResults({ query }: { query: string }) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useLogger('SearchResults', { query, page, loading });

  return <div>...</div>;
}
```

### Tracking context consumer renders

```tsx
function UserAvatar() {
  const user = useUserContext();
  useLogger('UserAvatar', { userId: user.id, avatar: user.avatarUrl });

  return <img src={user.avatarUrl} />;
}
```

## Features

- ✅ Logs on mount, update, and unmount
- ✅ Diffs current vs previous values and logs only what changed
- ✅ Works with any object — props, state, context values
- ✅ Zero runtime cost in production (not stripped automatically — remove hook in prod or wrap in `if (process.env.NODE_ENV !== 'production')`)
- ✅ Zero external dependencies

## Notes

- This hook is intended for development use. Remove it before shipping to production or wrap it in a dev-only condition.
- The diff is computed by reference equality (`!==`) — object references that change on every render will always appear as "changed" even if their content is the same. Use stable references or primitive values for accurate tracking.
- Unlike `useWhyDidYouRender`, this hook always logs on every update regardless of whether anything changed.

## When to Use

- **Quickly trace lifecycle** — mount/unmount without browser DevTools
- **Find unexpected renders** — spot components that re-render when they shouldn't
- **Debug prop drilling** — verify which values actually changed down the tree
