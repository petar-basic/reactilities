# useClickOutside

Hook that detects clicks outside of a specified element. Useful for closing modals, dropdowns, or other overlay components. Handles both mouse clicks and touch events.

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

- **`ref`** (`RefObject<HTMLElement>`) - React ref object pointing to the target element
- **`handler`** (`(event: MouseEvent | TouchEvent) => void`) - Callback function to execute when clicking outside

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

- ✅ Detects clicks outside specified element
- ✅ Handles both mouse and touch events
- ✅ Automatically cleans up event listeners
- ✅ TypeScript support with generics
- ✅ Works with any HTML element type

## Notes

- The hook automatically adds and removes event listeners on mount/unmount
- Event listeners are attached to the `document` object
- The handler is called with the original event object
- Child elements of the ref element are considered "inside"
