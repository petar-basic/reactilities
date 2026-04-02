# useThrottleCallback

Hook for throttling a callback function. Returns a stable throttled version of the callback that limits how often it can be invoked. Unlike `useThrottle` which throttles values, this throttles the function call itself.

## Usage

```tsx
import { useThrottleCallback } from 'reactilities';

function InfiniteList() {
  const loadMore = useThrottleCallback(() => {
    fetchNextPage();
  }, 1000);

  return <div onScroll={loadMore}>...</div>;
}
```

## API

### Parameters

- **`callback`** (`T extends (...args: any[]) => any`) - The function to throttle
- **`interval`** (`number`) - Minimum time in milliseconds between invocations (default: `500`)

### Returns

`(...args: Parameters<T>) => void` - A throttled version of the callback

## Examples

### Scroll-triggered loading

```tsx
function Feed() {
  const [page, setPage] = useState(1);

  const handleScroll = useThrottleCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      setPage(p => p + 1);
    }
  }, 500);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return <div>Content...</div>;
}
```

### Mouse move tracking

```tsx
function DrawingCanvas() {
  const [path, setPath] = useState<Point[]>([]);

  const recordPoint = useThrottleCallback((e: MouseEvent) => {
    setPath(prev => [...prev, { x: e.clientX, y: e.clientY }]);
  }, 50);

  return <canvas onMouseMove={recordPoint} />;
}
```

### Button click rate limiting

```tsx
function LikeButton({ postId }: { postId: string }) {
  const sendLike = useThrottleCallback(() => {
    api.post(`/posts/${postId}/like`);
  }, 2000);

  return <button onClick={sendLike}>Like</button>;
}
```

### Window resize handler

```tsx
function ResponsiveChart() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleResize = useThrottleCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, 100);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return <Chart width={dimensions.width} height={dimensions.height} />;
}
```

## Features

- ✅ Throttles function calls, not just values
- ✅ Returned function has a stable reference (only changes when `interval` changes)
- ✅ Always calls the latest version of the callback
- ✅ Trailing call guaranteed — last invocation always fires after the interval
- ✅ TypeScript generic inference for argument types
- ✅ Zero external dependencies

## Notes

- The first call always fires immediately
- If calls come in faster than the interval, the last queued call fires after the interval elapses
- The returned function's reference only changes when `interval` changes — safe to use in dependency arrays
- Prefer this over `useThrottle` when you want to throttle a side effect rather than a derived value

## When to Use

- **Scroll handlers** — trigger pagination or position updates at a controlled rate
- **Mouse/touch tracking** — record positions without overwhelming state
- **API rate limiting** — cap the number of requests a user action can trigger
- **Window resize** — recalculate layout at a manageable frequency
- **Button clicks** — prevent double-submit or rapid-fire API calls
