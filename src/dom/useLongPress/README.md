# useLongPress

Hook that detects a long press (hold) on any element. Returns pointer event handlers to spread directly onto JSX. Works on both mouse and touch devices via the Pointer Events API.

## Usage

```tsx
import { useLongPress } from 'reactilities';

function ListItem({ item, onLongPress }) {
  const handlers = useLongPress(() => onLongPress(item), { threshold: 600 });

  return (
    <li {...handlers} style={{ userSelect: 'none' }}>
      {item.name}
    </li>
  );
}
```

## API

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `callback` | `(event: React.PointerEvent) => void` | — | Called when the hold duration reaches the threshold |
| `options.threshold` | `number` | `500` | Hold duration in milliseconds before firing |
| `options.onStart` | `(event) => void` | — | Called immediately when press begins |
| `options.onCancel` | `(event) => void` | — | Called when press ends before the threshold |

### Returns

An object of event handlers to spread on the target element:

| Handler | Description |
|---------|-------------|
| `onPointerDown` | Starts the hold timer |
| `onPointerUp` | Cancels if released before threshold |
| `onPointerLeave` | Cancels if pointer moves off element |

## Examples

### Context Menu on Mobile

```tsx
function Photo({ src, onContextMenu }) {
  const [pressing, setPressing] = useState(false);

  const handlers = useLongPress(onContextMenu, {
    threshold: 700,
    onStart: () => setPressing(true),
    onCancel: () => setPressing(false),
  });

  return (
    <img
      src={src}
      {...handlers}
      style={{
        opacity: pressing ? 0.7 : 1,
        transition: 'opacity 0.1s',
      }}
    />
  );
}
```

### Drag Initiation

```tsx
const handlers = useLongPress(
  () => startDrag(item),
  { threshold: 400, onStart: () => setIsPressing(true) }
);

return <div {...handlers}>{item.name}</div>;
```

### Delete on Hold

```tsx
const handlers = useLongPress(() => deleteItem(id), { threshold: 1000 });

return (
  <button {...handlers} title="Hold 1 second to delete">
    🗑️
  </button>
);
```

## Notes

- Uses Pointer Events (`onPointerDown`/`onPointerUp`/`onPointerLeave`) — works for mouse, touch, and pen input
- Always uses the latest `callback` reference (via ref pattern) — closures stay fresh without recreating handlers
- Add `touch-action: none` and `user-select: none` CSS to prevent browser default gestures interfering with long press on mobile
