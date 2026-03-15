import { useEffect, useRef } from 'react';

/**
 * Hook for running a callback on a fixed interval with automatic cleanup
 * Safely handles callback updates without resetting the interval timer
 * Pass null as delay to pause the interval
 *
 * @param callback - Function to call on each interval tick
 * @param delay - Interval duration in milliseconds, or null to pause
 *
 * @example
 * // Basic polling
 * function LiveScore() {
 *   const [score, setScore] = useState(null);
 *
 *   useInterval(async () => {
 *     const data = await fetchScore();
 *     setScore(data);
 *   }, 5000);
 *
 *   return <div>{score}</div>;
 * }
 *
 * @example
 * // Pausable interval
 * function Timer() {
 *   const [count, setCount] = useState(0);
 *   const [running, setRunning] = useState(true);
 *
 *   useInterval(() => setCount(c => c + 1), running ? 1000 : null);
 *
 *   return (
 *     <div>
 *       <p>{count}s</p>
 *       <button onClick={() => setRunning(r => !r)}>
 *         {running ? 'Pause' : 'Resume'}
 *       </button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Slideshow
 * function Slideshow({ images }: { images: string[] }) {
 *   const [index, setIndex] = useState(0);
 *   useInterval(() => setIndex(i => (i + 1) % images.length), 3000);
 *   return <img src={images[index]} />;
 * }
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => callbackRef.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
