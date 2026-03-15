# usePermission

Hook for querying browser permission status via the [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API). Automatically updates when the permission state changes.

## Usage

```tsx
import { usePermission } from 'reactilities';

function CameraAccess() {
  const { state, loading } = usePermission('camera');

  if (loading) return <p>Checking camera permission...</p>;
  if (state === 'granted') return <Camera />;
  if (state === 'denied') return <p>Camera access was denied.</p>;
  if (state === 'unsupported') return <p>Permissions API not supported.</p>;
  return <button onClick={requestCamera}>Allow Camera Access</button>;
}
```

## API

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `permissionName` | `PermissionName` | The permission to query (e.g. `'camera'`, `'microphone'`, `'notifications'`) |

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `state` | `'granted' \| 'denied' \| 'prompt' \| 'unsupported'` | Current permission state |
| `loading` | `boolean` | True while the initial query is pending |

## Examples

### Notifications

```tsx
function NotificationSettings() {
  const { state, loading } = usePermission('notifications');

  return (
    <div>
      <h3>Notifications</h3>
      {loading && <span>Loading...</span>}
      {state === 'granted' && <span>✅ Enabled</span>}
      {state === 'denied' && <span>❌ Blocked in browser settings</span>}
      {state === 'prompt' && (
        <button onClick={() => Notification.requestPermission()}>
          Enable notifications
        </button>
      )}
    </div>
  );
}
```

### Geolocation Gate

```tsx
function LocationFeature() {
  const { state } = usePermission('geolocation');

  if (state !== 'granted') {
    return <p>Please allow location access to use this feature.</p>;
  }

  return <Map />;
}
```

## Common Permission Names

| Name | Description |
|------|-------------|
| `'camera'` | Camera access |
| `'microphone'` | Microphone access |
| `'notifications'` | Push notifications |
| `'geolocation'` | Location access |
| `'clipboard-read'` | Reading from clipboard |
| `'clipboard-write'` | Writing to clipboard |

## Notes

- Returns `'unsupported'` if `navigator.permissions` is unavailable or the query throws
- Listens to `permissionstatus` `change` events and updates state reactively
- Requesting a permission (e.g. `getUserMedia`) is separate from querying its status — this hook only reads, not requests
