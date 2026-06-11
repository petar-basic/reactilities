# useFullscreen

Hook for controlling and tracking fullscreen state on any DOM element using the [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API). Handles vendor-prefixed differences across browsers (e.g. older desktop Safari's `webkit`-prefixed methods and events) and exposes an `isSupported` flag.

## Usage

```tsx
import { useFullscreen } from 'reactilities';

function VideoPlayer({ src }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle, isSupported } = useFullscreen(containerRef);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <video src={src} style={{ width: '100%' }} />
      {isSupported && (
        <button
          onClick={toggle}
          style={{ position: 'absolute', bottom: 8, right: 8 }}
        >
          {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
        </button>
      )}
    </div>
  );
}
```

## API

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `ref` | `RefObject<HTMLElement \| null>` | Ref attached to the element to make fullscreen |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `isFullscreen` | `boolean` | Whether the element is currently in fullscreen |
| `enter` | `() => Promise<void>` | Request fullscreen on the element |
| `exit` | `() => Promise<void>` | Exit fullscreen |
| `toggle` | `() => Promise<void>` | Toggle between fullscreen and normal |
| `isSupported` | `boolean` | Whether the Fullscreen API (standard or `webkit`-prefixed) is available in this environment |

## Examples

### Image Gallery

```tsx
function Gallery({ images }) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, enter, exit } = useFullscreen(galleryRef);

  return (
    <div ref={galleryRef} className={isFullscreen ? 'gallery-fullscreen' : 'gallery'}>
      {images.map(img => <img key={img.id} src={img.url} />)}
      <button onClick={isFullscreen ? exit : enter}>
        {isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
      </button>
    </div>
  );
}
```

### Presentation Mode

```tsx
function Presentation({ slides }) {
  const slideRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(slideRef);

  useEventListener(window, 'keydown', (e) => {
    if (e.key === 'F11') { e.preventDefault(); toggle(); }
  });

  return (
    <div ref={slideRef}>
      <Slides slides={slides} />
      <button onClick={toggle}>
        {isFullscreen ? 'Exit presentation' : 'Start presentation'}
      </button>
    </div>
  );
}
```

## Notes

- `isFullscreen` is true only when the specific `ref` element is the fullscreen element — not when any other element is fullscreen
- `enter()` is a no-op if the element is already fullscreen; `exit()` is a no-op if not in fullscreen
- The Fullscreen API requires a user gesture (click, keypress) — it cannot be triggered programmatically on page load
- Vendor-prefixed APIs are handled internally: the hook falls back to `webkitRequestFullscreen` / `webkitExitFullscreen` / `webkitfullscreenchange` on older desktop Safari
- Use the `isSupported` flag to feature-detect and hide fullscreen UI on browsers without the API (it is `false` during SSR)
