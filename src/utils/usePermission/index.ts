import { useEffect, useState } from 'react';

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

interface UsePermissionReturn {
  state: PermissionState;
  loading: boolean;
}

/**
 * Hook for querying browser permission status via the Permissions API
 *
 * @param permissionName - The name of the permission to query
 * @returns Object with current permission state and loading flag
 *
 * @example
 * const { state, loading } = usePermission('camera');
 *
 * if (loading) return <p>Checking permissions...</p>;
 * if (state === 'granted') return <Camera />;
 * if (state === 'denied') return <p>Camera access denied</p>;
 * return <button onClick={requestCamera}>Allow Camera</button>;
 */
export function usePermission(
  permissionName: PermissionName
): UsePermissionReturn {
  const [state, setState] = useState<PermissionState>('prompt');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator?.permissions?.query) {
      setState('unsupported');
      setLoading(false);
      return;
    }

    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    setLoading(true);
    setState('prompt');

    const handleChange = () => {
      if (permissionStatus) {
        setState(permissionStatus.state);
      }
    };

    navigator.permissions
      .query({ name: permissionName })
      .then((status) => {
        permissionStatus = status;
        if (cancelled) {
          status.removeEventListener('change', handleChange);
          return;
        }
        setState(status.state);
        setLoading(false);
        status.addEventListener('change', handleChange);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setState('unsupported');
        setLoading(false);
      });

    return () => {
      cancelled = true;
      permissionStatus?.removeEventListener('change', handleChange);
    };
  }, [permissionName]);

  return { state, loading };
}
