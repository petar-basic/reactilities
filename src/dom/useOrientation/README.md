# useOrientation

Hook for tracking device screen orientation. Returns whether the device is in portrait or landscape mode and the current rotation angle. Useful for adapting layouts in mobile-first or PWA applications.

## Usage

```tsx
import { useOrientation } from 'reactilities';

function MobileLayout() {
  const { orientation } = useOrientation();

  return (
    <div className={orientation === 'landscape' ? 'layout-horizontal' : 'layout-vertical'}>
      Content
    </div>
  );
}
```

## API

### Returns

| Property | Type | Description |
|---|---|---|
| `orientation` | `'portrait' \| 'landscape'` | Current orientation type |
| `angle` | `number` | Rotation angle in degrees (0, 90, -90, 180) |

## Examples

### Rotate-to-continue prompt

```tsx
function VideoPlayer() {
  const { orientation } = useOrientation();

  if (orientation === 'portrait') {
    return (
      <div className="rotate-prompt">
        <RotateIcon />
        <p>Rotate your device for the best experience</p>
      </div>
    );
  }

  return <Video src="/movie.mp4" />;
}
```

### Landscape-only content

```tsx
function GameCanvas() {
  const { orientation } = useOrientation();

  return (
    <>
      {orientation === 'portrait' && (
        <div className="overlay">Please rotate your device to play</div>
      )}
      <canvas id="game" style={{ display: orientation === 'landscape' ? 'block' : 'none' }} />
    </>
  );
}
```

### Responsive split layout

```tsx
function SplitView({ sidebar, content }: Props) {
  const { orientation } = useOrientation();

  return (
    <div style={{
      display: 'flex',
      flexDirection: orientation === 'landscape' ? 'row' : 'column'
    }}>
      <aside style={{ width: orientation === 'landscape' ? '30%' : '100%' }}>
        {sidebar}
      </aside>
      <main>{content}</main>
    </div>
  );
}
```

### Angle-based animation

```tsx
function CompassRose() {
  const { angle } = useOrientation();

  return (
    <div style={{ transform: `rotate(${-angle}deg)`, transition: 'transform 0.3s' }}>
      <CompassIcon />
    </div>
  );
}
```

## Features

- ✅ Semantic `'portrait'` / `'landscape'` values
- ✅ Raw angle in degrees for precise control
- ✅ Listens to both `screen.orientation` API and legacy `orientationchange` event
- ✅ SSR-safe (returns `'portrait'` with angle `0` on the server)
- ✅ Proper cleanup on unmount

## Notes

- Returns `'portrait'` as the default/fallback in SSR environments
- Angle values follow the `ScreenOrientation` API: `0` (portrait), `90` (landscape-primary), `-90` / `270` (landscape-secondary), `180` (portrait flipped)
- Both `screen.orientation.addEventListener` and the legacy `window.orientationchange` are registered for maximum browser compatibility
