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

### Parameters

- **`url`** (`string`) - WebSocket server URL

### Returns

Object containing:
- **`sendMessage`** (`(message: string) => void`) - Function to send messages
- **`lastMessage`** (`MessageEvent | null`) - Last received message
- **`readyState`** (`number`) - Connection state (0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)

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
- ✅ Message sending/receiving
- ✅ Connection state tracking
- ✅ Automatic cleanup on unmount
- ✅ TypeScript support
- ✅ JSON message support

## Connection States

- `0` - CONNECTING
- `1` - OPEN (connected)
- `2` - CLOSING
- `3` - CLOSED

## Notes

- WebSocket connection is established on mount
- Connection is closed on unmount
- Messages can be sent only when `readyState === 1`
- `lastMessage` contains the raw MessageEvent
- Use `JSON.parse(lastMessage.data)` for JSON messages
