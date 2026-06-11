# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

A correctness, SSR, and packaging overhaul. Every fix below ships with a
regression test (verified to fail before the fix).

### Added

- **Per-hook subpath exports** — import a single hook directly, e.g.
  `import { useClickOutside } from 'reactilities/useClickOutside'`. Each hook is
  its own entry (`useBoolean` ships ~0.5 KB vs the ~82 KB full bundle).
- **`"use client"` directive** in every emitted bundle, so the hooks work in the
  Next.js App Router / React Server Components without consumer wrappers.
- **`isSupported`** flag returned from `useFullscreen`.
- Type-regression fixtures (`*.typecheck.tsx`) + `npm run typecheck` gate.
- CI (GitHub Actions): lint, typecheck, build, `publint`, `attw`, and tests on a
  React 18 + 19 matrix; provenance-signed release workflow.

### Fixed

- **Types now resolve under `node16`/`nodenext`** (previously broke for every
  TypeScript consumer using those module-resolution modes) — declarations are
  rolled up and shipped as both `.d.ts` and `.d.cts`; `attw` and `publint` clean.
- **SSR crashes** — `useMediaQuery`, `useNetworkState`, `useLocalStorage`,
  `useSessionStorage`, `useDarkMode` no longer throw from `getServerSnapshot`;
  they return sensible server defaults (no Next.js/Remix render crash).
- `useWebSocket` — no longer reconnects after unmount/URL change (zombie sockets),
  no longer reconnects on every render with an inline `protocols` array, and
  `lastJsonMessage` is derived (no ref-read during render).
- `useFetch`/`useAsync` — re-fetches on URL change, no longer surfaces the aborted
  previous request as an error, ignores out-of-order responses, aborts on unmount.
- `useThrottle` — now actually emits (was frozen under continuous changes).
- `useCountdown` — count-up mode works with the default stop value.
- `useRovingTabIndex` — the `tabindex` attribute now roves (WAI-ARIA).
- `useOrientation` — correct landscape detection on desktop and angle 270.
- `useLockBodyScroll` — nested locks no longer permanently lock the page.
- `useKeyboardShortcuts` — no longer crashes during SSR.
- `useLocalStorage`/`useSessionStorage`/`useCookie` — stable value identity,
  correct functional updates, cross-instance sync, hydration-safe.
- Hooks taking/returning element refs (`useClickOutside`, `useFocusTrap`,
  `useIntersectionObserver`, `useInfiniteScroll`, `useVirtualization`,
  `useWorker`) are now generic so their own documented usage type-checks under
  `@types/react` 19.
- Hooks that observe a ref'd element (`useEventListener`, `useHover`,
  `useResizeObserver`, `useIntersectionObserver`, `useInfiniteScroll`,
  `useVirtualization`) now attach to elements mounted/replaced after first render.
- `useLongPress` clears its timer on unmount and on a second pointer-down.
- `useGeolocation` re-registers the watch when options change.
- `usePermission` no longer leaks a change listener on a pending-query unmount.
- `useEventSource` resets state when the URL becomes `null`.
- `useBattery` `isSupported` no longer causes a hydration mismatch.
- StrictMode: `useUpdateEffect`/`componentDidUpdate` no longer fire on mount;
  `useAutoSave` no longer fires a spurious save; `componentWillUnmount` uses the
  latest callback; `componentDidMount` forwards cleanup; `componentWillMount`
  runs before first render.
- `classnames` filters falsy primitives (clsx-compatible); `scriptLoader`
  assigns event-handler props so `onload`/`onerror` fire.

### Changed

- Build migrated from Vite library mode to **tsup** (ESM + CJS, per-entry types).
- Dropped the UMD bundle (a hooks library is never used as a browser global);
  `require` now resolves to a real CommonJS build.
- `exports` map split into `import`/`require` conditions, each with its own types.

## [0.5.0]

### Added — New Hooks (20)

**DOM**

- `useBattery` — battery level, charging state, charge/discharge times (Battery Status API).
- `useOrientation` — screen orientation (portrait/landscape) with angle; Screen Orientation API + legacy `orientationchange`.
- `usePortal` — DOM portal container mounted to `document.body`.
- `useRovingTabIndex` — keyboard-navigable lists/menus (WAI-ARIA roving tabIndex); vertical/horizontal + loop.
- `useScrollTo` — `scrollToTop`, `scrollToBottom`, `scrollToElement`, `scrollTo(x, y)`.

**State**

- `useClipboard` — read/write clipboard (modern API + `execCommand` fallback); `hasCopied` with auto-reset.
- `useStep` — multi-step wizard state; boundary-safe `next`/`prev`/`goTo`/`reset`.

**Utility**

- `useAutoSave` — debounced auto-save with `idle/pending/saving/saved/error` + `lastSavedAt`; manual `save()`.
- `useDebounceCallback` — debounce a callback (complements `useDebounce`).
- `useDragAndDrop` — file drag-and-drop with MIME/extension/count/size validation.
- `useEventSource` — Server-Sent Events; `lastMessage`, `readyState`, `close()`.
- `useFileReader` — read `File` as text/data URL/ArrayBuffer; `reset()` aborts in-progress reads.
- `useIdleTimeout` — inactivity detection with `onIdle`/`onActive` and `reset()`.
- `useImageLazyLoad` — lazy-load images via `IntersectionObserver`; placeholder/threshold/rootMargin.
- `useLogger` — log mount/update (changed-props diff)/unmount (dev only).
- `useSpeechRecognition` — voice input; `transcript`, `interimTranscript`, `start`/`stop`/`reset`.
- `useSpeechSynthesis` — text-to-speech; voice/rate/pitch/volume; `speak`/`pause`/`resume`/`cancel`.
- `useThrottleCallback` — throttle a callback with trailing edge (complements `useThrottle`).
- `useWhyDidYouRender` — log which props/state changed (dev only).
- `useWorker` — run a self-contained function in a Web Worker.

### Fixed

- `useAutoSave` — effect cleanup no longer calls `save()` on every data change (only clears the pending timer).
- `useFileReader` — guarded `abort` against environments lacking it.

## [0.4.1]

### Fixed

- `useWebSocket` — fixed infinite reconnection loop with inline callback props (callbacks moved to refs).
- `useLocalStorage` / `useSessionStorage` — functional updaters no longer fail when the key is absent.
- `useThrottle` — trailing-edge timeout no longer records a stale timestamp.
- `useCopyToClipboard` — `execCommand` fallback no longer reports success on failure.
- `loadScript` — boolean `false` attributes now `removeAttribute` instead of setting `"false"`.

### Changed

- `useGeolocation` — `optionsRef` updated each render so option changes are picked up.
- `useEventListener` — type widened to accept `HTMLElement | null`; safer `'current' in target` check.
- `useLocalStorage` / `useSessionStorage` — `initialValue` stabilised via `useRef`.
- Lifecycle hooks — added JSDoc warning about top-level call discipline.

## [0.4.0]

- Added 9 hooks: `useCounter`, `useBoolean`, `useUpdateEffect`, `useIsMounted`, `usePageVisibility`, `useMousePosition`, `useDarkMode`, `useLongPress`, `useFullscreen`. 421 tests.

## [0.3.0]

- Added 4 hooks: `useUndoRedo`, `usePermission`, `useFocusTrap`, `useInfiniteScroll`.
- `useVirtualization` — replaced `data-` attribute selector with returned `containerRef` (breaking change).
- Fixed `useEventListener` (`useRef` handler pattern) and `useWebSocket` (unstable default `shouldReconnect`). 363 tests.

## [0.2.0]

- Added 15 hooks: `useAsync`, `useFetch`, `useInterval`, `useTimeout`, `useCountdown`, `useWindowSize`, `useScrollPosition`, `useHover`, `useResizeObserver`, `usePrevious`, `useList`, `useSet`, `useMap`, `useCookie`, `useIsomorphicLayoutEffect`.
- Added SSR guards; React peer dependency raised to >= 18 (for `useSyncExternalStore`); removed `js-cookie`. 253 tests.

## [0.1.4]

- Modular structure (one folder + README per hook); more TypeScript utility types; 99%+ coverage.

## [0.1.3]

- Added lifecycle hooks and helper functions.

## [0.1.2]

- All hooks use named exports; test files removed from the bundle.

## [0.1.0]

- Initial release.
