# useMousePosition

Hook that tracks the current mouse cursor position within the viewport. Updates on every `mousemove` event with a passive listener for performance.

## Usage

```tsx
import { useMousePosition } from 'reactilities';

function CustomCursor() {
  const { x, y } = useMousePosition();

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'blue',
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}
```

## API

### Parameters

None.

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | Horizontal cursor position (px from left edge of viewport) |
| `y` | `number` | Vertical cursor position (px from top edge of viewport) |

Both start at `0` on mount (before the first mouse movement).

## Examples

### Tooltip that follows the cursor

```tsx
function FollowTooltip({ children, label }) {
  const { x, y } = useMousePosition();

  return (
    <div>
      {children}
      <div
        style={{ position: 'fixed', left: x + 12, top: y + 12, pointerEvents: 'none' }}
        className="tooltip"
      >
        {label}
      </div>
    </div>
  );
}
```

### Parallax effect

```tsx
function ParallaxBg() {
  const { x, y } = useMousePosition();
  const { width, height } = useWindowSize();

  const offsetX = ((x / width) - 0.5) * 30;
  const offsetY = ((y / height) - 0.5) * 30;

  return (
    <div
      style={{
        backgroundPosition: `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`,
      }}
    />
  );
}
```

## Notes

- Uses a passive `mousemove` listener on `window` — does not prevent default scrolling behavior
- Position is relative to the viewport (`clientX`/`clientY`), not the document
- Returns `{ x: 0, y: 0 }` until the user moves the mouse
