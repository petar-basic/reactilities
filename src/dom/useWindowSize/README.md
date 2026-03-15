# useWindowSize

Hook for tracking the browser window dimensions. Automatically updates on resize with optimal performance using `useSyncExternalStore`. Returns `{ width: 0, height: 0 }` during SSR.

## Usage

```tsx
import { useWindowSize } from 'reactilities';

function ResponsiveComponent() {
  const { width, height } = useWindowSize();

  return (
    <div>
      <p>Window: {width} x {height}</p>
      {width < 768 ? <MobileLayout /> : <DesktopLayout />}
    </div>
  );
}
```

## API

### Returns

`{ width: number, height: number }` — current inner dimensions of the browser window in pixels.

| Property | Type     | Description                          |
|----------|----------|--------------------------------------|
| `width`  | `number` | `window.innerWidth` in pixels (0 on SSR)  |
| `height` | `number` | `window.innerHeight` in pixels (0 on SSR) |

## Examples

### Responsive layouts

```tsx
function Navigation() {
  const { width } = useWindowSize();
  const isMobile = width > 0 && width < 768;
  const isTablet = width >= 768 && width < 1024;

  if (isMobile) return <HamburgerMenu />;
  if (isTablet) return <TabletNav />;
  return <DesktopNav />;
}
```

### Dynamic canvas

```tsx
function Canvas() {
  const { width, height } = useWindowSize();
  return <canvas width={width} height={height} />;
}
```

### Conditional column count

```tsx
function Grid({ items }: { items: string[] }) {
  const { width } = useWindowSize();
  const columns = width >= 1024 ? 3 : width >= 640 ? 2 : 1;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map(item => <div key={item}>{item}</div>)}
    </div>
  );
}
```

## Features

- Uses `useSyncExternalStore` — concurrent-safe, no tearing
- Passive resize listener for zero scroll-jank overhead
- Stable object reference — only creates a new object when dimensions actually change
- SSR-safe — returns `{ width: 0, height: 0 }` on the server

## Notes

- Check `width > 0` before deriving breakpoints to avoid a flash on the first SSR render
- For element-level size tracking, use `useResizeObserver` instead
