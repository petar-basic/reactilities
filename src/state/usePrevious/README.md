# usePrevious

Hook that returns the value from the previous render. Useful for comparing current and previous values, detecting change direction, or skipping effects when a value hasn't actually changed.

## Usage

```tsx
import { usePrevious } from 'reactilities';

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {prevCount ?? 'none'}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

## API

### Parameters

- **`value`** (`T`) — the value to track across renders

### Returns

`T | undefined` — the value from the previous render, or `undefined` on the first render.

## Examples

### Detect direction of change

```tsx
function PriceDisplay({ price }: { price: number }) {
  const prevPrice = usePrevious(price);

  const direction =
    prevPrice === undefined ? 'neutral'
    : price > prevPrice ? 'up'
    : price < prevPrice ? 'down'
    : 'neutral';

  return <span className={`price price--${direction}`}>{price}</span>;
}
```

### Skip effect when value unchanged

```tsx
function DataFetcher({ id }: { id: string }) {
  const prevId = usePrevious(id);

  useEffect(() => {
    if (prevId !== id) {
      fetchData(id);
    }
  }, [id, prevId]);
}
```

### Animate between values

```tsx
function AnimatedNumber({ value }: { value: number }) {
  const prevValue = usePrevious(value);
  const isIncreasing = (prevValue ?? 0) < value;

  return (
    <span className={isIncreasing ? 'animate-up' : 'animate-down'}>
      {value}
    </span>
  );
}
```

### Undo functionality

```tsx
function EditableText() {
  const [text, setText] = useState('');
  const prevText = usePrevious(text);

  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => prevText !== undefined && setText(prevText)}>
        Undo
      </button>
    </div>
  );
}
```

## Features

- Returns `undefined` on first render (no previous value yet)
- Works with any value type — primitives, objects, arrays
- Zero overhead — single `useRef` + `useEffect`

## Notes

- The returned value is always one render behind — it reflects what `value` was on the *previous* render
- On the first render `undefined` is returned; use `?? fallback` or a nullish check before use
