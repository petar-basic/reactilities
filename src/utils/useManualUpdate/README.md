# useManualUpdate

Hook that returns a function to manually trigger a component re-render. Useful when you need to force a refresh after mutating an external ref, updating a value outside React state, or imperatively invalidating derived data.

## Usage

```tsx
import { useManualUpdate } from 'reactilities';

function ExternalDataView() {
  const forceUpdate = useManualUpdate();
  const dataRef = useRef({ count: 0 });

  return (
    <div>
      <p>Count: {dataRef.current.count}</p>
      <button onClick={() => { dataRef.current.count += 1; forceUpdate(); }}>
        Increment
      </button>
    </div>
  );
}
```

## API

### Returns

`() => void` — a stable function that, when called, triggers a re-render of the component.

## Examples

### Sync an external store

```tsx
function StoreView() {
  const forceUpdate = useManualUpdate();

  useEffect(() => {
    // Subscribe to an external store that doesn't use React state
    const unsubscribe = externalStore.subscribe(forceUpdate);
    return unsubscribe;
  }, [forceUpdate]);

  return <div>{externalStore.getValue()}</div>;
}
```

### Invalidate a ref-cached value

```tsx
function CachedCalculation({ data }: { data: number[] }) {
  const forceUpdate = useManualUpdate();
  const resultRef = useRef<number | null>(null);

  const recalculate = () => {
    resultRef.current = heavyCompute(data);
    forceUpdate();
  };

  return (
    <div>
      <p>Result: {resultRef.current ?? '—'}</p>
      <button onClick={recalculate}>Calculate</button>
    </div>
  );
}
```

### Refresh after imperative DOM mutation

```tsx
function FocusTracker() {
  const forceUpdate = useManualUpdate();
  const focusedRef = useRef<string | null>(null);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      focusedRef.current = (e.target as HTMLElement).id ?? null;
      forceUpdate();
    };
    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [forceUpdate]);

  return <p>Focused: {focusedRef.current ?? 'none'}</p>;
}
```

## Features

- Stable function reference — safe to include in dependency arrays
- Counter wraps at 1,000,000 to prevent unbounded growth
- Zero external dependencies

## Notes

- Prefer React state (`useState`, `useReducer`) when possible — `useManualUpdate` is an escape hatch for cases where state is genuinely impractical
- Overusing this hook can make data flow harder to follow; reserve it for integrating with non-React systems
