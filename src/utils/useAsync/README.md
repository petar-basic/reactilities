# useAsync

Hook for managing async operations with loading, success, and error states. Prevents state updates after unmount and supports manual re-execution and reset.

## Usage

```tsx
import { useAsync } from 'reactilities';

function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error, execute } = useAsync(
    () => fetchUser(userId),
    true
  );

  if (loading) return <Spinner />;
  if (error) return <p>Error: {error.message}</p>;
  if (!data) return null;

  return (
    <div>
      <h1>{data.name}</h1>
      <button onClick={execute}>Refresh</button>
    </div>
  );
}
```

## API

### Parameters

- **`asyncFn`** (`() => Promise<T>`) — the async function to execute
- **`immediate`** (`boolean`, default: `true`) — whether to run on mount automatically

### Returns

| Property  | Type                      | Description                                        |
|-----------|---------------------------|----------------------------------------------------|
| `status`  | `'idle' \| 'loading' \| 'success' \| 'error'` | Current execution state |
| `data`    | `T \| null`               | Result data, available when `status === 'success'` |
| `error`   | `Error \| null`           | Error object, available when `status === 'error'`  |
| `loading` | `boolean`                 | Shorthand for `status === 'loading'`               |
| `execute` | `() => Promise<void>`     | Manually trigger the async function                |
| `reset`   | `() => void`              | Reset state back to idle                           |

## Examples

### Manual trigger — form submission

```tsx
function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const { loading, error, status, execute } = useAsync(
    () => submitForm(formData),
    false // don't run on mount
  );

  return (
    <form onSubmit={e => { e.preventDefault(); execute(); }}>
      <input value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {status === 'success' && <p>Message sent!</p>}
      {error && <p className="error">{error.message}</p>}
    </form>
  );
}
```

### Refresh on demand

```tsx
function Dashboard() {
  const { data, loading, execute } = useAsync(() => fetchStats(), true);

  return (
    <div>
      <button onClick={execute} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh'}
      </button>
      {data && <StatsDisplay stats={data} />}
    </div>
  );
}
```

### With reset

```tsx
function SearchBox() {
  const [query, setQuery] = useState('');

  const { data, loading, error, execute, reset } = useAsync(
    () => search(query),
    false
  );

  return (
    <div>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); reset(); }}
      />
      <button onClick={execute}>Search</button>
      {loading && <Spinner />}
      {data && <Results items={data} />}
    </div>
  );
}
```

## Features

- Discriminated union state — TypeScript narrows `data` / `error` correctly per `status`
- Prevents state updates on unmounted components (avoids React warnings)
- `asyncFn` reference is always up to date via `useRef` — no stale closure issues
- Non-`Error` rejections are automatically wrapped in `new Error(String(err))`
- `immediate = false` lets you use `execute` as a manual trigger (e.g. form submit)

## Notes

- For simple HTTP fetching with abort support, use `useFetch` instead
- `status` is a discriminated union — prefer branching on `status` over separate `loading` / `error` checks for exhaustive handling
