# useFullscreen

Hook for controlling and tracking fullscreen state on any DOM element using the [Fullscreen API](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API).

## Usage

```tsx
import { useFullscreen } from 'reactilities';

function VideoPlayer({ src }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(containerRef);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <video src={src} style={{ width: '100%' }} />
      <button
        onClick={toggle}
        style={{ position: 'absolute', bottom: 8, right: 8 }}
      >
        {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
      </button>
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
- On browsers that don't support fullscreen, the promises will simply not resolve — consider feature-checking `document.fullscreenEnabled` for UI
