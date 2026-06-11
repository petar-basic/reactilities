import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCountdownOptions {
  /** Starting count value */
  countStart: number;
  /** Interval between ticks in milliseconds (default: 1000) */
  intervalMs?: number;
  /**
   * Value at which the timer automatically stops.
   * Defaults to `0` in countdown mode and `Infinity` in count-up mode
   * (so an unbounded stopwatch counts up forever until stopped manually).
   */
  countStop?: number;
  /** Count up instead of down (default: false) */
  isIncrement?: boolean;
}

export interface UseCountdownReturn {
  /** Current count value */
  count: number;
  /** Whether the countdown is currently running */
  isRunning: boolean;
  /** Start the countdown */
  start: () => void;
  /** Stop (pause) the countdown */
  stop: () => void;
  /** Reset the count to countStart and stop */
  reset: () => void;
}

/**
 * Hook for creating a countdown (or count-up) timer with start, stop, and reset controls
 *
 * @param options - Configuration for the countdown behavior
 * @returns Object with current count and control functions
 *
 * @example
 * // OTP resend timer
 * function OTPForm() {
 *   const { count, isRunning, start, reset } = useCountdown({
 *     countStart: 60,
 *     countStop: 0,
 *   });
 *
 *   const handleResend = () => {
 *     sendOTP();
 *     reset();
 *     start();
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleResend} disabled={isRunning}>
 *         {isRunning ? `Resend in ${count}s` : 'Resend OTP'}
 *       </button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Auction countdown
 * function AuctionTimer({ endsAt }: { endsAt: number }) {
 *   const secondsLeft = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));
 *   const { count, start } = useCountdown({ countStart: secondsLeft });
 *
 *   useEffect(() => { start(); }, []);
 *
 *   const hours = Math.floor(count / 3600);
 *   const minutes = Math.floor((count % 3600) / 60);
 *   const seconds = count % 60;
 *
 *   return <span>{hours}:{minutes}:{seconds}</span>;
 * }
 *
 * @example
 * // Count-up stopwatch (unbounded — countStop defaults to Infinity when isIncrement)
 * function Stopwatch() {
 *   const { count, isRunning, start, stop, reset } = useCountdown({
 *     countStart: 0,
 *     isIncrement: true,
 *   });
 *
 *   return (
 *     <div>
 *       <p>{count}s</p>
 *       <button onClick={isRunning ? stop : start}>{isRunning ? 'Stop' : 'Start'}</button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 */
export function useCountdown({
  countStart,
  intervalMs = 1000,
  countStop,
  isIncrement = false,
}: UseCountdownOptions): UseCountdownReturn {
  // When the caller omits countStop, default to 0 for countdown mode and
  // Infinity for count-up mode so an unbounded stopwatch keeps running.
  // `0` passed explicitly is preserved (distinct from omission/undefined).
  const resolvedCountStop = countStop ?? (isIncrement ? Infinity : 0);
  const [count, setCount] = useState(countStart);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current !== undefined) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current !== undefined) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setCount(prev => {
        const next = isIncrement ? prev + 1 : prev - 1;
        const isDone = isIncrement ? next >= resolvedCountStop : next <= resolvedCountStop;
        if (isDone) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
          setIsRunning(false);
          return resolvedCountStop;
        }
        return next;
      });
    }, intervalMs);
  }, [intervalMs, resolvedCountStop, isIncrement]);

  const reset = useCallback(() => {
    stop();
    setCount(countStart);
  }, [stop, countStart]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== undefined) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { count, isRunning, start, stop, reset };
}
