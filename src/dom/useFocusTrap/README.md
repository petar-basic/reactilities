# useFocusTrap

Hook that traps keyboard focus within a container element while active. Focuses the first focusable element on activation, wraps Tab/Shift+Tab at the boundaries, and — because the listeners are bound to `document` — recaptures focus if it ever leaves the container (e.g. a click on the backdrop/body). On deactivation it restores focus to the element that was focused before the trap engaged.

The hook is generic over the container element type, so the returned ref attaches directly to your element with no cast (`<div ref={ref} />`) under React 19 types.

## Usage

```tsx
import { useFocusTrap } from 'reactilities';

function Modal({ isOpen, onClose }) {
  const ref = useFocusTrap<HTMLDivElement>(isOpen);

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

### Type Parameters

| Parameter | Constraint | Default | Description |
|-----------|------------|---------|-------------|
| `T` | `extends HTMLElement` | `HTMLElement` | The container element type |

### Returns

`RefObject<T | null>` — attach to the container element via `ref`. Defaults to `HTMLElement`; pass the element type (e.g. `useFocusTrap<HTMLDivElement>()`) for a cast-free `ref`.

## Examples

### Drawer

```tsx
function Drawer({ open, onClose }) {
  const ref = useFocusTrap<HTMLElement>(open);

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
  const ref = useFocusTrap<HTMLDivElement>(isExpanded);

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
- Listeners are attached to `document`, so focus is recaptured even if it leaves the container (clicking the backdrop/body, programmatic focus, etc.) — the trap cannot be escaped while active
- Restores focus to the previously focused element (e.g. the trigger) when the trap deactivates
- Set `active={false}` to release the trap without unmounting the container
- For accessibility, also consider managing `aria-hidden` on background content
