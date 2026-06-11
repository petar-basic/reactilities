# Reactilities

A comprehensive collection of useful React hooks and utilities for modern web development. Built with TypeScript for excellent developer experience and type safety.

[![npm version](https://badge.fury.io/js/reactilities.svg)](https://badge.fury.io/js/reactilities)
[![CI](https://github.com/petar-basic/reactilities/actions/workflows/ci.yml/badge.svg)](https://github.com/petar-basic/reactilities/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/petar-basic/reactilities/branch/main/graph/badge.svg)](https://codecov.io/gh/petar-basic/reactilities)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Installation

```bash
npm install reactilities
# or
yarn add reactilities
# or
pnpm add reactilities
```

### Requirements

- **React** >= 18.0.0 (tested against React 18 and 19)
- **React DOM** >= 18.0.0

> **Note:** This library uses `useSyncExternalStore`, which requires React 18 or higher.

### Importing

Import everything from the package root, or a single hook from its subpath — both
tree-shake to only the code you use:

```tsx
import { useDebounce, useLocalStorage } from 'reactilities';
// or, per-hook subpath (ships ~0.5 KB for one hook):
import { useDebounce } from 'reactilities/useDebounce';
```

### Next.js / React Server Components

Every hook ships with the `"use client"` directive, so you can import them from
Client Components in the Next.js App Router without any wrapper. Hooks that read
browser-only state (`useMediaQuery`, `useLocalStorage`, `useSessionStorage`,
`useNetworkState`, `useDarkMode`, `useWindowSize`, …) are built on
`useSyncExternalStore` and return a stable **server snapshot** during SSR, so they
never crash server rendering and produce no hydration mismatch — the real value
applies after mount.

## Features

- **70+ React Hooks** — DOM manipulation, state management, async, timers, and more
- **Lifecycle Helpers** — class component lifecycle methods as hooks
- **Helper Functions** — utility functions for common tasks
- **TypeScript Types** — utility types for better type safety
- **TypeScript First** — full type support with excellent IntelliSense; verified with `publint` and `are-the-types-wrong` (works under `bundler`, `node16`, and `nodenext`)
- **Well Tested** — 857 tests on a React 18 + 19 CI matrix
- **Tree Shakable** — package-root or per-hook subpath imports
- **Zero Dependencies** — no external dependencies except React
- **SSR Safe** — built for the Next.js App Router; browser-backed hooks return server snapshots instead of throwing
- **Comprehensive Docs** — each hook has its own detailed README

## API Reference

Each hook and utility has its own detailed documentation with examples. Click on any item below to see full documentation.

### DOM Hooks

Hooks for DOM manipulation and browser APIs.

- **[useBattery](./src/dom/useBattery/README.md)** - Monitor device battery status via the Battery Status API
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
- **[useOrientation](./src/dom/useOrientation/README.md)** - Track device screen orientation (portrait/landscape)
- **[usePageVisibility](./src/dom/usePageVisibility/README.md)** - Detect when browser tab is hidden or visible
- **[usePortal](./src/dom/usePortal/README.md)** - Create a DOM portal container appended to document.body
- **[useResizeObserver](./src/dom/useResizeObserver/README.md)** - Observe element size changes with ResizeObserver
- **[useRovingTabIndex](./src/dom/useRovingTabIndex/README.md)** - Keyboard-navigable lists and menus with roving tabIndex (ARIA)
- **[useScrollPosition](./src/dom/useScrollPosition/README.md)** - Track window scroll position
- **[useScrollTo](./src/dom/useScrollTo/README.md)** - Programmatic scroll control (top, bottom, element, or position)
- **[useWindowSize](./src/dom/useWindowSize/README.md)** - Track browser window dimensions

### State Hooks

Hooks for state management and persistence.

- **[useBoolean](./src/state/useBoolean/README.md)** - Boolean state with named setTrue/setFalse/toggle controls
- **[useClipboard](./src/state/useClipboard/README.md)** - Read from and write to the clipboard with hasCopied tracking
- **[useCookie](./src/state/useCookie/README.md)** - Read and write browser cookies
- **[useCopyToClipboard](./src/state/useCopyToClipboard/README.md)** - Copy text to clipboard with fallback
- **[useCounter](./src/state/useCounter/README.md)** - Numeric counter with min/max bounds and step
- **[useList](./src/state/useList/README.md)** - Manage array state with push, remove, sort, and more
- **[useLocalStorage](./src/state/useLocalStorage/README.md)** - Persist state in localStorage with sync
- **[useMap](./src/state/useMap/README.md)** - Manage Map state with React integration
- **[useObjectState](./src/state/useObjectState/README.md)** - Manage object state with partial updates
- **[usePrevious](./src/state/usePrevious/README.md)** - Access the previous render's value
- **[useSessionStorage](./src/state/useSessionStorage/README.md)** - Persist state in sessionStorage
- **[useSet](./src/state/useSet/README.md)** - Manage Set state with React integration
- **[useStep](./src/state/useStep/README.md)** - Multi-step wizard and onboarding flow state management
- **[useToggle](./src/state/useToggle/README.md)** - Toggle boolean state with flexible API
- **[useUndoRedo](./src/state/useUndoRedo/README.md)** - State with full undo/redo history

### Utility Hooks

Performance and utility hooks for common patterns.

- **[useAsync](./src/utils/useAsync/README.md)** - Manage async operations with loading/error/success states
- **[useAutoSave](./src/utils/useAutoSave/README.md)** - Auto-save data after a debounce delay with pending/saved/error status
- **[useCountdown](./src/utils/useCountdown/README.md)** - Countdown and count-up timer with controls
- **[useDebounce](./src/utils/useDebounce/README.md)** - Debounce rapidly changing values
- **[useDebounceCallback](./src/utils/useDebounceCallback/README.md)** - Debounce a callback function (vs useDebounce which debounces values)
- **[useDragAndDrop](./src/utils/useDragAndDrop/README.md)** - File drag-and-drop with type, count, and size validation
- **[useEventSource](./src/utils/useEventSource/README.md)** - Manage Server-Sent Events (SSE) connections
- **[useFetch](./src/utils/useFetch/README.md)** - Data fetching with automatic abort support
- **[useFileReader](./src/utils/useFileReader/README.md)** - Read File objects as text, data URL, or ArrayBuffer
- **[useGeolocation](./src/utils/useGeolocation/README.md)** - Access user's geolocation
- **[useIdleTimeout](./src/utils/useIdleTimeout/README.md)** - Detect user inactivity after a configurable timeout
- **[useImageLazyLoad](./src/utils/useImageLazyLoad/README.md)** - Lazy-load images when they enter the viewport
- **[useInfiniteScroll](./src/utils/useInfiniteScroll/README.md)** - Infinite scroll via IntersectionObserver
- **[useIntersectionObserver](./src/utils/useIntersectionObserver/README.md)** - Detect element visibility (lazy loading, infinite scroll)
- **[useInterval](./src/utils/useInterval/README.md)** - Run a callback on a fixed interval
- **[useIsMounted](./src/utils/useIsMounted/README.md)** - Guard async state updates against unmounted components
- **[useKeyboardShortcuts](./src/utils/useKeyboardShortcuts/README.md)** - Handle keyboard shortcuts
- **[useLogger](./src/utils/useLogger/README.md)** - Log component mount, update, and unmount events (dev only)
- **[useManualUpdate](./src/utils/useManualUpdate/README.md)** - Manually trigger a component re-render
- **[useNetworkState](./src/utils/useNetworkState/README.md)** - Monitor network connectivity
- **[usePermission](./src/utils/usePermission/README.md)** - Query browser permission status reactively
- **[useSpeechRecognition](./src/utils/useSpeechRecognition/README.md)** - Voice input via the Web Speech Recognition API
- **[useSpeechSynthesis](./src/utils/useSpeechSynthesis/README.md)** - Text-to-speech via the Web Speech Synthesis API
- **[useThrottle](./src/utils/useThrottle/README.md)** - Throttle rapidly changing values
- **[useThrottleCallback](./src/utils/useThrottleCallback/README.md)** - Throttle a callback function (vs useThrottle which throttles values)
- **[useTimeout](./src/utils/useTimeout/README.md)** - Run a callback after a delay with reset/clear
- **[useVirtualization](./src/utils/useVirtualization/README.md)** - Virtualize large lists for performance
- **[useWebSocket](./src/utils/useWebSocket/README.md)** - Manage WebSocket connections
- **[useWhyDidYouRender](./src/utils/useWhyDidYouRender/README.md)** - Debug unnecessary re-renders by logging what changed (dev only)
- **[useWorker](./src/utils/useWorker/README.md)** - Run heavy computations in a Web Worker off the main thread

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
- **857 tests** covering all functionality
- Run on every commit against **React 18 and React 19** (CI matrix)
- Tested with Vitest and React Testing Library

## License

MIT © [Petar Basic](https://github.com/petar-basic)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history. Notable changes
are kept there following [Keep a Changelog](https://keepachangelog.com/).

---

## Support

If you find this library useful and are feeling generous, consider donating to **Svratište** — a day center in Belgrade providing support, meals, and shelter for people experiencing homelessness.

[![Facebook](https://img.shields.io/badge/Facebook-svratistebgd-1877F2?style=flat&logo=facebook&logoColor=white)](https://www.facebook.com/svratistebgd/?locale=sr_RS)
[![Instagram](https://img.shields.io/badge/Instagram-svratistebgd-E4405F?style=flat&logo=instagram&logoColor=white)](https://www.instagram.com/svratistebgd/)
[![Donate](https://img.shields.io/badge/Donate-cim.org.rs-FF6B35?style=flat&logo=heart&logoColor=white)](https://cim.org.rs/donacije/donacija/)

---

Made with ❤️ by [Petar Basic](https://github.com/petar-basic)
