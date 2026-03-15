# useIsomorphicLayoutEffect

A drop-in replacement for `useLayoutEffect` that is safe to use in SSR environments. Resolves to `useLayoutEffect` on the client and `useEffect` on the server, preventing the React warning: *"useLayoutEffect does nothing on the server"*.

## Usage

```tsx
import { useIsomorphicLayoutEffect } from 'reactilities';

function Tooltip({ anchorRef }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useIsomorphicLayoutEffect(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom, left: rect.left });
  }, [anchorRef]);

  return <div style={position}>Tooltip content</div>;
}
```

## API

This is a direct export of either `useLayoutEffect` or `useEffect` — it accepts exactly the same arguments as both.

### Parameters

- **`effect`** — the effect function, optionally returning a cleanup function
- **`deps`** (`DependencyList`, optional) — dependency array

### Returns

`void`

## When to use this

`useLayoutEffect` is the right choice when your effect reads or mutates the DOM synchronously (measurements, animations, avoiding flash of wrong UI). But it triggers a warning in SSR frameworks like Next.js or Remix because there is no DOM on the server.

`useIsomorphicLayoutEffect` lets you keep the correct client-side semantics while silencing the server warning.

## Examples

### DOM measurement

```tsx
function AutoResizeTextarea({ value }: { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return <textarea ref={ref} value={value} readOnly />;
}
```

### Sync scroll position

```tsx
function SyncedScroller({ scrollTop }: { scrollTop: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = scrollTop;
  }, [scrollTop]);

  return <div ref={ref} style={{ overflow: 'auto', height: 300 }}>...</div>;
}
```

### Prevent layout flash

```tsx
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useLocalStorage('theme', 'light');

  // Apply theme class before browser paints to avoid flash
  useIsomorphicLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}
```

## Notes

- On the client this is identical to `useLayoutEffect` — same timing, same behavior
- On the server this falls back to `useEffect`, which is a no-op during SSR rendering
- The library itself uses this hook internally for `useLockBodyScroll`
