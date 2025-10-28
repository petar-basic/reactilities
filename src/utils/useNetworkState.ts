import { useRef, useSyncExternalStore } from "react";

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

interface NetworkInformation extends EventTarget {
  readonly downlink: number;
  readonly downlinkMax: number;
  readonly effectiveType: "slow-2g" | "2g" | "3g" | "4g";
  readonly rtt: number;
  readonly saveData: boolean;
  readonly type:
    | "bluetooth"
    | "cellular"
    | "ethernet"
    | "none"
    | "wifi"
    | "wimax"
    | "other"
    | "unknown";
}

const isShallowEqual = (object1: any, object2: any) => {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
};

const getConnection = (): NetworkInformation | undefined => {
  return (
    navigator?.connection ||
    navigator?.mozConnection ||
    navigator?.webkitConnection
  );
};

const subscribe = (callback: () => void) => {
  window.addEventListener("online", callback, { passive: true });
  window.addEventListener("offline", callback, { passive: true });

  const connection = getConnection();

  if (connection) {
    connection.addEventListener("change", callback, { passive: true });
  }

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);

    if (connection) {
      connection.removeEventListener("change", callback);
    }
  };
};

const getServerSnapshot = () => {
  throw Error("useNetworkState is a client-only hook");
};

/**
 * Hook for monitoring network connection state and quality
 * Provides online/offline status and detailed connection information
 * Uses Network Information API when available for connection quality metrics
 * 
 * @returns Object containing network state information
 * 
 * @example
 * function NetworkStatus() {
 *   const network = useNetworkState();
 * 
 *   return (
 *     <div>
 *       <p>Status: {network.online ? 'Online' : 'Offline'}</p>
 *       <p>Connection: {network.effectiveType}</p>
 *       <p>Downlink: {network.downlink} Mbps</p>
 *       <p>RTT: {network.rtt}ms</p>
 *       {network.saveData && <p>Data Saver: Enabled</p>}
 *     </div>
 *   );
 * }
 * 
 * // Conditional content based on connection
 * function App() {
 *   const { online, effectiveType } = useNetworkState();
 *   
 *   if (!online) return <OfflineMessage />;
 *   
 *   return (
 *     <div>
 *       {effectiveType === 'slow-2g' ? <LowBandwidthUI /> : <FullUI />}
 *     </div>
 *   );
 * }
 */
export function useNetworkState() {
  const cache = useRef({});

  const getSnapshot = () => {
    const online = navigator.onLine;
    const connection = getConnection();

    const nextState = {
      online,
      downlink: connection?.downlink,
      downlinkMax: connection?.downlinkMax,
      effectiveType: connection?.effectiveType,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
      type: connection?.type,
    };

    if (isShallowEqual(cache.current, nextState)) {
      return cache.current;
    } else {
      cache.current = nextState;
      return nextState;
    }
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
