# useScrollTo

Hook providing programmatic scroll control for common scroll operations. Includes scroll to top, bottom, a specific pixel position, or a specific DOM element — all with configurable scroll behavior.

## Usage

```tsx
import { useScrollTo } from 'reactilities';

function Page() {
  const { scrollToTop } = useScrollTo();

  return (
    <>
      <div style={{ height: '2000px' }}>Long content...</div>
      <button
        onClick={() => scrollToTop()}
        style={{ position: 'fixed', bottom: 20, right: 20 }}
      >
        Back to top
      </button>
    </>
  );
}
```

## API

### Returns

| Function | Signature | Description |
|---|---|---|
| `scrollToTop` | `(options?) => void` | Scroll to the top of the page |
| `scrollToBottom` | `(options?) => void` | Scroll to the bottom of the page |
| `scrollToElement` | `(element, options?) => void` | Scroll a DOM element into view |
| `scrollTo` | `(x, y, options?) => void` | Scroll to exact pixel coordinates |

### Options

- **`behavior`** (`ScrollBehavior`) - `'smooth'` (default) or `'instant'` or `'auto'`
- **`block`** (`ScrollLogicalPosition`) - Vertical alignment for `scrollToElement` (default: `'start'`)
- **`inline`** (`ScrollLogicalPosition`) - Horizontal alignment for `scrollToElement` (default: `'nearest'`)

## Examples

### Back to top button

```tsx
function ScrollToTopButton() {
  const { scrollToTop } = useScrollTo();
  const { y } = useScrollPosition();

  if (y < 400) return null;

  return (
    <button
      onClick={() => scrollToTop()}
      style={{ position: 'fixed', bottom: 24, right: 24 }}
    >
      ↑ Top
    </button>
  );
}
```

### Anchor navigation

```tsx
function TableOfContents({ sections }: { sections: { id: string; label: string }[] }) {
  const { scrollToElement } = useScrollTo();

  return (
    <nav>
      {sections.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => scrollToElement(document.getElementById(id))}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
```

### Scroll to element via ref

```tsx
function ChatWindow() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { scrollToElement } = useScrollTo();

  useEffect(() => {
    scrollToElement(bottomRef.current);
  }, [messages]);

  return (
    <div className="chat">
      {messages.map(m => <Message key={m.id} {...m} />)}
      <div ref={bottomRef} />
    </div>
  );
}
```

### Instant scroll (no animation)

```tsx
const { scrollToTop } = useScrollTo();

// Navigate without the smooth animation
scrollToTop({ behavior: 'instant' });
```

## Features

- ✅ Scroll to top, bottom, element, or exact coordinates
- ✅ Smooth scrolling by default, configurable per call
- ✅ `scrollToElement` handles `null` safely (no-op)
- ✅ Stable function references — safe to use in dependency arrays
- ✅ Zero external dependencies

## Notes

- All functions default to `behavior: 'smooth'`
- `scrollToElement(null)` is a safe no-op
- `scrollToBottom` uses `document.documentElement.scrollHeight` which reflects the full page height
