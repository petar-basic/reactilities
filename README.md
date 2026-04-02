# Reactilities

A comprehensive collection of useful React hooks and utilities for modern web development. Built with TypeScript for excellent developer experience and type safety.

[![npm version](https://badge.fury.io/js/reactilities.svg)](https://badge.fury.io/js/reactilities)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-99%25-brightgreen.svg)](https://github.com/petar-basic/reactilities)

## Installation

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

## Features

- **51+ React Hooks** — DOM manipulation, state management, async, timers, and more
- **Lifecycle Helpers** — class component lifecycle methods as hooks
- **Helper Functions** — utility functions for common tasks
- **TypeScript Types** — utility types for better type safety
- **TypeScript First** — full type support with excellent IntelliSense
- **Well Tested** — 99%+ test coverage with 421 tests
- **Tree Shakable** — import only what you need
- **Zero Dependencies** — no external dependencies except React
- **SSR Safe** — all hooks guard against server-side rendering issues
- **Comprehensive Docs** — each hook has its own detailed README

## API Reference

Each hook and utility has its own detailed documentation with examples. Click on any item below to see full documentation.

### DOM Hooks

Hooks for DOM manipulation and browser APIs.

- **[useClickOutside](./src/dom/useClickOutside/README.md)** - Detect clicks outside an element
- **[useDarkMode](./src/dom/useDarkMode/README.md)** - Dark mode with system preference detection and persistence
- **[useDocumentTitle](./src/dom/useDocumentTitle/README.md)** - Dynamically update the document title
- **[useEventListener](./src/dom/useEventListener/README.md)** - Add event listeners with automatic cleanup
- **[useFavicon](./src/dom/useFavicon/README.md)** - Dynamically update the website favicon
- **[useFocusTrap](./src/dom/useFocusTrap/README.md)** - Trap keyboard focus within a container (modals, drawers)
- **[useFullscreen](./src/dom/useFullscreen/README.md)** - Enter, exit, and track fullscreen state on any element
- **[useHover](./src/dom/useHover/README.md)** - Detect hover state on any element
- **[useLockBodyScroll](./src/dom/useLockBodyScroll/README.md)** - Prevent body scrolling (for modals/overlays)
- **[useLongPress](./src/dom/useLongPress/README.md)** - Detect long press / hold on any element
- **[useMediaQuery](./src/dom/useMediaQuery/README.md)** - Responsive design with CSS media queries
- **[useMousePosition](./src/dom/useMousePosition/README.md)** - Track real-time cursor position
- **[usePageVisibility](./src/dom/usePageVisibility/README.md)** - Detect when browser tab is hidden or visible
- **[useResizeObserver](./src/dom/useResizeObserver/README.md)** - Observe element size changes with ResizeObserver
- **[useScrollPosition](./src/dom/useScrollPosition/README.md)** - Track window scroll position
- **[useWindowSize](./src/dom/useWindowSize/README.md)** - Track browser window dimensions

### State Hooks

Hooks for state management and persistence.

- **[useCookie](./src/state/useCookie/README.md)** - Read and write browser cookies
- **[useCopyToClipboard](./src/state/useCopyToClipboard/README.md)** - Copy text to clipboard with fallback
- **[useList](./src/state/useList/README.md)** - Manage array state with push, remove, sort, and more
- **[useLocalStorage](./src/state/useLocalStorage/README.md)** - Persist state in localStorage with sync
- **[useMap](./src/state/useMap/README.md)** - Manage Map state with React integration
- **[useObjectState](./src/state/useObjectState/README.md)** - Manage object state with partial updates
- **[usePrevious](./src/state/usePrevious/README.md)** - Access the previous render's value
- **[useSessionStorage](./src/state/useSessionStorage/README.md)** - Persist state in sessionStorage
- **[useSet](./src/state/useSet/README.md)** - Manage Set state with React integration
- **[useToggle](./src/state/useToggle/README.md)** - Toggle boolean state with flexible API
- **[useUndoRedo](./src/state/useUndoRedo/README.md)** - State with full undo/redo history
- **[useBoolean](./src/state/useBoolean/README.md)** - Boolean state with named setTrue/setFalse/toggle controls
- **[useCounter](./src/state/useCounter/README.md)** - Numeric counter with min/max bounds and step

### Utility Hooks

Performance and utility hooks for common patterns.

- **[useAsync](./src/utils/useAsync/README.md)** - Manage async operations with loading/error/success states
- **[useCountdown](./src/utils/useCountdown/README.md)** - Countdown and count-up timer with controls
- **[useDebounce](./src/utils/useDebounce/README.md)** - Debounce rapidly changing values
- **[useFetch](./src/utils/useFetch/README.md)** - Data fetching with automatic abort support
- **[useGeolocation](./src/utils/useGeolocation/README.md)** - Access user's geolocation
- **[useInfiniteScroll](./src/utils/useInfiniteScroll/README.md)** - Infinite scroll via IntersectionObserver
- **[useIsMounted](./src/utils/useIsMounted/README.md)** - Guard async state updates against unmounted components
- **[useIntersectionObserver](./src/utils/useIntersectionObserver/README.md)** - Detect element visibility (lazy loading, infinite scroll)
- **[useInterval](./src/utils/useInterval/README.md)** - Run a callback on a fixed interval
- **[useKeyboardShortcuts](./src/utils/useKeyboardShortcuts/README.md)** - Handle keyboard shortcuts
- **[useManualUpdate](./src/utils/useManualUpdate/README.md)** - Manually trigger a component re-render
- **[useNetworkState](./src/utils/useNetworkState/README.md)** - Monitor network connectivity
- **[usePermission](./src/utils/usePermission/README.md)** - Query browser permission status reactively
- **[useThrottle](./src/utils/useThrottle/README.md)** - Throttle rapidly changing values
- **[useTimeout](./src/utils/useTimeout/README.md)** - Run a callback after a delay with reset/clear
- **[useVirtualization](./src/utils/useVirtualization/README.md)** - Virtualize large lists for performance
- **[useWebSocket](./src/utils/useWebSocket/README.md)** - Manage WebSocket connections

### Lifecycle Hooks

Class component lifecycle methods as hooks.

- **[componentDidMount](./src/lifecycles/componentDidMount/README.md)** - Run function after component mounts
- **[componentDidUpdate](./src/lifecycles/componentDidUpdate/README.md)** - Run function after every render
- **[componentWillMount](./src/lifecycles/componentWillMount/README.md)** - Run function before first render
- **[componentWillUnmount](./src/lifecycles/componentWillUnmount/README.md)** - Run cleanup before unmount
- **[useIsomorphicLayoutEffect](./src/lifecycles/useIsomorphicLayoutEffect/README.md)** - SSR-safe drop-in for useLayoutEffect
- **[useUpdateEffect](./src/lifecycles/useUpdateEffect/README.md)** - useEffect that skips the first render

### Helper Functions

Utility functions for common tasks.

- **[classnames](./src/helpers/classnames/README.md)** - Conditionally join CSS class names
- **[loadScript](./src/helpers/scriptLoader/README.md)** - Dynamically load external scripts

### TypeScript Types

Utility types for better type safety.

- **`Nullable<T>`** - Makes a type nullable (`T | null`)
- **`Maybe<T>`** - Makes a type nullable and undefined (`T | null | undefined`)
- **`ValueOf<T>`** - Extracts all possible values from an object type
- **`DeepPartial<T>`** - Makes all properties optional recursively
- **`VoidFunction<T>`** - Type for void-returning functions with typed parameters

## Quick Start

```tsx
import {
  useLocalStorage,
  useDebounce,
  useWindowSize,
  useFetch,
  useUndoRedo,
  useInfiniteScroll,
  classnames
} from 'reactilities';

function App() {
  // Persist theme preference
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  // Responsive layout
  const { width } = useWindowSize();
  const isMobile = width > 0 && width < 768;

  // Debounce search input
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Fetch with loading state
  const { data, loading } = useFetch<User[]>(
    `/api/users?q=${debouncedSearch}`
  );

  const buttonClass = classnames('btn', {
    'btn-primary': theme === 'light',
    'btn-dark': theme === 'dark',
    'btn-sm': isMobile,
  });

  return (
    <div>
      <button className={buttonClass} onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search..."
      />
      {loading ? <Spinner /> : <UserList users={data ?? []} />}
    </div>
  );
}
```

## TypeScript Support

All hooks and utilities are written in TypeScript with full type definitions:

```tsx
// Type inference works automatically
const [user, setUser] = useLocalStorage('user', { name: 'John', age: 30 });
// user is typed as { name: string; age: number }

// Generic types are supported
const debouncedValue = useDebounce<string>('hello', 300);
const throttledValue = useThrottle<number>(scrollY, 100);

// Async hooks are fully typed
const { data } = useFetch<User[]>('/api/users');
// data is User[] | null

// Utility types
type User = { id: string; name: string; email: string };
type NullableUser = Nullable<User>;     // User | null
type MaybeUser = Maybe<User>;           // User | null | undefined
type PartialUser = DeepPartial<User>;   // All properties optional recursively
```

## Testing

Reactilities comes with comprehensive tests:
- **421 tests** covering all functionality
- **99%+ code coverage**
- Tested with Vitest and React Testing Library

## License

MIT © [Petar Basic](https://github.com/petar-basic)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### v0.4.1

#### Bug fixes
- **`useWebSocket`** — Fixed infinite reconnection loop when callback props (`onOpen`, `onClose`, `onError`, `onMessage`, `shouldReconnect`) were passed as inline functions; callbacks are now stored in refs and excluded from `connectWebSocket` deps
- **`useLocalStorage` / `useSessionStorage`** — Fixed functional updaters silently failing when the key does not yet exist in storage; the previous value now correctly falls back to `initialValue` instead of throwing from `JSON.parse('')`
- **`useThrottle`** — Fixed trailing-edge timeout recording a stale timestamp; `lastUpdated` is now set to `Date.now()` at fire time, not capture time
- **`useCopyToClipboard`** — `execCommand` fallback no longer reports success when the copy actually failed; state is only updated when `execCommand` returns `true`
- **`loadScript`** — Boolean `false` attributes (e.g. `async: false`, `defer: false`) now correctly call `removeAttribute` instead of setting the attribute to the string `"false"` (which would still make the script async/deferred)

#### Improvements
- **`useGeolocation`** — Extracted unsupported-API error to a named module-level constant; `optionsRef` is now updated on every render so option changes are picked up by the active watch
- **`useEventListener`** — Type widened to accept `HTMLElement | null` directly in addition to `RefObject`; replaced unsafe double-cast with a proper `'current' in target` check
- **`useLocalStorage` / `useSessionStorage`** — `initialValue` stabilised via `useRef` so passing object/array literals no longer causes unnecessary effect re-runs
- **`useManualUpdate`** — Removed unnecessary `% 1_000_000` modulo
- **`createShortcut`** (`useKeyboardShortcuts`) — Documented that `preventDefault` defaults to `true`, unlike raw shortcut objects
- **Lifecycle hooks** (`componentDidMount`, `componentDidUpdate`, `componentWillMount`, `componentWillUnmount`) — Added explicit JSDoc warning that these are React hooks requiring top-level call discipline

### v0.4.0
- Added 9 new hooks: `useCounter`, `useBoolean`, `useUpdateEffect`, `useIsMounted`, `usePageVisibility`, `useMousePosition`, `useDarkMode`, `useLongPress`, `useFullscreen`
- 421 tests, 99%+ coverage

### v0.3.0
- Added 4 new hooks: `useUndoRedo`, `usePermission`, `useFocusTrap`, `useInfiniteScroll`
- Refactored `useVirtualization` — replaced brittle `data-` attribute selector with returned `containerRef` API (breaking change)
- Fixed `useEventListener` — replaced experimental `useEffectEvent` with stable `useRef` handler pattern
- Fixed `useWebSocket` — resolved infinite re-render loop caused by unstable default `shouldReconnect` reference
- 363 tests, 99%+ coverage

### v0.2.0
- Added 15 new hooks: `useAsync`, `useFetch`, `useInterval`, `useTimeout`, `useCountdown`, `useWindowSize`, `useScrollPosition`, `useHover`, `useResizeObserver`, `usePrevious`, `useList`, `useSet`, `useMap`, `useCookie`, `useIsomorphicLayoutEffect`
- Added SSR guards to all existing hooks
- Updated React peer dependency to >= 18.0.0 (required for `useSyncExternalStore`)
- Removed `js-cookie` dependency — `useCookie` now uses native `document.cookie`
- Fixed all TypeScript strict-mode and ESLint issues
- 253 tests, 99%+ coverage

### v0.1.6
- Maintenance release

### v0.1.4
- Refactored to modular structure — each hook has its own folder with README
- Added comprehensive documentation for all hooks
- Improved test coverage to 99%+
- Added more TypeScript utility types

### v0.1.3
- Added lifecycle hooks and helper functions
- Improved TypeScript support

### v0.1.2
- Fixed export issues — all hooks now use named exports
- Removed test files from distribution bundle

### v0.1.1
- Fixed hook exports and improved TypeScript support

### v0.1.0
- Initial release

---

## Support

If you find this library useful and are feeling generous, consider donating to **Svratište** — a day center in Belgrade providing support, meals, and shelter for people experiencing homelessness.

[![Facebook](https://img.shields.io/badge/Facebook-svratistebgd-1877F2?style=flat&logo=facebook&logoColor=white)](https://www.facebook.com/svratistebgd/?locale=sr_RS)
[![Instagram](https://img.shields.io/badge/Instagram-svratistebgd-E4405F?style=flat&logo=instagram&logoColor=white)](https://www.instagram.com/svratistebgd/)
[![Donate](https://img.shields.io/badge/Donate-cim.org.rs-FF6B35?style=flat&logo=heart&logoColor=white)](https://cim.org.rs/donacije/donacija/)

---

Made with ❤️ by [Petar Basic](https://github.com/petar-basic)
