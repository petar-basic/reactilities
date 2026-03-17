# usePageVisibility

Hook that tracks whether the current browser tab is visible. Uses the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) (`document.visibilityState`). Built on `useSyncExternalStore` for concurrent-safe updates.

## Usage

```tsx
import { usePageVisibility } from 'reactilities';

function VideoPlayer({ src }) {
  const isVisible = usePageVisibility();
  const videoRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      videoRef.current?.play();
    } else {
      videoRef.current?.pause();
    }
  }, [isVisible]);

  return <video ref={videoRef} src={src} />;
}
```

## API

### Parameters

None.

### Returns

`boolean` — `true` when the tab is active and visible, `false` when hidden (minimized, background tab, screen locked).

## Examples

### Pause polling when tab is hidden

```tsx
function LiveData() {
  const isVisible = usePageVisibility();
  const { data } = useFetch(isVisible ? '/api/live' : null);
  return <Chart data={data} />;
}
```

### Pause animations

```tsx
function AnimatedLogo() {
  const isVisible = usePageVisibility();

  return (
    <div style={{ animationPlayState: isVisible ? 'running' : 'paused' }}>
      <Logo />
    </div>
  );
}
```

### Track time spent on page

```tsx
function Analytics() {
  const isVisible = usePageVisibility();

  useUpdateEffect(() => {
    if (isVisible) {
      startTimer();
    } else {
      stopTimer();
      reportActiveTime();
    }
  }, [isVisible]);
}
```

## Notes

- Returns `true` on the server (SSR) as a safe default
- The `visibilitychange` event fires when the user switches tabs, minimizes the window, or locks the screen
- Useful for pausing timers, animations, WebSocket activity, or polling to save battery and bandwidth
