# useNetworkState

Hook for monitoring network connectivity status. Detects when the user goes online or offline and provides current connection state.

## Usage

```tsx
import { useNetworkState } from 'reactilities';

function NetworkIndicator() {
  const isOnline = useNetworkState();
  
  return (
    <div>
      Status: {isOnline ? '🟢 Online' : '🔴 Offline'}
    </div>
  );
}
```

## API

### Parameters

None

### Returns

`boolean` - `true` if online, `false` if offline

## Examples

### Connection Status Banner

```tsx
function App() {
  const isOnline = useNetworkState();
  
  return (
    <div>
      {!isOnline && (
        <div className="offline-banner">
          ⚠️ You are currently offline. Some features may be unavailable.
        </div>
      )}
      <MainContent />
    </div>
  );
}
```

### Conditional Data Fetching

```tsx
function DataLoader() {
  const isOnline = useNetworkState();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    if (isOnline) {
      fetchData().then(setData);
    }
  }, [isOnline]);
  
  if (!isOnline) {
    return <div>Please connect to the internet to load data</div>;
  }
  
  return <div>{data}</div>;
}
```

### Sync Queue

```tsx
function SyncManager() {
  const isOnline = useNetworkState();
  const [pendingChanges, setPendingChanges] = useState([]);
  
  useEffect(() => {
    if (isOnline && pendingChanges.length > 0) {
      syncChanges(pendingChanges)
        .then(() => setPendingChanges([]));
    }
  }, [isOnline, pendingChanges]);
  
  return (
    <div>
      {pendingChanges.length > 0 && (
        <p>{pendingChanges.length} changes pending sync</p>
      )}
    </div>
  );
}
```

## Features

- ✅ Real-time connectivity monitoring
- ✅ Automatic event listener management
- ✅ SSR-safe
- ✅ TypeScript support
- ✅ Lightweight

## Notes

- Uses `navigator.onLine` API
- Listens to `online` and `offline` events
- Initial state is determined on mount
- Automatically cleans up event listeners
