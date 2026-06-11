# useGeolocation

Hook for accessing device geolocation with continuous position tracking. Uses `watchPosition` for real-time updates and exposes position data, accuracy, loading, and error state.

## Usage

```tsx
import { useGeolocation } from 'reactilities';

function LocationDisplay() {
  const { latitude, longitude, loading, error } = useGeolocation();

  if (loading) return <div>Getting location...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      Lat: {latitude}, Lng: {longitude}
    </div>
  );
}
```

## API

### Signature

```ts
function useGeolocation(options?: PositionOptions): GeolocationState
```

### Parameters

- **`options`** (`PositionOptions`, optional) - Standard Geolocation API options. Changing any of these re-registers the position watch.
  - **`enableHighAccuracy`** (`boolean`) - Request the most accurate position available.
  - **`timeout`** (`number`) - Maximum time in milliseconds to wait for a position.
  - **`maximumAge`** (`number`) - Maximum age in milliseconds of a cached position to accept.

### Returns

`GeolocationState` object:

| Property | Type | Description |
|---|---|---|
| `loading` | `boolean` | `true` until the first position fix (or error) arrives |
| `latitude` | `number \| null` | Current latitude |
| `longitude` | `number \| null` | Current longitude |
| `accuracy` | `number \| null` | Accuracy of the lat/lng in meters |
| `altitude` | `number \| null` | Altitude in meters above the WGS84 ellipsoid |
| `altitudeAccuracy` | `number \| null` | Accuracy of the altitude in meters |
| `heading` | `number \| null` | Direction of travel in degrees (0 = north) |
| `speed` | `number \| null` | Ground speed in meters per second |
| `timestamp` | `number \| null` | Time the position was acquired (ms since epoch) |
| `error` | `GeolocationPositionError \| null` | Error object if geolocation fails |

> `error` is a `GeolocationPositionError` (with `.code` and `.message`), not a plain string. Read `error.message` for a human-readable description.

## Examples

### Map Integration

```tsx
function MapView() {
  const { latitude, longitude, loading, error } = useGeolocation();

  if (error) {
    return <div>Unable to get location: {error.message}</div>;
  }

  if (loading || latitude === null || longitude === null) {
    return <div>Getting your location...</div>;
  }

  return (
    <Map center={[latitude, longitude]} zoom={13}>
      <Marker position={[latitude, longitude]} />
    </Map>
  );
}
```

### High-accuracy tracking

```tsx
function LiveTracker() {
  const { latitude, longitude, accuracy, speed, heading } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });

  return (
    <div>
      <p>Position: {latitude}, {longitude}</p>
      <p>Accuracy: {accuracy}m</p>
      <p>Speed: {speed ?? 0} m/s</p>
      <p>Heading: {heading ?? 'unknown'}</p>
    </div>
  );
}
```

### Nearby Places

```tsx
function NearbyPlaces() {
  const { latitude, longitude } = useGeolocation();
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      fetchNearbyPlaces(latitude, longitude)
        .then(setPlaces);
    }
  }, [latitude, longitude]);

  return (
    <ul>
      {places.map(place => (
        <li key={place.id}>{place.name}</li>
      ))}
    </ul>
  );
}
```

### Weather App

```tsx
function WeatherWidget() {
  const { latitude, longitude, error } = useGeolocation();
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      fetchWeather(latitude, longitude)
        .then(setWeather);
    }
  }, [latitude, longitude]);

  if (error) return <div>Location access denied: {error.message}</div>;
  if (!weather) return <div>Loading weather...</div>;

  return (
    <div>
      <h3>Weather at your location</h3>
      <p>Temperature: {weather.temp}°C</p>
      <p>Conditions: {weather.description}</p>
    </div>
  );
}
```

## Features

- ✅ Continuous position tracking via `watchPosition`
- ✅ Full position data: coordinates, accuracy, altitude, heading, speed, timestamp
- ✅ `loading` and `error` state tracking
- ✅ Re-registers the watch when options change
- ✅ Falls back to a `POSITION_UNAVAILABLE` error when the API is unavailable (SSR-safe — never throws)
- ✅ Automatic cleanup (clears the watch on unmount)
- ✅ TypeScript support

## Notes

- Requires user permission; the browser prompts on first use.
- Continuous tracking: the position updates on every fix, not just once on mount.
- Requires a secure context (HTTPS) in production.
- When `navigator.geolocation` is unavailable (e.g. during SSR or in unsupported browsers), the hook resolves to `loading: false` with a `GeolocationPositionError` (`code: 2`, POSITION_UNAVAILABLE) instead of throwing.
- Error codes follow the spec: `1` = PERMISSION_DENIED, `2` = POSITION_UNAVAILABLE, `3` = TIMEOUT.
