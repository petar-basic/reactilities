# 🚀 Reactilities

A comprehensive collection of useful React hooks and utilities for modern web development. Built with TypeScript for excellent developer experience and type safety.

[![npm version](https://badge.fury.io/js/reactilities.svg)](https://badge.fury.io/js/reactilities)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-99%25-brightgreen.svg)](https://github.com/petar-basic/reactilities)

## 📦 Installation

```bash
npm install reactilities
# or
yarn add reactilities
# or
pnpm add reactilities
```

### Requirements

- **React** >= 18.0.0
- **React DOM** >= 18.0.0

> **Note:** This library uses `useSyncExternalStore` which requires React 18 or higher.

## 🎯 Features

- 🪝 **25+ React Hooks** - DOM manipulation, state management, and utility hooks
- 🔄 **Lifecycle Helpers** - Class component lifecycle methods as hooks
- 🎨 **Helper Functions** - Utility functions for common tasks
- 🔷 **TypeScript Types** - Utility types for better type safety
- 📱 **TypeScript First** - Full TypeScript support with excellent IntelliSense
- 🧪 **Well Tested** - 99%+ test coverage with 140+ tests
- 📦 **Tree Shakable** - Import only what you need
- 🚀 **Zero Dependencies** - No external dependencies except React
- 📚 **Comprehensive Docs** - Each hook has its own detailed README

## 📚 API Reference

Each hook and utility has its own detailed documentation with examples. Click on any item below to see full documentation.

### 🎨 DOM Hooks

Hooks for DOM manipulation and browser APIs.

- **[useClickOutside](./src/dom/useClickOutside/README.md)** - Detect clicks outside an element
- **[useDocumentTitle](./src/dom/useDocumentTitle/README.md)** - Dynamically update the document title
- **[useEventListener](./src/dom/useEventListener/README.md)** - Add event listeners with automatic cleanup
- **[useFavicon](./src/dom/useFavicon/README.md)** - Dynamically update the website favicon
- **[useLockBodyScroll](./src/dom/useLockBodyScroll/README.md)** - Prevent body scrolling (for modals/overlays)
- **[useMediaQuery](./src/dom/useMediaQuery/README.md)** - Responsive design with CSS media queries

### 🔄 State Hooks

Hooks for state management and persistence.

- **[useCopyToClipboard](./src/state/useCopyToClipboard/README.md)** - Copy text to clipboard with fallback
- **[useLocalStorage](./src/state/useLocalStorage/README.md)** - Persist state in localStorage with sync
- **[useObjectState](./src/state/useObjectState/README.md)** - Manage object state with partial updates
- **[useSessionStorage](./src/state/useSessionStorage/README.md)** - Persist state in sessionStorage
- **[useToggle](./src/state/useToggle/README.md)** - Toggle boolean state with flexible API

### ⚡ Utility Hooks

Performance and utility hooks for common patterns.

- **[useDebounce](./src/utils/useDebounce/README.md)** - Debounce rapidly changing values
- **[useGeolocation](./src/utils/useGeolocation/README.md)** - Access user's geolocation
- **[useIntersectionObserver](./src/utils/useIntersectionObserver/README.md)** - Detect element visibility (lazy loading, infinite scroll)
- **[useKeyboardShortcuts](./src/utils/useKeyboardShortcuts/README.md)** - Handle keyboard shortcuts
- **[useNetworkState](./src/utils/useNetworkState/README.md)** - Monitor network connectivity
- **[useThrottle](./src/utils/useThrottle/README.md)** - Throttle rapidly changing values
- **[useVirtualization](./src/utils/useVirtualization/README.md)** - Virtualize large lists for performance
- **[useWebSocket](./src/utils/useWebSocket/README.md)** - Manage WebSocket connections

### 🔄 Lifecycle Hooks

Class component lifecycle methods as hooks.

- **[componentDidMount](./src/lifecycles/componentDidMount/README.md)** - Run function after component mounts
- **[componentDidUpdate](./src/lifecycles/componentDidUpdate/README.md)** - Run function after every render
- **[componentWillMount](./src/lifecycles/componentWillMount/README.md)** - Run function before first render
- **[componentWillUnmount](./src/lifecycles/componentWillUnmount/README.md)** - Run cleanup before unmount

### 🎨 Helper Functions

Utility functions for common tasks.

- **[classnames](./src/helpers/classnames/README.md)** - Conditionally join CSS class names
- **[loadScript](./src/helpers/scriptLoader/README.md)** - Dynamically load external scripts

### 🔷 TypeScript Types

Utility types for better type safety.

- **`Nullable<T>`** - Makes a type nullable (T | null)
- **`Maybe<T>`** - Makes a type nullable and undefined (T | null | undefined)
- **`ValueOf<T>`** - Extracts all possible values from an object type
- **`DeepPartial<T>`** - Makes all properties optional recursively
- **`VoidFunction<T>`** - Type for void-returning functions with typed parameters

## 🚀 Quick Start

```tsx
import { 
  useLocalStorage, 
  useDebounce, 
  useMediaQuery,
  classnames 
} from 'reactilities';

function App() {
  // Persist theme preference
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  
  // Debounce search input
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  // Responsive design
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Conditional classes
  const buttonClass = classnames('btn', {
    'btn-primary': theme === 'light',
    'btn-dark': theme === 'dark',
    'btn-sm': isMobile
  });
  
  return (
    <div>
      <button className={buttonClass} onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      <input 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
      />
    </div>
  );
}
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

// Utility types
type User = { id: string; name: string; email: string };
type NullableUser = Nullable<User>; // User | null
type MaybeUser = Maybe<User>; // User | null | undefined
type PartialUser = DeepPartial<User>; // All properties optional
```

## 🧪 Testing

Reactilities comes with comprehensive tests:
- **140+ tests** covering all functionality
- **99%+ code coverage**
- Tested with Vitest and React Testing Library

## 📄 License

MIT © [Petar Basic](https://github.com/petar-basic)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Changelog

### v0.1.4
- Refactored to modular structure - each hook has its own folder with README
- Added comprehensive documentation for all hooks
- Improved test coverage to 99%+
- Added more TypeScript utility types

### v0.1.3
- Added lifecycle hooks and helper functions
- Improved TypeScript support

### v0.1.2
- Fixed export issues - all hooks now use named exports
- Removed test files from distribution bundle

### v0.1.1
- Fixed hook exports and improved TypeScript support

### v0.1.0
- Initial release with 25+ hooks and utilities

## ⭐ Star History

If you find this library useful, please consider giving it a star on GitHub!

---

Made with ❤️ by [Petar Basic](https://github.com/petar-basic)
