# useIdleTimeout

Hook for detecting user inactivity after a configurable timeout. Resets automatically on any user interaction. Useful for session expiry warnings, auto-logout, screen dimming, and triggering auto-save after a pause.

## Usage

```tsx
import { useIdleTimeout } from 'reactilities';

function App() {
  const { isIdle } = useIdleTimeout({
    timeout: 5 * 60 * 1000, // 5 minutes
    onIdle: () => showSessionWarning(),
    onActive: () => hideSessionWarning()
  });

  return <div>{isIdle ? 'You are idle' : 'Active'}</div>;
}
```

## API

### Parameters

- **`options.timeout`** (`number`) - Time in milliseconds of inactivity before considered idle
- **`options.events`** (`string[]`) - DOM events that count as activity (default: `['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll', 'click']`)
- **`options.onIdle`** (`() => void`) - Callback fired when the user becomes idle
- **`options.onActive`** (`() => void`) - Callback fired when the user returns from idle

### Returns

| Property | Type | Description |
|---|---|---|
| `isIdle` | `boolean` | Whether the user is currently idle |
| `reset` | `() => void` | Manually reset the idle timer |

## Examples

### Session expiry warning

```tsx
function SecureApp() {
  const [showWarning, setShowWarning] = useState(false);

  const { isIdle } = useIdleTimeout({
    timeout: 10 * 60 * 1000, // 10 minutes
    onIdle: () => setShowWarning(true),
    onActive: () => setShowWarning(false)
  });

  return (
    <>
      <AppContent />
      {showWarning && (
        <SessionWarningModal
          onExtend={() => setShowWarning(false)}
          onLogout={logout}
        />
      )}
    </>
  );
}
```

### Auto-logout

```tsx
function AuthenticatedApp() {
  useIdleTimeout({
    timeout: 15 * 60 * 1000, // 15 minutes
    onIdle: () => {
      toast.warning('Session expired due to inactivity');
      logout();
    }
  });

  return <Dashboard />;
}
```

### Screen dimming (kiosk mode)

```tsx
function KioskApp() {
  const [dimmed, setDimmed] = useState(false);

  useIdleTimeout({
    timeout: 30 * 1000, // 30 seconds
    onIdle: () => setDimmed(true),
    onActive: () => setDimmed(false)
  });

  return (
    <div style={{ opacity: dimmed ? 0.3 : 1, transition: 'opacity 1s' }}>
      <KioskContent />
    </div>
  );
}
```

### Custom event list

```tsx
// Only consider keyboard activity
const { isIdle } = useIdleTimeout({
  timeout: 60 * 1000,
  events: ['keydown', 'keypress']
});
```

## Features

- ✅ Detects inactivity across mouse, keyboard, touch, and scroll events
- ✅ `onIdle` and `onActive` callbacks for reactive control
- ✅ Manual `reset()` function to restart the timer programmatically
- ✅ Configurable event list
- ✅ Proper cleanup on unmount
- ✅ SSR-safe

## Notes

- The timer starts immediately on mount
- User activity resets the timer back to zero
- `onActive` only fires when the user returns from an idle state, not on every activity event
- All event listeners are attached with `{ passive: true }` for scroll performance

## When to Use

- **Session management** — warn or log out users after inactivity
- **Kiosk/public displays** — reset or dim screen when unattended
- **Auto-save triggers** — save only after the user pauses
- **Analytics** — track active vs idle time
