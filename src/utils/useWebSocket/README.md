# useWebSocket

Hook for managing WebSocket connections. Handles connection lifecycle, message sending/receiving, and automatic reconnection.

## Usage

```tsx
import { useWebSocket } from 'reactilities';

function Chat() {
  const { sendMessage, lastMessage, readyState } = useWebSocket('ws://localhost:8080');
  
  const handleSend = () => {
    sendMessage('Hello, server!');
  };
  
  return (
    <div>
      <p>Status: {readyState === 1 ? 'Connected' : 'Disconnected'}</p>
      <p>Last message: {lastMessage?.data}</p>
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

## API

### Signature

```ts
function useWebSocket(
  socketUrl: string | null,
  options?: UseWebSocketOptions
): UseWebSocketReturn
```

### Parameters

- **`socketUrl`** (`string | null`) - WebSocket server URL. Pass `null` to defer connecting (or to disconnect an existing socket).
- **`options`** (`UseWebSocketOptions`, optional) - Connection configuration:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `protocols` | `string \| string[]` | — | Sub-protocol(s) passed to the `WebSocket` constructor. Applied on the next (re)connect; you may pass an inline array without causing reconnects |
| `reconnectAttempts` | `number` | `3` | Maximum number of reconnection attempts after a disconnect |
| `reconnectInterval` | `number` | `3000` | Delay in milliseconds between reconnection attempts |
| `shouldReconnect` | `(closeEvent: CloseEvent) => boolean` | `() => true` | Decides whether to reconnect for a given close event |
| `onOpen` | `(event: Event) => void` | — | Called when the connection opens |
| `onClose` | `(event: CloseEvent) => void` | — | Called when the connection closes |
| `onError` | `(event: Event) => void` | — | Called on connection error |
| `onMessage` | `(event: MessageEvent) => void` | — | Called for every received message |

> Callback options are stored in refs, so passing them inline (e.g. `onMessage={() => ...}`) does not recreate the connection.

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `sendMessage` | `(message: string \| ArrayBuffer \| Blob) => void` | Send a raw message. Warns and no-ops if the socket is not `OPEN` |
| `sendJsonMessage` | `(message: unknown) => void` | `JSON.stringify` the value and send it |
| `lastMessage` | `MessageEvent \| null` | The most recently received raw message event |
| `lastJsonMessage` | `unknown` | `lastMessage.data` parsed as JSON, or `null` when there is no message or the payload is not valid JSON |
| `readyState` | `0 \| 1 \| 2 \| 3` | Connection state: `0` = CONNECTING, `1` = OPEN, `2` = CLOSING, `3` = CLOSED |
| `getWebSocket` | `() => WebSocket \| null` | Access the underlying `WebSocket` instance (or `null` if not connected) |

## Examples

### Real-time Chat

```tsx
function ChatRoom() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { sendMessage, lastMessage, readyState } = useWebSocket('ws://chat.example.com');
  
  useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev, JSON.parse(lastMessage.data)]);
    }
  }, [lastMessage]);
  
  const handleSend = () => {
    sendMessage(JSON.stringify({ text: input, user: 'me' }));
    setInput('');
  };
  
  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i}>{msg.user}: {msg.text}</div>
        ))}
      </div>
      <input 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={readyState !== 1}
      />
      <button onClick={handleSend} disabled={readyState !== 1}>
        Send
      </button>
    </div>
  );
}
```

### JSON messaging with reconnection

```tsx
function LiveChat() {
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    'ws://chat.example.com',
    {
      reconnectAttempts: 5,
      reconnectInterval: 2000,
      onOpen: () => console.log('Connected'),
    }
  );

  const message = lastJsonMessage as { user: string; text: string } | null;

  return (
    <div>
      <p>Status: {readyState === 1 ? 'Connected' : 'Reconnecting...'}</p>
      {message && <p>{message.user}: {message.text}</p>}
      <button
        onClick={() => sendJsonMessage({ type: 'chat', text: 'Hello!' })}
        disabled={readyState !== 1}
      >
        Send
      </button>
    </div>
  );
}
```

### Live Data Feed

```tsx
function StockTicker() {
  const [prices, setPrices] = useState({});
  const { lastMessage } = useWebSocket('ws://stocks.example.com');
  
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      setPrices(prev => ({ ...prev, [data.symbol]: data.price }));
    }
  }, [lastMessage]);
  
  return (
    <div>
      {Object.entries(prices).map(([symbol, price]) => (
        <div key={symbol}>
          {symbol}: ${price}
        </div>
      ))}
    </div>
  );
}
```

### Notifications

```tsx
function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const { lastMessage, readyState } = useWebSocket('ws://notifications.example.com');
  
  useEffect(() => {
    if (lastMessage) {
      const notification = JSON.parse(lastMessage.data);
      setNotifications(prev => [notification, ...prev]);
    }
  }, [lastMessage]);
  
  return (
    <div>
      <div className={`status ${readyState === 1 ? 'online' : 'offline'}`}>
        {readyState === 1 ? '🟢 Live' : '🔴 Disconnected'}
      </div>
      {notifications.map(notif => (
        <div key={notif.id} className="notification">
          {notif.message}
        </div>
      ))}
    </div>
  );
}
```

## Features

- ✅ Automatic connection management
- ✅ Configurable automatic reconnection (`reconnectAttempts`, `reconnectInterval`, `shouldReconnect`)
- ✅ Lifecycle callbacks: `onOpen`, `onClose`, `onError`, `onMessage` (safe to pass inline)
- ✅ JSON helpers: `sendJsonMessage` and parsed `lastJsonMessage`
- ✅ Raw `sendMessage` accepting `string | ArrayBuffer | Blob`
- ✅ `getWebSocket()` escape hatch for the underlying instance
- ✅ Connection state tracking
- ✅ Automatic cleanup on unmount (no zombie reconnects)
- ✅ TypeScript support

## Connection States

- `0` - CONNECTING
- `1` - OPEN (connected)
- `2` - CLOSING
- `3` - CLOSED

## Notes

- WebSocket connection is established on mount
- Connection is closed on unmount (the socket is closed intentionally and will not auto-reconnect)
- Automatic reconnection only happens on genuine disconnects/errors, never after unmount or a `url` change
- Messages can be sent only when `readyState === 1`
- `lastMessage` contains the raw MessageEvent
- Use `JSON.parse(lastMessage.data)` for JSON messages
- `protocols` is read on each (re)connect; changing it does not by itself force a reconnect, and you may pass an inline array (e.g. `{ protocols: ['graphql-ws'] }`) without causing reconnect-on-every-render
