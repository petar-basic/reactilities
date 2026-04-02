# useDebounceCallback

Hook for debouncing a callback function. Returns a stable debounced version of the callback that delays execution until after the specified delay has passed since the last call. Unlike `useDebounce` which debounces values, this debounces the function call itself.

## Usage

```tsx
import { useDebounceCallback } from 'reactilities';

function SearchInput() {
  const [results, setResults] = useState([]);

  const fetchResults = useDebounceCallback(async (query: string) => {
    const data = await searchAPI(query);
    setResults(data);
  }, 500);

  return <input onChange={(e) => fetchResults(e.target.value)} />;
}
```

## API

### Parameters

- **`callback`** (`T extends (...args: any[]) => any`) - The function to debounce
- **`delay`** (`number`) - Delay in milliseconds before invoking the callback

### Returns

`(...args: Parameters<T>) => void` - A debounced version of the callback

## Examples

### Search as you type

```tsx
function SearchBar() {
  const [results, setResults] = useState<Product[]>([]);

  const search = useDebounceCallback(async (query: string) => {
    if (!query) return setResults([]);
    const data = await fetch(`/api/search?q=${query}`).then(r => r.json());
    setResults(data);
  }, 400);

  return (
    <div>
      <input onChange={(e) => search(e.target.value)} placeholder="Search..." />
      <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>
    </div>
  );
}
```

### Save on keystroke

```tsx
function NoteEditor({ noteId }: { noteId: string }) {
  const saveNote = useDebounceCallback((content: string) => {
    api.patch(`/notes/${noteId}`, { content });
  }, 1000);

  return (
    <textarea
      onChange={(e) => saveNote(e.target.value)}
      placeholder="Start typing..."
    />
  );
}
```

### Validate on input

```tsx
function UsernameField() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');

  const checkUsername = useDebounceCallback(async (username: string) => {
    if (username.length < 3) return;
    setStatus('checking');
    const taken = await api.checkUsername(username);
    setStatus(taken ? 'taken' : 'available');
  }, 600);

  return (
    <div>
      <input onChange={(e) => checkUsername(e.target.value)} />
      {status === 'checking' && <span>Checking...</span>}
      {status === 'taken' && <span>Username taken</span>}
      {status === 'available' && <span>Available!</span>}
    </div>
  );
}
```

### Resize handler

```tsx
function ResizeAwareComponent() {
  const recalculate = useDebounceCallback(() => {
    const width = window.innerWidth;
    updateLayout(width);
  }, 200);

  useEffect(() => {
    window.addEventListener('resize', recalculate);
    return () => window.removeEventListener('resize', recalculate);
  }, [recalculate]);

  return <div>Resize-aware content</div>;
}
```

## Features

- ✅ Debounces the function call, not just the value
- ✅ Returned function has a stable reference (safe to use as event handler)
- ✅ Always calls the latest version of the callback
- ✅ Timer is cleared on unmount
- ✅ TypeScript generic inference for argument types
- ✅ Zero external dependencies

## Notes

- The returned function is stable across renders — its reference only changes when `delay` changes
- The callback ref is always up to date, so you never get stale closure values
- Prefer this over `useDebounce` when you want to debounce side effects rather than derived state
- Timer is cancelled on unmount to prevent state updates on unmounted components

## When to Use

- **Search inputs** — fire API call only after user stops typing
- **Auto-save** — persist changes after a pause in editing
- **Input validation** — validate after the user finishes a field
- **Resize/scroll handlers** — batch layout recalculations
- **Analytics** — batch event tracking calls
