# useBattery

Hook for monitoring device battery status via the Battery Status API. Returns charging state, charge level, and estimated charge/discharge times. Useful in PWAs and mobile-first apps to adapt behavior on low battery.

## Usage

```tsx
import { useBattery } from 'reactilities';

function BatteryIndicator() {
  const { isSupported, level, charging } = useBattery();

  if (!isSupported) return null;

  return (
    <div>
      <span>{Math.round(level * 100)}%</span>
      <span>{charging ? 'Charging' : 'On battery'}</span>
    </div>
  );
}
```

## API

### Returns

| Property | Type | Description |
|---|---|---|
| `isSupported` | `boolean` | Whether the Battery Status API is available |
| `charging` | `boolean` | Whether the battery is currently charging |
| `level` | `number` | Battery level from `0` to `1` (e.g. `0.75` = 75%) |
| `chargingTime` | `number` | Seconds until fully charged (`0` if already full or discharging) |
| `dischargingTime` | `number` | Seconds until empty (`Infinity` if charging) |

## Examples

### Battery status display

```tsx
function BatteryStatus() {
  const { isSupported, level, charging, dischargingTime } = useBattery();

  if (!isSupported) return null;

  const percent = Math.round(level * 100);
  const minutesLeft = isFinite(dischargingTime) ? Math.round(dischargingTime / 60) : null;

  return (
    <div className="battery">
      <div className="battery-bar" style={{ width: `${percent}%` }} />
      <span>
        {percent}%{charging ? ' — Charging' : minutesLeft ? ` — ${minutesLeft} min left` : ''}
      </span>
    </div>
  );
}
```

### Disable heavy features on low battery

```tsx
function VideoBackground() {
  const { level, charging } = useBattery();
  const isLowBattery = !charging && level < 0.2;

  if (isLowBattery) {
    return <StaticBackground />;
  }

  return <AnimatedBackground />;
}
```

### PWA low-battery warning

```tsx
function App() {
  const { isSupported, level, charging } = useBattery();

  const showWarning = isSupported && !charging && level <= 0.1;

  return (
    <>
      {showWarning && (
        <Banner type="warning">
          Battery is low ({Math.round(level * 100)}%). Please plug in your charger.
        </Banner>
      )}
      <AppContent />
    </>
  );
}
```

## Features

- ✅ Live updates on charging state, level, and time changes
- ✅ `isSupported` flag for graceful fallback
- ✅ Proper cleanup of event listeners
- ✅ SSR-safe

## Notes

- The Battery Status API is not supported in all browsers (notably absent in Firefox for privacy reasons). Always check `isSupported` before rendering battery-dependent UI.
- `chargingTime` and `dischargingTime` may be `Infinity` when the values are not yet known
- Level `1.0` means fully charged
