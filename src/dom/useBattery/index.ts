import { useEffect, useState } from "react";

interface BatteryState {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

interface UseBatteryReturn extends BatteryState {
  isSupported: boolean;
}

// Minimal type for the Battery Status API (not yet in standard TS lib)
interface BatteryManager extends BatteryState {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

const DEFAULT_STATE: BatteryState = {
  charging: false,
  chargingTime: 0,
  dischargingTime: Infinity,
  level: 1
};

const BATTERY_EVENTS = ['chargingchange', 'chargingtimechange', 'dischargingtimechange', 'levelchange'];

/**
 * Hook for monitoring device battery status via the Battery Status API
 * Returns charging state, charge level, and estimated charge/discharge times
 * State updates are suppressed if the component unmounts before getBattery resolves
 * Useful in PWAs and mobile-first apps to adapt behavior on low battery
 *
 * @returns Object with battery state and isSupported flag
 *
 * @example
 * function BatteryIndicator() {
 *   const { isSupported, level, charging, dischargingTime } = useBattery();
 *
 *   if (!isSupported) return null;
 *
 *   return (
 *     <div>
 *       <span>{Math.round(level * 100)}%</span>
 *       <span>{charging ? 'Charging' : `${Math.round(dischargingTime / 60)} min remaining`}</span>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Disable heavy features on low battery
 * const { level, charging } = useBattery();
 * const isLowBattery = !charging && level < 0.2;
 *
 * if (isLowBattery) disableAutoPlay();
 */
export function useBattery(): UseBatteryReturn {
  const [isSupported] = useState(() => typeof navigator !== 'undefined' && typeof (navigator as Navigator & { getBattery?: unknown }).getBattery === 'function');
  const [battery, setBattery] = useState<BatteryState>(DEFAULT_STATE);

  useEffect(() => {
    if (!isSupported) return;

    let batteryManager: BatteryManager | null = null;

    const update = () => {
      if (!batteryManager) return;
      setBattery({
        charging: batteryManager.charging,
        chargingTime: batteryManager.chargingTime,
        dischargingTime: batteryManager.dischargingTime,
        level: batteryManager.level
      });
    };

    let cancelled = false;

    (navigator as Navigator & { getBattery: () => Promise<BatteryManager> })
      .getBattery()
      .then((bat) => {
        if (cancelled) return;
        batteryManager = bat;
        update();
        BATTERY_EVENTS.forEach(event => batteryManager?.addEventListener(event, update));
      })
      .catch(() => {
        console.warn('Battery Status API is not available.');
      });

    return () => {
      cancelled = true;
      BATTERY_EVENTS.forEach(event => batteryManager?.removeEventListener(event, update));
    };
  }, [isSupported]);

  return { isSupported, ...battery };
}
