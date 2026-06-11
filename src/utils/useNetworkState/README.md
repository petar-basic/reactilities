# useNetworkState

Hook for monitoring network connection state and quality. Returns an object with online/offline status plus connection-quality metrics from the Network Information API when available.

## Usage

```tsx
import { useNetworkState } from 'reactilities';

function NetworkIndicator() {
  const { online } = useNetworkState();

  return (
    <div>
      Status: {online ? '🟢 Online' : '🔴 Offline'}
    </div>
  );
}
```

## API

### Signature

```ts
function useNetworkState(defaultState?: Partial<NetworkState>): NetworkState
```

### Parameters

- **`defaultState`** (`Partial<NetworkState>`, optional) - Overrides for the server/initial snapshot. Used during SSR and the first (hydration) client render before real `navigator` values are available. Merged over the built-in default (`online: true`, all connection fields `undefined`).

### Returns

`NetworkState` - An object with the following fields:

| Property | Type | Description |
| --- | --- | --- |
| `online` | `boolean` | `true` if the browser reports an online connection (`navigator.onLine`). |
| `downlink` | `number \| undefined` | Estimated effective bandwidth in Mbps. |
| `downlinkMax` | `number \| undefined` | Maximum downlink speed in Mbps for the underlying connection technology. |
| `effectiveType` | `'slow-2g' \| '2g' \| '3g' \| '4g' \| undefined` | Effective connection type. |
| `rtt` | `number \| undefined` | Estimated round-trip time in milliseconds. |
| `saveData` | `boolean \| undefined` | Whether the user has requested reduced data usage. |
| `type` | `'bluetooth' \| 'cellular' \| 'ethernet' \| 'none' \| 'wifi' \| 'wimax' \| 'other' \| 'unknown' \| undefined` | Underlying connection technology. |

> Connection-quality fields (everything except `online`) come from the Network Information API and are `undefined` in browsers that do not support it.

## Examples

### Connection Status Banner

```tsx
function App() {
  const { online } = useNetworkState();

  return (
    <div>
      {!online && (
        <div className="offline-banner">
          ⚠️ You are currently offline. Some features may be unavailable.
        </div>
      )}
      <MainContent />
    </div>
  );
}
```

### Connection Quality Details

```tsx
function NetworkStatus() {
  const network = useNetworkState();

  return (
    <div>
      <p>Status: {network.online ? 'Online' : 'Offline'}</p>
      <p>Connection: {network.effectiveType ?? 'unknown'}</p>
      <p>Downlink: {network.downlink ?? '?'} Mbps</p>
      <p>RTT: {network.rtt ?? '?'}ms</p>
      {network.saveData && <p>Data Saver: Enabled</p>}
    </div>
  );
}
```

### Conditional Data Fetching

```tsx
function DataLoader() {
  const { online } = useNetworkState();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (online) {
      fetchData().then(setData);
    }
  }, [online]);

  if (!online) {
    return <div>Please connect to the internet to load data</div>;
  }

  return <div>{data}</div>;
}
```

### Adapting to Connection Quality

```tsx
function MediaView() {
  const { online, effectiveType, saveData } = useNetworkState();

  if (!online) return <OfflineMessage />;

  const useLowBandwidth = saveData || effectiveType === 'slow-2g' || effectiveType === '2g';

  return useLowBandwidth ? <LowBandwidthUI /> : <FullUI />;
}
```

### Sync Queue

```tsx
function SyncManager() {
  const { online } = useNetworkState();
  const [pendingChanges, setPendingChanges] = useState([]);

  useEffect(() => {
    if (online && pendingChanges.length > 0) {
      syncChanges(pendingChanges)
        .then(() => setPendingChanges([]));
    }
  }, [online, pendingChanges]);

  return (
    <div>
      {pendingChanges.length > 0 && (
        <p>{pendingChanges.length} changes pending sync</p>
      )}
    </div>
  );
}
```

### Custom Server Default

```tsx
// Assume offline on the server so the offline UI is rendered until hydration.
function App() {
  const { online } = useNetworkState({ online: false });
  // ...
}
```

## Features

- ✅ Real-time connectivity monitoring
- ✅ Connection-quality metrics via the Network Information API
- ✅ Automatic event listener management
- ✅ SSR-safe (returns a stable default snapshot during server render and hydration; no throw, no hydration mismatch)
- ✅ Optional `defaultState` override
- ✅ TypeScript support

## Notes

- Built on `useSyncExternalStore` for tear-free reads.
- Uses `navigator.onLine` for `online` and the Network Information API (`navigator.connection` and vendor-prefixed variants) for the quality fields.
- Listens to window `online`/`offline` events and the connection `change` event.
- During SSR and the first client render, the returned snapshot is `DEFAULT_SERVER_STATE` (`online: true` with connection fields `undefined`), optionally merged with `defaultState`. Real `navigator` values are read after mount.
- Automatically cleans up all event listeners on unmount.
