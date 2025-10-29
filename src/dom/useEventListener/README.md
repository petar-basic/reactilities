# useEventListener

Hook for adding event listeners to DOM elements with automatic cleanup. Handles both ref objects and direct element references safely.

## Usage

```tsx
import { useEventListener } from 'reactilities';

function Component() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEventListener(buttonRef, 'click', (event) => {
    console.log('Button clicked!', event);
  });
  
  return <button ref={buttonRef}>Click me</button>;
}
```

## API

### Parameters

- **`target`** (`RefObject<HTMLElement>`) - RefObject pointing to the target HTML element
- **`eventName`** (`string`) - Name of the event to listen for (e.g., 'click', 'scroll')
- **`handler`** (`(event: Event) => void`) - Event handler function to execute when event fires
- **`options`** (`AddEventListenerOptions`, optional) - Event listener options (capture, passive, once, etc.)

### Returns

`void`

## Examples

### Basic Click Handler

```tsx
function ClickCounter() {
  const [count, setCount] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEventListener(buttonRef, 'click', () => {
    setCount(c => c + 1);
  });
  
  return (
    <div>
      <button ref={buttonRef}>Click me</button>
      <p>Clicked {count} times</p>
    </div>
  );
}
```

### Scroll Event with Passive Option

```tsx
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEventListener(
    containerRef, 
    'scroll', 
    (e) => {
      setScrollY((e.target as HTMLElement).scrollTop);
    },
    { passive: true }
  );
  
  return (
    <div ref={containerRef} style={{ height: '400px', overflow: 'auto' }}>
      <p>Scroll position: {scrollY}px</p>
      <div style={{ height: '2000px' }}>Scrollable content</div>
    </div>
  );
}
```

### Mouse Move Tracking

```tsx
function MouseTracker() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const areaRef = useRef<HTMLDivElement>(null);
  
  useEventListener(areaRef, 'mousemove', (e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  });
  
  return (
    <div ref={areaRef} style={{ width: '100%', height: '300px', border: '1px solid' }}>
      Mouse position: {position.x}, {position.y}
    </div>
  );
}
```

### Keyboard Shortcuts

```tsx
function KeyboardShortcuts() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEventListener(inputRef, 'keydown', (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      console.log('Save shortcut triggered');
    }
  });
  
  return <input ref={inputRef} placeholder="Try Ctrl+S" />;
}
```

### Resize Observer

```tsx
function ResizeDetector() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const divRef = useRef<HTMLDivElement>(null);
  
  useEventListener(window as any, 'resize', () => {
    if (divRef.current) {
      setSize({
        width: divRef.current.offsetWidth,
        height: divRef.current.offsetHeight
      });
    }
  });
  
  return (
    <div ref={divRef}>
      Size: {size.width}x{size.height}
    </div>
  );
}
```

## Features

- ✅ Automatic cleanup on unmount
- ✅ Supports all DOM events
- ✅ Event listener options support
- ✅ TypeScript support
- ✅ Safe ref handling
- ✅ Uses `useEffectEvent` for stable handlers

## Notes

- Event listeners are automatically removed when component unmounts
- Handler function is stable and won't cause re-subscriptions
- Supports standard `AddEventListenerOptions` (capture, passive, once, signal)
- Works with any HTML element type
