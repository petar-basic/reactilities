# useKeyboardShortcuts

Hook for handling keyboard shortcuts. Supports modifier keys (Ctrl, Alt, Shift, Meta) and complex key combinations defined as an array of shortcut objects.

## Usage

```tsx
import { useKeyboardShortcuts } from 'reactilities';

function Editor() {
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      handler: () => saveDocument(),
      preventDefault: true
    },
    {
      key: 'z',
      ctrl: true,
      handler: () => undo()
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      handler: () => redo()
    }
  ]);

  return <textarea />;
}
```

## API

### Signature

```ts
function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options?: UseKeyboardShortcutsOptions
): void
```

### Parameters

- **`shortcuts`** (`KeyboardShortcut[]`) - Array of shortcut configuration objects.
- **`options`** (`UseKeyboardShortcutsOptions`, optional) - Configuration for event handling.

#### `KeyboardShortcut`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `key` | `string` | required | Key to match. Compared case-insensitively against both `event.key` and `event.code` (e.g. `'s'`, `'Escape'`, `'ArrowDown'`). |
| `ctrl` | `boolean` | `false` | Require the Control key. |
| `shift` | `boolean` | `false` | Require the Shift key. |
| `alt` | `boolean` | `false` | Require the Alt/Option key. |
| `meta` | `boolean` | `false` | Require the Meta (Command/Windows) key. |
| `handler` | `(event: KeyboardEvent) => void` | required | Called when the shortcut matches. |
| `preventDefault` | `boolean` | `false` | Call `event.preventDefault()` on match. |
| `stopPropagation` | `boolean` | `false` | Call `event.stopPropagation()` on match. |

#### `UseKeyboardShortcutsOptions`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `HTMLElement \| Document \| Window` | `document` | Element the `keydown` listener is attached to. |
| `enabled` | `boolean` | `true` | When `false`, no listener is attached. |

### Returns

`void`

## Helpers

### `createShortcut`

Convenience factory for building `KeyboardShortcut` objects.

```ts
function createShortcut(
  key: string,
  modifiers?: Partial<Pick<KeyboardShortcut, 'ctrl' | 'shift' | 'alt' | 'meta'>>,
  handler: (event: KeyboardEvent) => void,
  options?: Partial<Pick<KeyboardShortcut, 'preventDefault' | 'stopPropagation'>>
): KeyboardShortcut
```

> **Note:** Unlike raw shortcut objects, `createShortcut` sets `preventDefault: true` by default, since most named shortcuts (save, copy, undo, etc.) should suppress the browser's default action. Pass `{ preventDefault: false }` in the options argument to opt out.

```tsx
import { useKeyboardShortcuts, createShortcut } from 'reactilities';

function Editor() {
  useKeyboardShortcuts([
    createShortcut('s', { ctrl: true }, handleSave),
    createShortcut('Escape', {}, handleClose),
    createShortcut('Enter', { shift: true }, handleSubmit, { preventDefault: false })
  ]);

  return <textarea />;
}
```

### `COMMON_SHORTCUTS`

A map of factory functions for typical application shortcuts. Each entry takes a handler and returns a `KeyboardShortcut` (built via `createShortcut`, so `preventDefault` is `true`).

Available keys: `SAVE`, `COPY`, `PASTE`, `CUT`, `UNDO`, `REDO`, `SELECT_ALL`, `FIND`, `NEW`, `OPEN`, `CLOSE`, `DELETE`, `ENTER`, `TAB`, `SHIFT_TAB`.

```tsx
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from 'reactilities';

function Editor() {
  useKeyboardShortcuts([
    COMMON_SHORTCUTS.SAVE(handleSave),
    COMMON_SHORTCUTS.UNDO(handleUndo),
    COMMON_SHORTCUTS.REDO(handleRedo),
    COMMON_SHORTCUTS.CLOSE(handleClose)
  ]);

  return <textarea />;
}
```

## Examples

### Text Editor Shortcuts

```tsx
function TextEditor() {
  const [content, setContent] = useState('');

  useKeyboardShortcuts([
    { key: 's', ctrl: true, preventDefault: true, handler: () => saveContent(content) },
    { key: 'b', ctrl: true, preventDefault: true, handler: () => formatBold() },
    { key: 'i', ctrl: true, preventDefault: true, handler: () => formatItalic() },
    { key: 'z', ctrl: true, handler: () => undo() },
    { key: 'y', ctrl: true, handler: () => redo() }
  ]);

  return (
    <textarea
      value={content}
      onChange={(e) => setContent(e.target.value)}
    />
  );
}
```

### Modal Controls

```tsx
function Modal({ isOpen, onClose, handleSubmit }) {
  useKeyboardShortcuts(
    [
      { key: 'Escape', handler: onClose },
      { key: 'Enter', handler: handleSubmit }
    ],
    { enabled: isOpen }
  );

  if (!isOpen) return null;

  return (
    <div className="modal">
      <p>Press ESC to close or Enter to submit</p>
    </div>
  );
}
```

### Navigation Shortcuts

```tsx
function App() {
  const navigate = useNavigate();

  useKeyboardShortcuts([
    { key: 'h', ctrl: true, preventDefault: true, handler: () => navigate('/') },
    { key: 'd', ctrl: true, preventDefault: true, handler: () => navigate('/dashboard') },
    { key: 'p', ctrl: true, preventDefault: true, handler: () => navigate('/profile') },
    { key: '/', ctrl: true, preventDefault: true, handler: () => toggleCommandPalette() }
  ]);

  return <Routes />;
}
```

### Media Player Controls

```tsx
function VideoPlayer() {
  const videoRef = useRef(null);

  useKeyboardShortcuts([
    { key: 'Space', preventDefault: true, handler: () => togglePlayPause() },
    { key: 'ArrowLeft', handler: () => seek(-10) },
    { key: 'ArrowRight', handler: () => seek(10) },
    { key: 'ArrowUp', handler: () => volumeUp() },
    { key: 'ArrowDown', handler: () => volumeDown() },
    { key: 'f', handler: () => toggleFullscreen() },
    { key: 'm', handler: () => toggleMute() }
  ]);

  return <video ref={videoRef} />;
}
```

### Search Shortcut

```tsx
function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      preventDefault: true,
      handler: () => {
        setIsOpen(true);
        inputRef.current?.focus();
      }
    },
    { key: 'Escape', handler: () => setIsOpen(false) }
  ]);

  return isOpen && (
    <input ref={inputRef} placeholder="Search..." />
  );
}
```

## Features

- ✅ Modifier key support (Ctrl, Alt, Shift, Meta)
- ✅ Array-of-objects shortcut configuration
- ✅ Per-shortcut `preventDefault` / `stopPropagation`
- ✅ Custom event target and an `enabled` toggle
- ✅ `createShortcut` and `COMMON_SHORTCUTS` helpers
- ✅ Automatic cleanup
- ✅ SSR-safe (the target is resolved inside an effect, so `document` is never touched during server render)
- ✅ TypeScript support
- ✅ Case-insensitive keys

## Notes

- Keys are matched case-insensitively against both `event.key` and `event.code`.
- Each modifier must match exactly: a shortcut with `ctrl: true` will not fire if Shift is also held unless `shift: true` is set.
- Only the first matching shortcut in the array fires for a given event.
- The shortcut handlers always see the latest closure (handlers are read from a ref), so you can inline functions without re-binding listeners.
- Changing `target` or `enabled` re-attaches the listener; changing the `shortcuts` array does not.
- Automatically removes listeners on unmount.
