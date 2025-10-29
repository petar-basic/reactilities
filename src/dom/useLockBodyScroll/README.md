# useLockBodyScroll

Hook for preventing body scroll while component is mounted. Useful for modals, drawers, and full-screen overlays. Automatically restores original overflow style on unmount.

## Usage

```tsx
import { useLockBodyScroll } from 'reactilities';

function Modal({ children }) {
  useLockBodyScroll();
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {children}
      </div>
    </div>
  );
}
```

## API

### Parameters

None

### Returns

`void`

## Examples

### Modal Dialog

```tsx
function Modal({ isOpen, onClose, children }) {
  useLockBodyScroll();
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

### Side Drawer

```tsx
function Drawer({ isOpen, children }) {
  useLockBodyScroll();
  
  return (
    <div className={`drawer ${isOpen ? 'open' : ''}`}>
      <div className="drawer-content">
        {children}
      </div>
    </div>
  );
}
```

### Conditional Lock

```tsx
function ConditionalModal({ isOpen, children }) {
  // Only lock scroll when modal is open
  if (isOpen) {
    useLockBodyScroll();
  }
  
  if (!isOpen) return null;
  
  return (
    <div className="modal">
      {children}
    </div>
  );
}
```

### Full-Screen Overlay

```tsx
function FullScreenMenu({ isOpen, onClose }) {
  useLockBodyScroll();
  
  return (
    <div className="fullscreen-menu">
      <nav>
        <a href="/home">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
      <button onClick={onClose}>Close Menu</button>
    </div>
  );
}
```

### Image Lightbox

```tsx
function Lightbox({ image, onClose }) {
  useLockBodyScroll();
  
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <img src={image} alt="Full size" />
      <button className="close-btn" onClick={onClose}>×</button>
    </div>
  );
}
```

### Mobile Menu

```tsx
function MobileMenu({ isOpen }) {
  useLockBodyScroll();
  
  return (
    <div className={`mobile-menu ${isOpen ? 'visible' : 'hidden'}`}>
      <ul>
        <li><a href="/home">Home</a></li>
        <li><a href="/products">Products</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </div>
  );
}
```

## Features

- ✅ Prevents body scroll while mounted
- ✅ Restores original overflow style on unmount
- ✅ Uses `useLayoutEffect` for synchronous updates
- ✅ No flickering or layout shifts
- ✅ TypeScript support
- ✅ Zero dependencies

## Notes

- The hook locks scroll immediately when component mounts
- Original `overflow` style is restored when component unmounts
- Uses `useLayoutEffect` to prevent visual flickering
- Works by setting `document.body.style.overflow = 'hidden'`
- Multiple components can use this hook - last one to unmount restores scroll
- Consider accessibility - ensure users can still close the overlay with keyboard
