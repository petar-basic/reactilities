# useUpdateEffect

Identical to `useEffect` but skips execution on the initial mount. Only runs when dependencies change after the first render.

## Usage

```tsx
import { useUpdateEffect } from 'reactilities';

function SearchResults({ query }) {
  useUpdateEffect(() => {
    // Won't fire on first render — only when query actually changes
    analytics.track('search', { query });
  }, [query]);

  return <Results query={query} />;
}
```

## API

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `effect` | `EffectCallback` | Same as the first argument to `useEffect` |
| `deps` | `DependencyList` | Same as the second argument to `useEffect` |

### Returns

`void`

## Examples

### Sync to external system on changes only

```tsx
function UserProfile({ userId }) {
  const [profile, setProfile] = useState(null);

  // Fetch on every userId change, but not on mount (handled elsewhere)
  useUpdateEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setProfile);
  }, [userId]);
}
```

### Show "unsaved changes" banner

```tsx
function Editor({ initialContent }) {
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);

  // Only mark dirty after the first change, not on mount
  useUpdateEffect(() => {
    setIsDirty(true);
  }, [content]);
}
```

### Notification on value change

```tsx
function StockPrice({ symbol }) {
  const { data: price } = useFetch(`/api/price/${symbol}`);

  useUpdateEffect(() => {
    if (price > alertThreshold) notify(`${symbol} is above ${alertThreshold}`);
  }, [price]);
}
```

## Notes

- The effect cleanup (returned function) still works normally — it runs before the next effect call and on unmount
- Equivalent to: checking a `isFirstRender` ref inside a regular `useEffect`
- Commonly copy-pasted across React codebases — one of the most frequently requested utility hooks
