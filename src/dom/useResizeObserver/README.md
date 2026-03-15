# useResizeObserver

Hook for observing size changes of a DOM element using the `ResizeObserver` API. More accurate than window resize events for tracking individual element dimensions. Useful for responsive components, charts, and dynamic layouts.

## Usage

```tsx
import { useResizeObserver } from 'reactilities';

function ResponsiveChart() {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={width} height={height}>
        {/* chart content */}
      </svg>
    </div>
  );
}
```

## API

### Returns

| Property  | Type                            | Description                                     |
|-----------|---------------------------------|-------------------------------------------------|
| `ref`     | `RefObject<T \| null>`          | Attach to the element you want to observe       |
| `width`   | `number`                        | Current `contentRect.width` (0 before first observation) |
| `height`  | `number`                        | Current `contentRect.height` (0 before first observation) |
| `entry`   | `UseResizeObserverEntry \| undefined` | Full entry for advanced usage (borderBoxSize, etc.) |

### Type parameter

- **`T extends Element`** — the element type (e.g. `HTMLDivElement`, `HTMLCanvasElement`)

## Examples

### Container queries in JavaScript

```tsx
function AdaptiveCard() {
  const { ref, width } = useResizeObserver<HTMLDivElement>();
  const isNarrow = width > 0 && width < 300;

  return (
    <div ref={ref} className={isNarrow ? 'card--compact' : 'card--full'}>
      {isNarrow ? <CompactView /> : <FullView />}
    </div>
  );
}
```

### Dynamic text truncation

```tsx
function TruncatedText({ text }: { text: string }) {
  const { ref, width } = useResizeObserver<HTMLParagraphElement>();
  const charsVisible = Math.floor(width / 8);

  return (
    <p ref={ref}>
      {text.length > charsVisible ? text.slice(0, charsVisible) + '…' : text}
    </p>
  );
}
```

### D3 / canvas chart sizing

```tsx
function BarChart({ data }: { data: number[] }) {
  const { ref, width, height } = useResizeObserver<HTMLDivElement>();

  useEffect(() => {
    if (width && height) drawChart(ref.current!, data, width, height);
  }, [data, width, height]);

  return <div ref={ref} style={{ width: '100%', height: 300 }} />;
}
```

## Features

- Uses native `ResizeObserver` — element-level, not window-level
- Gracefully degrades when `ResizeObserver` is not available (returns zero dimensions)
- Automatic observer disconnect on unmount
- Generic type parameter for element-specific TypeScript types
- Exposes full `ResizeObserverEntry` for advanced border-box / content-box access

## Notes

- `width` and `height` are `0` until the first observation fires
- Check `width > 0` before rendering size-dependent content to avoid a layout flash
- For window-level size tracking, use `useWindowSize` instead
