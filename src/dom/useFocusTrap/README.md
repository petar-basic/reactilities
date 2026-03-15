# useFocusTrap

Hook that traps keyboard focus within a container element while active. Focuses the first focusable element on activation and wraps Tab/Shift+Tab at the boundaries.

## Usage

```tsx
import { useFocusTrap } from 'reactilities';

function Modal({ isOpen, onClose }) {
  const ref = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      style={{ padding: 24, background: '#fff', borderRadius: 8 }}
    >
      <h2>Confirm Action</h2>
      <p>Are you sure?</p>
      <button onClick={onClose}>Cancel</button>
      <button onClick={handleConfirm}>Confirm</button>
    </div>
  );
}
```

## API

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `active` | `boolean` | `true` | Whether the focus trap is engaged |

### Returns

`RefObject<HTMLElement | null>` — attach to the container element via `ref`.

## Examples

### Drawer

```tsx
function Drawer({ open, onClose }) {
  const ref = useFocusTrap(open);

  return (
    <aside
      ref={ref}
      role="dialog"
      aria-hidden={!open}
      className={`drawer ${open ? 'drawer--open' : ''}`}
    >
      <nav>
        <a href="/home">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
      <button onClick={onClose}>Close</button>
    </aside>
  );
}
```

### Conditional Trap

```tsx
function SearchPanel({ isExpanded }) {
  const ref = useFocusTrap(isExpanded);

  return (
    <div ref={ref}>
      <input type="search" placeholder="Search..." />
      <button type="submit">Go</button>
    </div>
  );
}
```

## Focusable Elements

The trap targets these elements (excluding disabled ones):

- `<a href="...">` — links with href
- `<button>` — buttons
- `<input>`, `<select>`, `<textarea>` — form controls
- Elements with `tabindex` ≥ 0

## Notes

- Focuses the first focusable child immediately on activation
- Tab on the last element wraps to the first
- Shift+Tab on the first element wraps to the last
- Set `active={false}` to release the trap without unmounting the container
- For accessibility, also consider managing `aria-hidden` on background content and restoring focus to the trigger element on close
