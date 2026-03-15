# useSet

Hook for managing a `Set` with React state integration. All mutations create new `Set` instances, ensuring React re-renders correctly.

## Usage

```tsx
import { useSet } from 'reactilities';

function TagFilter({ tags }: { tags: string[] }) {
  const { set: selected, toggle, has } = useSet<string>();

  return (
    <div>
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => toggle(tag)}
          style={{ fontWeight: has(tag) ? 'bold' : 'normal' }}
        >
          {tag}
        </button>
      ))}
      <p>{selected.size} selected</p>
    </div>
  );
}
```

## API

### Parameters

- **`initialValues`** (`T[]`, optional) — initial values to populate the set

### Returns

| Property | Type                      | Description                                       |
|----------|---------------------------|---------------------------------------------------|
| `set`    | `Set<T>`                  | Current Set state                                 |
| `add`    | `(value: T) => void`      | Add a value to the set                            |
| `remove` | `(value: T) => void`      | Remove a value from the set                       |
| `toggle` | `(value: T) => void`      | Add if absent, remove if present                  |
| `has`    | `(value: T) => boolean`   | Check if a value is in the set                    |
| `clear`  | `() => void`              | Remove all values                                 |
| `reset`  | `(values?: T[]) => void`  | Replace the entire set with optional new values   |

## Examples

### Multi-select with "select all"

```tsx
function MultiSelect({ options }: { options: string[] }) {
  const { set: selected, add, remove, has, reset } = useSet<string>();

  const selectAll = () => reset(options);
  const clearAll = () => reset();

  return (
    <div>
      <button onClick={selectAll}>Select all</button>
      <button onClick={clearAll}>Clear</button>
      {options.map(opt => (
        <label key={opt}>
          <input
            type="checkbox"
            checked={has(opt)}
            onChange={e => e.target.checked ? add(opt) : remove(opt)}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}
```

### Track visited pages

```tsx
function App() {
  const { add, has } = useSet<string>();

  const navigate = (path: string) => {
    add(path);
    router.push(path);
  };

  return <NavLink visited={has('/about')} onClick={() => navigate('/about')} />;
}
```

### Permission flags

```tsx
function PermissionEditor({ userId }: { userId: string }) {
  const { set: perms, toggle, has } = useSet<string>(['read']);

  return (
    <div>
      {['read', 'write', 'admin'].map(perm => (
        <label key={perm}>
          <input type="checkbox" checked={has(perm)} onChange={() => toggle(perm)} />
          {perm}
        </label>
      ))}
      <button onClick={() => savePermissions(userId, [...perms])}>Save</button>
    </div>
  );
}
```

## Features

- All mutations are immutable — each operation returns a new `Set` instance
- `toggle` is atomic — no need to check `has` before calling
- `reset(values)` replaces the entire set; `reset()` with no args clears it
- All callbacks are stable (`useCallback`) — safe to pass as props
