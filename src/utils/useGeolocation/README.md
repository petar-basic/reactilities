# useGeolocation

Hook for accessing user's geolocation. Provides current position coordinates and handles permission requests automatically.

## Usage

```tsx
import { useGeolocation } from 'reactilities';

function LocationDisplay() {
  const { latitude, longitude, error } = useGeolocation();
  
  if (error) return <div>Error: {error}</div>;
  if (!latitude) return <div>Loading location...</div>;
  
  return (
    <div>
      Lat: {latitude}, Lng: {longitude}
    </div>
  );
}
```

## API

### Parameters

None

### Returns

Object containing:
- **`latitude`** (`number | null`) - Current latitude
- **`longitude`** (`number | null`) - Current longitude  
- **`error`** (`string | null`) - Error message if geolocation fails

## Examples

### Map Integration

```tsx
function MapView() {
  const { latitude, longitude, error } = useGeolocation();
  
  if (error) {
    return <div>Unable to get location: {error}</div>;
  }
  
  if (!latitude || !longitude) {
    return <div>Getting your location...</div>;
  }
  
  return (
    <Map center={[latitude, longitude]} zoom={13}>
      <Marker position={[latitude, longitude]} />
    </Map>
  );
}
```

### Nearby Places

```tsx
function NearbyPlaces() {
  const { latitude, longitude } = useGeolocation();
  const [places, setPlaces] = useState([]);
  
  useEffect(() => {
    if (latitude && longitude) {
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
    if (latitude && longitude) {
      fetchWeather(latitude, longitude)
        .then(setWeather);
    }
  }, [latitude, longitude]);
  
  if (error) return <div>Location access denied</div>;
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

- ✅ Automatic permission handling
- ✅ Error handling
- ✅ TypeScript support
- ✅ SSR-safe
- ✅ Automatic cleanup

## Notes

- Requires user permission
- May not work on HTTP (requires HTTPS in production)
- Position updates only on mount (not continuous tracking)
- Error states include permission denied, unavailable, timeout
