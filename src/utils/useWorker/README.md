# useWorker

Hook for running heavy computations in a Web Worker to avoid blocking the UI thread. The provided function is serialized and executed in an isolated worker context, keeping your app responsive during CPU-intensive operations.

## Usage

```tsx
import { useWorker } from 'reactilities';

function HeavyComputation() {
  const { result, status, run } = useWorker((numbers: number[]) => {
    return numbers.reduce((sum, n) => sum + n, 0);
  });

  return (
    <>
      <button onClick={() => run(largeArray)}>
        {status === 'running' ? 'Computing...' : 'Compute'}
      </button>
      {result !== null && <span>Result: {result}</span>}
    </>
  );
}
```

## API

### Parameters

- **`fn`** (`(...args: unknown[]) => T`) - A **self-contained** function to run in the worker. Must not reference variables from the outer scope.

### Returns

| Property | Type | Description |
|---|---|---|
| `result` | `T \| null` | The return value of the last successful run |
| `error` | `Error \| null` | The error from the last failed run |
| `status` | `'idle' \| 'running' \| 'success' \| 'error'` | Current worker status |
| `run` | `(...args: unknown[]) => void` | Start the worker with the given arguments |
| `terminate` | `() => void` | Stop the current worker and reset status to `idle` |

## Examples

### Sort a large array

```tsx
function SortButton({ data }: { data: number[] }) {
  const { result, status, run } = useWorker((arr: number[]) => {
    return arr.slice().sort((a, b) => a - b);
  });

  return (
    <div>
      <button onClick={() => run(data)} disabled={status === 'running'}>
        {status === 'running' ? 'Sorting...' : 'Sort'}
      </button>
      {status === 'success' && <p>First: {(result as number[])[0]}</p>}
    </div>
  );
}
```

### Image processing

```tsx
function ImageFilter({ pixels }: { pixels: ImageData }) {
  const { result, status, run } = useWorker((data: ImageData) => {
    // Grayscale conversion — runs off the main thread
    for (let i = 0; i < data.data.length; i += 4) {
      const avg = (data.data[i] + data.data[i + 1] + data.data[i + 2]) / 3;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = avg;
    }
    return data;
  });

  return (
    <button onClick={() => run(pixels)} disabled={status === 'running'}>
      {status === 'running' ? 'Processing...' : 'Apply Grayscale'}
    </button>
  );
}
```

### Fibonacci (CPU-intensive)

```tsx
function FibCalculator() {
  const { result, status, run } = useWorker((n: number): number => {
    function fib(x: number): number {
      if (x <= 1) return x;
      return fib(x - 1) + fib(x - 2);
    }
    return fib(n);
  });

  return (
    <div>
      <button onClick={() => run(42)}>Calculate fib(42)</button>
      {status === 'running' && <p>Computing... UI stays responsive!</p>}
      {status === 'success' && <p>fib(42) = {result as number}</p>}
    </div>
  );
}
```

### Error handling

```tsx
const { result, error, status, run } = useWorker((input: unknown) => {
  if (typeof input !== 'number') throw new Error('Expected a number');
  return input * 2;
});

return (
  <div>
    <button onClick={() => run('oops')}>Run</button>
    {status === 'error' && <p>Error: {error?.message}</p>}
  </div>
);
```

## Features

- ✅ Runs computation off the main thread — UI stays responsive
- ✅ Fine-grained status: `idle`, `running`, `success`, `error`
- ✅ Supports async (Promise-returning) worker functions
- ✅ Previous worker is terminated before starting a new one
- ✅ Manual `terminate()` for cancellation
- ✅ Worker terminated automatically on unmount

## Notes

> **Important:** The function passed to `useWorker` must be **self-contained**. It is serialized via `.toString()` and run in an isolated worker scope. It **cannot** reference variables, imports, or closures from the surrounding component — only its own parameters and locally defined helpers.

- Both synchronous and async worker functions are supported
- A new worker is spawned on each `run()` call — the previous one is terminated first
- The `fn` reference is captured via a ref, so you can safely declare it inline without the referential stability concern
