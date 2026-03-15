# useFetch

Hook for data fetching with automatic abort on re-fetch or unmount. Built on top of `useAsync` with `AbortController` support. Throws on non-2xx responses and handles JSON parsing automatically.

## Usage

```tsx
import { useFetch } from 'reactilities';

function UserList() {
  const { data, loading, error } = useFetch<User[]>('/api/users');

  if (loading) return <Spinner />;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

## API

### Parameters

- **`url`** (`string`) — URL to fetch
- **`options`** (`RequestInit`, optional) — standard `fetch` options (method, headers, body, etc.)
- **`immediate`** (`boolean`, default: `true`) — whether to fetch on mount automatically

### Returns

Same interface as `useAsync`:

| Property  | Type                      | Description                                        |
|-----------|---------------------------|----------------------------------------------------|
| `status`  | `'idle' \| 'loading' \| 'success' \| 'error'` | Current fetch state     |
| `data`    | `T \| null`               | Parsed JSON response, available on success         |
| `error`   | `Error \| null`           | Error on network failure or non-2xx response       |
| `loading` | `boolean`                 | `true` while the request is in-flight              |
| `execute` | `() => Promise<void>`     | Manually trigger the fetch                         |
| `reset`   | `() => void`              | Reset state back to idle                           |

## Examples

### Fetch when query changes

```tsx
function SearchResults({ query }: { query: string }) {
  const { data, loading, error } = useFetch<SearchResult[]>(
    `/api/search?q=${encodeURIComponent(query)}`
  );

  if (loading) return <Spinner />;
  if (error) return <p>Search failed: {error.message}</p>;

  return <ResultList items={data ?? []} />;
}
```

### POST request (manual trigger)

```tsx
function SubmitForm() {
  const [name, setName] = useState('');

  const { execute, loading, status, error } = useFetch<{ id: string }>(
    '/api/users',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    },
    false // don't fetch on mount
  );

  return (
    <form onSubmit={e => { e.preventDefault(); execute(); }}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button type="submit" disabled={loading}>
        {status === 'success' ? 'Saved!' : loading ? 'Saving...' : 'Save'}
      </button>
      {error && <p>{error.message}</p>}
    </form>
  );
}
```

### With custom headers

```tsx
function ProtectedResource() {
  const { data, loading } = useFetch<PrivateData>(
    '/api/private',
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return loading ? <Spinner /> : <DataView data={data} />;
}
```

## Features

- Previous requests are automatically aborted when `execute` is called again
- Request is aborted on component unmount — no memory leaks
- Non-2xx responses throw `Error: HTTP 404: Not Found` (and similar)
- JSON is parsed automatically — no need to call `.json()` manually
- Built on `useAsync` — shares the same discriminated union state

## Notes

- Only fetches JSON responses — for other content types use `useAsync` with a custom fetch function
- The `options` object is part of the dependency array — use `useMemo` if you construct it inline to avoid unnecessary re-fetches
