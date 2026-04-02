# useEventSource

Hook for managing Server-Sent Events (SSE) connections. SSE is a lightweight alternative to WebSocket for one-way real-time data streams from server to client. Handles connection state, automatic cleanup, and exposes the last received message.

## Usage

```tsx
import { useEventSource } from 'reactilities';

function LiveFeed() {
  const { lastMessage, readyState } = useEventSource('/api/events');

  return (
    <div>
      <span>{readyState === 1 ? 'Connected' : 'Disconnected'}</span>
      <p>{lastMessage?.data}</p>
    </div>
  );
}
```

## API

### Parameters

- **`url`** (`string | null`) - SSE endpoint URL. Pass `null` to skip connecting.
- **`options.withCredentials`** (`boolean`) - Send cookies/auth headers with the SSE request (default: `false`)
- **`options.onOpen`** (`(event: Event) => void`) - Callback when connection opens
- **`options.onError`** (`(event: Event) => void`) - Callback when an error occurs

### Returns

| Property | Type | Description |
|---|---|---|
| `lastMessage` | `MessageEvent \| null` | The most recently received message event |
| `readyState` | `0 \| 1 \| 2` | Connection state: `0` = CONNECTING, `1` = OPEN, `2` = CLOSED |
| `close` | `() => void` | Manually close the connection |

## Examples

### Live notification feed

```tsx
function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { lastMessage } = useEventSource('/api/notifications/stream');

  useEffect(() => {
    if (!lastMessage) return;
    const notification = JSON.parse(lastMessage.data) as Notification;
    setNotifications(prev => [notification, ...prev]);
  }, [lastMessage]);

  return (
    <div>
      <BellIcon count={notifications.length} />
      <NotificationList items={notifications} />
    </div>
  );
}
```

### Live dashboard metrics

```tsx
function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const { lastMessage, readyState } = useEventSource('/api/metrics/stream');

  useEffect(() => {
    if (lastMessage) {
      setMetrics(JSON.parse(lastMessage.data));
    }
  }, [lastMessage]);

  return (
    <div>
      <ConnectionStatus state={readyState} />
      {metrics && <MetricsGrid data={metrics} />}
    </div>
  );
}
```

### Conditional connection

```tsx
function LiveLog({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  // Only connect when the user is an admin
  const { lastMessage } = useEventSource(
    isAdmin ? `/api/logs/stream?userId=${userId}` : null
  );

  return <LogViewer entry={lastMessage?.data ?? ''} />;
}
```

### Close on demand

```tsx
function StreamingResponse() {
  const { lastMessage, close, readyState } = useEventSource('/api/stream');

  return (
    <div>
      <pre>{lastMessage?.data}</pre>
      <button onClick={close} disabled={readyState === 2}>Stop streaming</button>
    </div>
  );
}
```

## Connection States

| Value | Constant | Description |
|---|---|---|
| `0` | CONNECTING | Connection is being established |
| `1` | OPEN | Connection is open and receiving events |
| `2` | CLOSED | Connection is closed |

## Features

- ✅ Manages connection lifecycle automatically
- ✅ `null` URL skips connecting — safe for conditional streams
- ✅ Manual `close()` function
- ✅ `withCredentials` support for authenticated streams
- ✅ `onOpen` and `onError` callbacks stored in refs — safe to use inline
- ✅ Connection closed and cleaned up on unmount

## Notes

- SSE connections are one-way (server → client). Use `useWebSocket` for bidirectional communication.
- The browser automatically reconnects SSE connections on network errors. Call `close()` explicitly to prevent reconnection.
- The `lastMessage` only holds the most recent message. Accumulate messages in your own state if needed.

## When to Use

- **Live feeds** — news, social, notifications
- **Dashboard metrics** — real-time charts and counters
- **Progress tracking** — long-running job status updates
- **Log streaming** — tail server logs in a UI
