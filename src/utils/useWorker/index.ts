import { useCallback, useEffect, useRef, useState } from "react";

type WorkerStatus = 'idle' | 'running' | 'success' | 'error';

interface UseWorkerReturn<T> {
  result: T | null;
  error: Error | null;
  status: WorkerStatus;
  run: (...args: unknown[]) => void;
  terminate: () => void;
}

function createWorkerFromFn(fn: (...args: unknown[]) => unknown): Worker {
  const script = `
    self.onmessage = function(e) {
      var fn = ${fn.toString()};
      try {
        var result = fn.apply(null, e.data);
        Promise.resolve(result).then(function(res) {
          self.postMessage({ result: res });
        }).catch(function(err) {
          self.postMessage({ error: err.message });
        });
      } catch (err) {
        self.postMessage({ error: err.message });
      }
    };
  `;
  const blob = new Blob([script], { type: 'application/javascript' });
  const objectUrl = URL.createObjectURL(blob);
  const worker = new Worker(objectUrl);
  URL.revokeObjectURL(objectUrl);
  return worker;
}

/**
 * Hook for running heavy computations in a Web Worker to avoid blocking the UI thread
 * The provided function is serialized via fn.toString() and executed in a separate worker context
 *
 * IMPORTANT: fn must be completely self-contained. Any closure variable (outer scope reference)
 * will be undefined inside the worker and cause a runtime error that surfaces as status='error'.
 * Pass data as arguments via run() instead of capturing it in the function body.
 *
 * @param fn - A self-contained function to run in the worker (no closure references)
 * @returns Object with result, error, status, and control functions
 *
 * @example
 * function HeavyComputation() {
 *   const { result, status, run } = useWorker((numbers: number[]) => {
 *     return numbers.reduce((sum, n) => sum + n, 0);
 *   });
 *
 *   return (
 *     <>
 *       <button onClick={() => run(largeArray)}>
 *         {status === 'running' ? 'Computing...' : 'Compute Sum'}
 *       </button>
 *       {result !== null && <span>Result: {result}</span>}
 *     </>
 *   );
 * }
 *
 * @example
 * // Sort a massive array without freezing the UI
 * const { result, run, status } = useWorker((data: number[]) => {
 *   return data.slice().sort((a, b) => a - b);
 * });
 *
 * useEffect(() => { run(millionNumbers); }, []);
 */
export function useWorker<T>(fn: (...args: unknown[]) => T): UseWorkerReturn<T> {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<WorkerStatus>('idle');
  const workerRef = useRef<Worker | null>(null);
  const fnRef = useRef(fn);

  fnRef.current = fn;

  const terminate = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setStatus('idle');
  }, []);

  const run = useCallback((...args: unknown[]) => {
    // Terminate any existing worker before starting a new one
    workerRef.current?.terminate();

    const worker = createWorkerFromFn(fnRef.current);
    workerRef.current = worker;
    setStatus('running');
    setError(null);

    worker.onmessage = (event: MessageEvent<{ result?: T; error?: string }>) => {
      if (event.data.error) {
        setError(new Error(event.data.error));
        setStatus('error');
      } else {
        setResult(event.data.result ?? null);
        setStatus('success');
      }
      worker.terminate();
      workerRef.current = null;
    };

    worker.onerror = (event) => {
      setError(new Error(event.message));
      setStatus('error');
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage(args);
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return { result, error, status, run, terminate };
}
