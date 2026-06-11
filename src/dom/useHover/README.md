# useHover

Hook for detecting when the user hovers over an element. Returns a ref to attach to the target and a boolean indicating hover state.

## Usage

```tsx
import { useHover } from 'reactilities';

function HoverCard() {
  const [ref, isHovered] = useHover<HTMLDivElement>();

  return (
    <div ref={ref} style={{ background: isHovered ? '#f0f0f0' : 'white' }}>
      {isHovered ? 'Hovered!' : 'Hover me'}
    </div>
  );
}
```

## API

### Returns

`[HoverRef<T>, boolean]` — tuple of a ref to attach to the element and a hover state boolean.

| Index | Type           | Description                                             |
|-------|----------------|--------------------------------------------------------|
| `[0]` | `HoverRef<T>`  | Attach to the target element via `ref=`                |
| `[1]` | `boolean`      | `true` while the cursor is over the element            |

`HoverRef<T>` is a callback ref (`(node: T \| null) => void`) that also exposes
`.current` for `RefObject`-style reads. Because it is a callback ref, listeners
are re-attached whenever the target element changes — including elements that
are rendered conditionally after mount, or removed/replaced while hovered (which
resets the hover state instead of leaving it stuck).

### Type parameter

- **`T extends HTMLElement`** — the element type (e.g. `HTMLDivElement`, `HTMLButtonElement`)

## Examples

### Tooltip on hover

```tsx
function TooltipButton({ label, tooltip }: { label: string; tooltip: string }) {
  const [ref, isHovered] = useHover<HTMLButtonElement>();

  return (
    <div style={{ position: 'relative' }}>
      <button ref={ref}>{label}</button>
      {isHovered && (
        <div className="tooltip">{tooltip}</div>
      )}
    </div>
  );
}
```

### Prefetch on hover

```tsx
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [ref, isHovered] = useHover<HTMLAnchorElement>();

  useEffect(() => {
    if (isHovered) prefetch(href);
  }, [isHovered, href]);

  return <a ref={ref} href={href}>{children}</a>;
}
```

### Highlight list item

```tsx
function ListItem({ label }: { label: string }) {
  const [ref, isHovered] = useHover<HTMLLIElement>();

  return (
    <li ref={ref} className={isHovered ? 'highlighted' : ''}>
      {label}
    </li>
  );
}
```

## Features

- Works with elements rendered conditionally after mount (state-backed callback ref)
- Resets hover state when the target is removed or replaced — no stuck tooltips/highlights
- Automatic `mouseenter` / `mouseleave` listener cleanup on unmount
- Generic type parameter for full TypeScript type safety
- Zero dependencies — no external libraries required
