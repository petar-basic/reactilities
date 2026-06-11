# useClickOutside

Hook that detects clicks (presses) outside of a specified element. Useful for closing modals, dropdowns, or other overlay components. Uses a single `pointerdown` listener, so it works for both mouse and touch with one code path, fires on press rather than release, and never double-fires on touch.

## Usage

```tsx
import { useClickOutside } from 'reactilities';

function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
  });

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle Dropdown
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <div>Option 1</div>
          <div>Option 2</div>
        </div>
      )}
    </div>
  );
}
```

## API

### Parameters

- **`ref`** (`RefObject<HTMLElement | null>`) - React ref object pointing to the target element (accepts `useRef<HTMLElement>(null)`)
- **`handler`** (`(event: PointerEvent) => void`) - Callback function to execute when pressing outside

### Returns

`void`

## Examples

### Modal with Click Outside to Close

```tsx
function Modal({ onClose }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, onClose);

  return (
    <div className="modal-overlay">
      <div ref={modalRef} className="modal-content">
        <h2>Modal Title</h2>
        <p>Click outside to close</p>
      </div>
    </div>
  );
}
```

### Sidebar Menu

```tsx
function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useClickOutside(sidebarRef, () => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Menu</button>
      {isOpen && (
        <div ref={sidebarRef} className="sidebar">
          <nav>
            <a href="/home">Home</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </nav>
        </div>
      )}
    </>
  );
}
```

### Context Menu

```tsx
function ContextMenu() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => {
    setPosition(null);
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <p>Right-click anywhere to open context menu</p>
      {position && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
          }}
          className="context-menu"
        >
          <button>Copy</button>
          <button>Paste</button>
          <button>Delete</button>
        </div>
      )}
    </div>
  );
}
```

## Features

- ✅ Detects presses outside specified element
- ✅ Handles mouse and touch with a single `pointerdown` listener
- ✅ Fires on press, so a text selection starting inside and released outside does not trigger it
- ✅ Fires exactly once per tap (no touchstart + click double-fire)
- ✅ Stable: the document listener is attached once, not re-added on every render
- ✅ Automatically cleans up event listeners
- ✅ TypeScript support with generics
- ✅ Works with any HTML element type

## Notes

- The hook adds a single `pointerdown` listener on the `document` and removes it on unmount
- Because it listens on press (not the `click`/release), a drag that begins inside the element and ends outside does not call the handler
- The handler always sees the latest closure even though the listener is attached once
- The handler is called with the original `PointerEvent`
- Child elements of the ref element are considered "inside"
