# useScrollPosition

Hook for tracking the window scroll position. Automatically updates on scroll using a passive listener and `useSyncExternalStore`. Returns `{ x: 0, y: 0 }` during SSR.

## Usage

```tsx
import { useScrollPosition } from 'reactilities';

function BackToTop() {
  const { y } = useScrollPosition();

  if (y < 300) return null;

  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      Back to top
    </button>
  );
}
```

## API

### Returns

`{ x: number, y: number }` — current scroll position of the window in pixels.

| Property | Type     | Description                              |
|----------|----------|------------------------------------------|
| `x`      | `number` | `window.scrollX` in pixels (0 on SSR)   |
| `y`      | `number` | `window.scrollY` in pixels (0 on SSR)   |

## Examples

### Sticky header with shadow

```tsx
function Header() {
  const { y } = useScrollPosition();

  return (
    <header style={{ boxShadow: y > 0 ? '0 2px 8px rgba(0,0,0,.15)' : 'none' }}>
      Navigation
    </header>
  );
}
```

### Reading progress bar

```tsx
function ReadingProgress() {
  const { y } = useScrollPosition();
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (y / docHeight) * 100 : 0;

  return (
    <div
      style={{ width: `${progress}%`, height: 3, background: 'blue', position: 'fixed', top: 0 }}
    />
  );
}
```

### Infinite scroll trigger

```tsx
function InfiniteList() {
  const { y } = useScrollPosition();
  const threshold = document.documentElement.scrollHeight - window.innerHeight - 200;

  useEffect(() => {
    if (y >= threshold) loadNextPage();
  }, [y, threshold]);
}
```

## Features

- Uses `useSyncExternalStore` — concurrent-safe, no tearing
- Passive scroll listener — zero performance impact on scrolling
- Stable object reference — only creates a new object when position actually changes
- SSR-safe — returns `{ x: 0, y: 0 }` on the server
