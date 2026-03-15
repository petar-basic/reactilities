# useTimeout

Hook for running a callback after a delay with `clear` and `reset` controls. Safely handles callback updates and cleans up on unmount. Pass `null` as the delay to disable the timeout entirely.

## Usage

```tsx
import { useTimeout } from 'reactilities';

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useTimeout(onDismiss, 3000);

  return <div className="toast">{message}</div>;
}
```

## API

### Parameters

- **`callback`** (`() => void`) — function to call after the delay
- **`delay`** (`number | null`) — delay in milliseconds, or `null` to disable

### Returns

| Property | Type         | Description                        |
|----------|--------------|------------------------------------|
| `clear`  | `() => void` | Cancel the pending timeout         |
| `reset`  | `() => void` | Restart the timeout from zero      |

## Examples

### Session inactivity warning

```tsx
function SessionGuard() {
  const [showWarning, setShowWarning] = useState(false);
  const { reset, clear } = useTimeout(() => setShowWarning(true), 30 * 60 * 1000);

  const handleActivity = () => {
    setShowWarning(false);
    reset(); // Restart the 30-minute timer on any activity
  };

  return (
    <div onMouseMove={handleActivity} onClick={handleActivity}>
      {showWarning && <SessionExpiredModal onClose={clear} />}
    </div>
  );
}
```

### Delayed tooltip

```tsx
function DelayedTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const { reset, clear } = useTimeout(() => setVisible(true), 500);

  return (
    <div
      onMouseEnter={reset}
      onMouseLeave={() => { clear(); setVisible(false); }}
    >
      {text}
      {visible && <span className="tooltip">Tooltip!</span>}
    </div>
  );
}
```

### Debounce-style effect

```tsx
function SearchBox() {
  const [query, setQuery] = useState('');
  const { reset } = useTimeout(() => performSearch(query), 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    reset(); // Restart the 300ms timer on every keystroke
  };

  return <input value={query} onChange={handleChange} />;
}
```

### Conditional enable/disable

```tsx
function ConditionalTimeout({ enabled }: { enabled: boolean }) {
  useTimeout(() => console.log('Fired!'), enabled ? 2000 : null);
  // Timeout only runs when enabled is true
}
```

## Features

- Callback is always up to date via `useRef` — changing it does not restart the timeout
- `reset()` cancels the current timeout and starts a fresh one
- Timeout is automatically cleared on unmount
- Pass `null` to disable without removing the hook from the component tree

## Notes

- Changing `delay` automatically resets the timeout
- For repeating intervals, use `useInterval` instead
