# useCounter

Hook for managing a numeric counter with optional min/max bounds and custom step.

## Usage

```tsx
import { useCounter } from 'reactilities';

function QuantitySelector() {
  const { count, increment, decrement, reset } = useCounter(1, { min: 1, max: 99 });

  return (
    <div>
      <button onClick={decrement}>−</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## API

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `initialValue` | `number` | `0` | Starting value |
| `options.min` | `number` | — | Minimum allowed value |
| `options.max` | `number` | — | Maximum allowed value |
| `options.step` | `number` | `1` | Amount to increment/decrement by |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `count` | `number` | Current counter value |
| `increment` | `() => void` | Add `step` to count (clamped to max) |
| `decrement` | `() => void` | Subtract `step` from count (clamped to min) |
| `reset` | `() => void` | Reset to `initialValue` |
| `set` | `(value: number) => void` | Set an explicit value (clamped to min/max) |

All functions have stable references via `useCallback`.

## Examples

### Pagination

```tsx
function Pagination({ totalPages }) {
  const { count: page, increment, decrement, set } = useCounter(1, {
    min: 1,
    max: totalPages
  });

  return (
    <nav>
      <button onClick={decrement} disabled={page === 1}>Previous</button>
      <span>Page {page} of {totalPages}</span>
      <button onClick={increment} disabled={page === totalPages}>Next</button>
      <button onClick={() => set(1)}>First</button>
    </nav>
  );
}
```

### Step Counter

```tsx
const { count, increment, decrement } = useCounter(0, { step: 5, min: 0, max: 100 });
// increment() → 5, 10, 15 …
```

## Notes

- `set()` and `reset()` both clamp values to `min`/`max` if defined
- The initial value is also clamped to `min`/`max` on initialization
