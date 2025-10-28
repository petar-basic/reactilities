import { useEffect, useRef, useState } from "react";

interface GeolocationState {
  loading: boolean;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  timestamp: number | null;
  error: GeolocationPositionError | null;
}

/**
 * Hook for accessing device geolocation with continuous position tracking
 * Provides current position, accuracy, and error handling
 * Uses both getCurrentPosition and watchPosition for real-time updates
 * 
 * @param options - Geolocation API options (enableHighAccuracy, timeout, maximumAge)
 * @returns GeolocationState object with position data and loading/error states
 * 
 * @example
 * function LocationTracker() {
 *   const { latitude, longitude, accuracy, loading, error } = useGeolocation({
 *     enableHighAccuracy: true,
 *     timeout: 10000,
 *     maximumAge: 60000
 *   });
 * 
 *   if (loading) return <div>Getting location...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 * 
 *   return (
 *     <div>
 *       <p>Latitude: {latitude}</p>
 *       <p>Longitude: {longitude}</p>
 *       <p>Accuracy: {accuracy}m</p>
 *     </div>
 *   );
 * }
 * 
 * // Basic usage
 * const location = useGeolocation();
 * const isLocationAvailable = location.latitude && location.longitude;
 */
export default function useGeolocation(options: PositionOptions = {}): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    accuracy: null,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: null,
    longitude: null,
    speed: null,
    timestamp: null,
    error: null
  });

  const optionsRef = useRef(options);

  useEffect(() => {
    const onEvent = ({ coords, timestamp }: GeolocationPosition) => {
      setState({
        loading: false,
        timestamp,
        latitude: coords.latitude,
        longitude: coords.longitude,
        altitude: coords.altitude,
        accuracy: coords.accuracy,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
        error: null
      });
    };

    const onEventError = (error: GeolocationPositionError) => {
      setState((s) => ({
        ...s,
        loading: false,
        error
      }));
    };

    navigator.geolocation.getCurrentPosition(
      onEvent,
      onEventError,
      optionsRef.current
    );

    const watchId = navigator.geolocation.watchPosition(
      onEvent,
      onEventError,
      optionsRef.current
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}