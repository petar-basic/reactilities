# usePortal

Hook for creating a DOM portal container appended to `document.body`. Returns the container element once mounted, which can then be used with React's `createPortal` to render content outside the component tree. Solves `z-index` and CSS `overflow` issues for modals, tooltips, and floating UI.

## Usage

```tsx
import { createPortal } from 'react-dom';
import { usePortal } from 'reactilities';

function Modal({ children, isOpen }: { children: ReactNode; isOpen: boolean }) {
  const container = usePortal('modal-root');

  if (!isOpen || !container) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="modal">{children}</div>
    </div>,
    container
  );
}
```

## API

### Parameters

- **`id`** (`string`, optional) - `id` attribute to set on the created container element

### Returns

`HTMLDivElement | null` — the portal container once mounted, or `null` before mount (SSR / first render)

## Examples

### Accessible modal dialog

```tsx
function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  const container = usePortal('dialog-root');

  if (!container) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      style={{
        position: 'fixed', inset: 0,
        display: isOpen ? 'flex' : 'none',
        alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div className="dialog-backdrop" onClick={onClose} />
      <div className="dialog-panel">
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </div>,
    container
  );
}
```

### Tooltip rendered at body level

```tsx
function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const container = usePortal();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const tooltip = container && visible
    ? createPortal(
        <div className="tooltip" style={{ top: pos.y, left: pos.x }}>{text}</div>,
        container
      )
    : null;

  return (
    <span
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ x: rect.left, y: rect.bottom + 4 });
        setVisible(true);
      }}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {tooltip}
    </span>
  );
}
```

### Notification toasts

```tsx
const toastContainer = usePortal('toast-root');

const showToast = (message: string) => {
  if (!toastContainer) return;
  createPortal(<Toast message={message} />, toastContainer);
};
```

## Features

- ✅ Creates and cleans up the container element automatically
- ✅ Returns `null` before mount — safe to render conditionally without `createPortal` crashing
- ✅ Optional `id` attribute for targeting with CSS or testing
- ✅ Cleanup removes the container from the DOM on unmount

## Notes

- Always check `if (!container) return null` before calling `createPortal` — the container is `null` on the first render
- The container `div` is appended directly to `document.body`
- The `id` prop is memoized — changing it after mount creates a new container
