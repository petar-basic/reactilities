# useMap

Hook for managing a `Map` with React state integration. All mutations create new `Map` instances, ensuring React re-renders correctly.

## Usage

```tsx
import { useMap } from 'reactilities';

function FormWithValidation() {
  const { map: errors, set: setError, delete: clearError, has } = useMap<string, string>();

  const validate = (field: string, value: string) => {
    if (!value) setError(field, 'This field is required');
    else clearError(field);
  };

  return (
    <form>
      <input name="email" onChange={e => validate('email', e.target.value)} />
      {has('email') && <span className="error">{errors.get('email')}</span>}
    </form>
  );
}
```

## API

### Parameters

- **`initialEntries`** (`[K, V][]`, optional) — initial key-value pairs

### Returns

| Property | Type                          | Description                               |
|----------|-------------------------------|-------------------------------------------|
| `map`    | `Map<K, V>`                   | Current Map state                         |
| `set`    | `(key: K, value: V) => void`  | Set a key-value pair                      |
| `get`    | `(key: K) => V \| undefined`  | Get a value by key                        |
| `delete` | `(key: K) => void`            | Delete a key-value pair                   |
| `has`    | `(key: K) => boolean`         | Check if a key exists                     |
| `clear`  | `() => void`                  | Remove all entries                        |
| `reset`  | `(entries?: [K, V][]) => void`| Replace the entire map with new entries   |

## Examples

### Request loading states

```tsx
function DataTable() {
  const { set, has, delete: remove, map: loading } = useMap<string, boolean>();

  const fetchRow = async (id: string) => {
    set(id, true);
    await loadRow(id);
    remove(id);
  };

  return (
    <table>
      {rows.map(row => (
        <tr key={row.id}>
          <td>{row.name}</td>
          <td>
            {has(row.id)
              ? <Spinner />
              : <button onClick={() => fetchRow(row.id)}>Load</button>
            }
          </td>
        </tr>
      ))}
    </table>
  );
}
```

### Client-side cache

```tsx
function DataCache() {
  const { map: cache, set, has, get } = useMap<string, ApiResponse>();

  const fetchWithCache = async (key: string) => {
    if (has(key)) return get(key);
    const data = await fetchData(key);
    set(key, data);
    return data;
  };
}
```

### Expand/collapse panels

```tsx
function Accordion({ sections }: { sections: Section[] }) {
  const { toggle, has } = useMap<string, boolean>();

  // Reuse useMap's has + delete + set pattern as a toggle:
  const { set, delete: remove } = useMap<string, true>();
  const isOpen = (id: string) => has(id);
  const toggleSection = (id: string) => isOpen(id) ? remove(id) : set(id, true);

  return sections.map(s => (
    <div key={s.id}>
      <button onClick={() => toggleSection(s.id)}>{s.title}</button>
      {isOpen(s.id) && <div>{s.content}</div>}
    </div>
  ));
}
```

## Features

- All mutations are immutable — each operation returns a new `Map` instance
- Fully generic — `useMap<K, V>()` with any key and value types
- `reset(entries)` replaces the entire map; `reset()` clears it
- All callbacks are stable (`useCallback`) — safe to pass as props
- `delete` is exposed as a named method despite being a reserved word
