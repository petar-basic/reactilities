# useRovingTabIndex

Hook for keyboard-navigable lists and menus using the roving tabIndex pattern. Only the focused item is in the tab order (`tabIndex=0`); all others are set to `tabIndex=-1`. Arrow keys move focus within the container; Tab moves focus out of it entirely. Required for accessible menus, toolbars, tab lists, and radio groups per WAI-ARIA guidelines.

## Usage

```tsx
import { useRovingTabIndex } from 'reactilities';

function Menu({ items }: { items: string[] }) {
  const { getContainerProps, getItemProps } = useRovingTabIndex(items.length);

  return (
    <ul role="menu" {...getContainerProps()}>
      {items.map((item, i) => (
        <li key={item} role="menuitem" {...getItemProps(i)}>
          {item}
        </li>
      ))}
    </ul>
  );
}
```

## API

### Parameters

- **`itemCount`** (`number`) - Total number of navigable items
- **`options.orientation`** (`'vertical' | 'horizontal'`) - Axis of navigation: `'vertical'` uses Up/Down arrows, `'horizontal'` uses Left/Right (default: `'vertical'`)
- **`options.loop`** (`boolean`) - Whether arrow navigation wraps around at boundaries (default: `true`)

### Returns

| Function | Returns | Description |
|---|---|---|
| `getContainerProps()` | `{ onKeyDown }` | Props to spread onto the container element |
| `getItemProps(index)` | `{ tabIndex, ref }` | Props to spread onto each navigable item |

## Examples

### Vertical menu with loop

```tsx
const NAV_ITEMS = ['Home', 'About', 'Services', 'Contact'];

function NavMenu() {
  const { getContainerProps, getItemProps } = useRovingTabIndex(NAV_ITEMS.length);

  return (
    <nav>
      <ul role="menu" {...getContainerProps()}>
        {NAV_ITEMS.map((item, i) => (
          <li key={item} role="menuitem" {...getItemProps(i)}>
            <a href={`#${item.toLowerCase()}`}>{item}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### Horizontal toolbar

```tsx
function Toolbar({ actions }: { actions: Action[] }) {
  const { getContainerProps, getItemProps } = useRovingTabIndex(actions.length, {
    orientation: 'horizontal',
    loop: false
  });

  return (
    <div role="toolbar" aria-label="Text formatting" {...getContainerProps()}>
      {actions.map((action, i) => (
        <button
          key={action.id}
          aria-label={action.label}
          onClick={action.handler}
          {...getItemProps(i)}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
```

### Radio group

```tsx
function RadioGroup({ options, value, onChange }: RadioGroupProps) {
  const { getContainerProps, getItemProps } = useRovingTabIndex(options.length, {
    orientation: 'vertical',
    loop: false
  });

  return (
    <div role="radiogroup" {...getContainerProps()}>
      {options.map((option, i) => (
        <label key={option.value} {...getItemProps(i)}>
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            tabIndex={-1}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
```

## Features

- ✅ WAI-ARIA compliant roving tabIndex pattern
- ✅ Supports both vertical (Up/Down) and horizontal (Left/Right) navigation
- ✅ Home/End key jumps to first/last item
- ✅ Configurable looping at boundaries
- ✅ Stable prop getter references

## Notes

- Spread `getItemProps(i)` on the element that should receive focus, not a wrapper
- The `ref` returned by `getItemProps` is a callback ref — it registers the DOM node for programmatic focus
- First item starts in the tab order by default (`tabIndex=0`)
- Tab key moves focus out of the entire widget — this is intentional per ARIA patterns

## When to Use

- **Menus and dropdowns** — standard keyboard navigation
- **Toolbars** — horizontal navigation between action buttons
- **Tab lists** — switch between panels with arrow keys
- **Radio groups** — select between options with arrow keys
- **Listboxes** — navigate a custom list component
