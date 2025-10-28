# 🚀 Reactilities

A comprehensive collection of useful React hooks and utilities for modern web development. Built with TypeScript for excellent developer experience and type safety.

[![npm version](https://badge.fury.io/js/reactilities.svg)](https://badge.fury.io/js/reactilities)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-99%25-brightgreen.svg)](https://github.com/petarbasic/reactilities)

## 📦 Installation

```bash
npm install reactilities
```

```bash
yarn add reactilities
```

```bash
pnpm add reactilities
```

## 🎯 Features

- 🪝 **React Hooks** - DOM manipulation, state management, and utility hooks
- 🎨 **Helper Functions** - Utility functions for common tasks
- 📱 **TypeScript First** - Full TypeScript support with excellent IntelliSense
- 🧪 **Well Tested** - 99%+ test coverage with comprehensive test suite
- 📦 **Tree Shakable** - Import only what you need
- 🚀 **Zero Dependencies** - No external dependencies except React

## 📚 API Reference

### 🎨 DOM Hooks

#### `useDocumentTitle(title: string)`
Dynamically updates the document title.

```tsx
import { useDocumentTitle } from 'reactilities';

function MyComponent() {
  useDocumentTitle('My Page Title');
  return <div>Content</div>;
}
```

#### `useEventListener(target, eventName, handler, options?)`
Adds event listeners with automatic cleanup.

```tsx
import { useEventListener } from 'reactilities';

function MyComponent() {
  useEventListener(window, 'resize', () => {
    console.log('Window resized!');
  });
  
  return <div>Listening to window resize</div>;
}
```

#### `useFavicon(url: string)`
Dynamically updates the website favicon.

```tsx
import { useFavicon } from 'reactilities';

function MyComponent() {
  const [isOnline, setIsOnline] = useState(true);
  
  useFavicon(isOnline ? '/favicon-online.ico' : '/favicon-offline.ico');
  
  return <div>Favicon changes based on online status</div>;
}
```

#### `useLockBodyScroll()`
Prevents body scrolling while component is mounted. Perfect for modals and overlays.

```tsx
import { useLockBodyScroll } from 'reactilities';

function Modal({ isOpen, children }) {
  if (isOpen) {
    useLockBodyScroll(); // Locks scroll while modal is open
  }
  
  return isOpen ? (
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>
  ) : null;
}
```

#### `useMediaQuery(query: string)`
Responsive design hook using CSS media queries with predefined breakpoints.

```tsx
import { useMediaQuery, MEDIA_QUERIES } from 'reactilities';

function ResponsiveComponent() {
  const isMobile = useMediaQuery(MEDIA_QUERIES.IS_SMALL_DEVICE);
  const isDesktop = useMediaQuery(MEDIA_QUERIES.IS_LARGER_DEVICE);
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  return (
    <div>
      {isMobile ? <MobileNav /> : <DesktopNav />}
      {isDarkMode && <DarkModeStyles />}
      <p>Orientation: {isLandscape ? 'Landscape' : 'Portrait'}</p>
    </div>
  );
}
```

### 🔄 State Hooks

#### `useLocalStorage<T>(key: string, initialValue: T)`
Syncs state with localStorage with automatic serialization.

```tsx
import { useLocalStorage } from 'reactilities';

function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [user, setUser] = useLocalStorage('user', { name: '', email: '' });
  
  return (
    <div>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme: {theme}
      </button>
      
      {/* Functional updates */}
      <button onClick={() => setUser(prev => ({ ...prev, name: 'John' }))}>
        Update User
      </button>
      
      {/* Remove from storage */}
      <button onClick={() => setUser(null)}>
        Clear User
      </button>
    </div>
  );
}
```

#### `useSessionStorage<T>(key: string, initialValue: T)`
Syncs state with sessionStorage (session-only persistence).

```tsx
import { useSessionStorage } from 'reactilities';

function ShoppingCart() {
  const [cart, setCart] = useSessionStorage('cart', []);
  const [checkoutStep, setCheckoutStep] = useSessionStorage('checkoutStep', 1);
  
  const addToCart = (item) => {
    setCart(prevCart => [...prevCart, item]);
  };
  
  return (
    <div>
      <p>Items in cart: {cart.length}</p>
      <p>Checkout step: {checkoutStep}</p>
      <button onClick={() => setCheckoutStep(step => step + 1)}>
        Next Step
      </button>
    </div>
  );
}
```

#### `useCopyToClipboard()`
Copies text to clipboard with fallback support.

```tsx
import { useCopyToClipboard } from 'reactilities';

function ShareButton({ url }) {
  const [copiedValue, copyToClipboard] = useCopyToClipboard();
  const isCopied = copiedValue === url;
  
  return (
    <button onClick={() => copyToClipboard(url)}>
      {isCopied ? 'Copied!' : 'Copy Link'}
    </button>
  );
}
```

### ⚡ Utility Hooks

#### `useDebounce<T>(value: T, delay: number)`
Debounces rapidly changing values.

```tsx
import { useDebounce } from 'reactilities';

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  useEffect(() => {
    if (debouncedSearchTerm) {
      // Perform search API call
      searchAPI(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

#### `useThrottle<T>(value: T, interval?: number)`
Throttles rapidly changing values to limit update frequency.

```tsx
import { useThrottle } from 'reactilities';

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 100);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return <div>Scroll position: {throttledScrollY}px</div>;
}
```

#### `useNetworkState()`
Monitors network connection status and quality.

```tsx
import { useNetworkState } from 'reactilities';

function NetworkIndicator() {
  const networkState = useNetworkState();
  
  return (
    <div>
      <p>Online: {networkState.online ? 'Yes' : 'No'}</p>
      <p>Connection: {networkState.effectiveType}</p>
      <p>Downlink: {networkState.downlink} Mbps</p>
      {networkState.saveData && <p>⚠️ Data Saver Mode</p>}
    </div>
  );
}
```

#### `useGeolocation(options?)`
Gets user's current location with permission handling.

```tsx
import { useGeolocation } from 'reactilities';

function LocationTracker() {
  const { location, error, loading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000
  });
  
  if (loading) return <div>Getting location...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <p>Latitude: {location?.latitude}</p>
      <p>Longitude: {location?.longitude}</p>
      <p>Accuracy: {location?.accuracy}m</p>
    </div>
  );
}
```

#### `useIntersectionObserver(options?)`
Observes element visibility in viewport.

```tsx
import { useIntersectionObserver } from 'reactilities';

function LazyImage({ src, alt }) {
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  return (
    <div ref={ref}>
      {isIntersecting ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="placeholder">Loading...</div>
      )}
    </div>
  );
}
```

#### `useKeyboardShortcuts(shortcuts)`
Handles keyboard shortcuts with customizable key combinations.

```tsx
import { useKeyboardShortcuts } from 'reactilities';

function Editor() {
  const [content, setContent] = useState('');
  
  useKeyboardShortcuts({
    'ctrl+s': () => saveDocument(content),
    'ctrl+z': () => undo(),
    'ctrl+shift+z': () => redo(),
    'escape': () => closeModal()
  });
  
  return <textarea value={content} onChange={(e) => setContent(e.target.value)} />;
}
```

#### `useWebSocket(url, options?)`
Manages WebSocket connections with automatic reconnection.

```tsx
import { useWebSocket } from 'reactilities';

function ChatComponent() {
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    'ws://localhost:8080/chat',
    {
      onOpen: () => console.log('Connected'),
      onClose: () => console.log('Disconnected'),
      shouldReconnect: () => true,
      reconnectAttempts: 5
    }
  );
  
  const sendMessage = () => {
    sendJsonMessage({ type: 'message', content: 'Hello!' });
  };
  
  return (
    <div>
      <p>Status: {readyState === 1 ? 'Connected' : 'Disconnected'}</p>
      <p>Last message: {lastJsonMessage?.content}</p>
      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
}
```

#### `useVirtualization(options)`
Efficient rendering for large lists with virtual scrolling.

```tsx
import { useVirtualization } from 'reactilities';

function VirtualList({ items }) {
  const { containerRef, visibleItems, scrollToIndex } = useVirtualization({
    items,
    itemHeight: 50,
    containerHeight: 400,
    overscan: 5
  });
  
  return (
    <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
      {visibleItems.map(({ item, index, style }) => (
        <div key={index} style={style}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### 🛠️ Helper Functions

#### `classnames(...args: ClassValue[])`
Conditionally joins class names together.

```tsx
import { classnames } from 'reactilities';

function Button({ variant, size, disabled, className, children }) {
  return (
    <button
      className={classnames(
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        {
          'btn-disabled': disabled,
          'btn-active': !disabled
        },
        className
      )}
    >
      {children}
    </button>
  );
}

// Usage
<Button 
  variant="primary" 
  size="lg" 
  disabled={false}
  className="my-custom-class"
>
  Click me
</Button>
```

## 🔧 TypeScript Support

All hooks and utilities are written in TypeScript with full type definitions:

```tsx
// Type inference works automatically
const [user, setUser] = useLocalStorage('user', { name: 'John', age: 30 });
// user is typed as { name: string; age: number }

// Generic types are supported
const debouncedValue = useDebounce<string>('hello', 300);
const throttledValue = useThrottle<number>(scrollY, 100);

// Media queries with predefined constants
const isMobile = useMediaQuery(MEDIA_QUERIES.IS_SMALL_DEVICE);

// Network state is fully typed
const networkState = useNetworkState();
// networkState.effectiveType is typed as "slow-2g" | "2g" | "3g" | "4g"

// WebSocket with typed messages
const { sendJsonMessage, lastJsonMessage } = useWebSocket<ChatMessage>(url);

// Event listeners are properly typed
useEventListener(buttonRef, 'click', (event: MouseEvent) => {
  console.log(event.clientX, event.clientY);
});
```

## 🧪 Testing

Reactilities comes with comprehensive tests (99%+ coverage).

## 📄 License

MIT © [Petar Basic](https://github.com/petar-basic)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Changelog

### v0.1.2
- Fixed export issues - all hooks now use named exports
- Removed test files from distribution bundle
- Updated documentation with all available hooks

### v0.1.1
- Fixed hook exports and improved TypeScript support

### v0.1.0
- Initial release
- **DOM hooks:** `useDocumentTitle`, `useEventListener`, `useFavicon`, `useLockBodyScroll`, `useMediaQuery`
- **State hooks:** `useLocalStorage`, `useSessionStorage`, `useCopyToClipboard`  
- **Utility hooks:** `useDebounce`, `useThrottle`, `useNetworkState`, `useGeolocation`, `useIntersectionObserver`, `useKeyboardShortcuts`, `useWebSocket`, `useVirtualization`
- **Helper functions:** `classnames`
