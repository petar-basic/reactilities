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
// debouncedValue is typed as string

// Event listeners are properly typed
useEventListener(buttonRef, 'click', (event: MouseEvent) => {
  console.log(event.clientX, event.clientY);
});
```

## 🧪 Testing

Reactilities comes with comprehensive tests (99%+ coverage) and is battle-tested in production applications.

## 📄 License

MIT © [Petar Basic](https://github.com/petar-basic)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Changelog

### v0.1.0
- Initial release
- DOM hooks: `useDocumentTitle`, `useEventListener`, `useFavicon`, `useLockBodyScroll`
- State hooks: `useLocalStorage`, `useCopyToClipboard`  
- Utility hooks: `useDebounce`
- Helper functions: `classnames`
