import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorker } from './index'

interface WorkerMessage {
  result?: unknown
  error?: string
}

class MockWorker {
  onmessage: ((e: MessageEvent<WorkerMessage>) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null
  terminate = vi.fn()
  postMessage = vi.fn()

  simulateSuccess(result: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: { result } }))
  }

  simulateError(message: string) {
    this.onmessage?.(new MessageEvent('message', { data: { error: message } }))
  }
}

let lastWorker: MockWorker | null = null
const originalURL = URL

describe('useWorker', () => {
  beforeEach(() => {
    lastWorker = null

    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
    URL.revokeObjectURL = vi.fn()

    vi.stubGlobal('Worker', class {
      onmessage: ((e: MessageEvent<WorkerMessage>) => void) | null = null
      onerror: ((e: ErrorEvent) => void) | null = null
      terminate = vi.fn()
      postMessage = vi.fn()

      constructor() {
        const mock = new MockWorker()
        // Copy methods
        Object.assign(this, mock)
        lastWorker = mock
        // Make the instance methods point to the mock
        lastWorker!.terminate = this.terminate
        lastWorker!.postMessage = this.postMessage
        lastWorker!.onmessage = null
        lastWorker!.onerror = null

        // Bind this instance so onmessage/onerror assignment works
         
        const self = this
        Object.defineProperty(lastWorker, 'onmessage', {
          get() { return self.onmessage },
          set(v) { self.onmessage = v }
        })
        Object.defineProperty(lastWorker, 'onerror', {
          get() { return self.onerror },
          set(v) { self.onerror = v }
        })
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    URL.createObjectURL = originalURL.createObjectURL
    URL.revokeObjectURL = originalURL.revokeObjectURL
  })

  it('should start with idle status', () => {
    const { result } = renderHook(() => useWorker(() => 42))
    expect(result.current.status).toBe('idle')
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should set status to running when run() is called', () => {
    const { result } = renderHook(() => useWorker(() => 42))

    act(() => {
      result.current.run()
    })

    expect(result.current.status).toBe('running')
  })

  it('should set result and status to success on worker success', () => {
    const { result } = renderHook(() => useWorker(() => 42))

    act(() => {
      result.current.run()
    })

    act(() => {
      lastWorker?.simulateSuccess(42)
    })

    expect(result.current.status).toBe('success')
    expect(result.current.result).toBe(42)
  })

  it('should set error and status to error on worker error message', () => {
    const { result } = renderHook(() => useWorker(() => 42))

    act(() => {
      result.current.run()
    })

    act(() => {
      lastWorker?.simulateError('Something went wrong')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error?.message).toBe('Something went wrong')
  })

  it('should clear error before a new run', () => {
    const { result } = renderHook(() => useWorker(() => 42))

    act(() => { result.current.run() })
    act(() => { lastWorker?.simulateError('fail') })
    expect(result.current.error).not.toBeNull()

    act(() => { result.current.run() })
    expect(result.current.error).toBeNull()
  })

  it('should pass arguments to the worker via postMessage', () => {
    const { result } = renderHook(() => useWorker((a: number, b: number) => a + b))

    act(() => {
      result.current.run(10, 20)
    })

    expect(lastWorker?.postMessage).toHaveBeenCalledWith([10, 20])
  })

  it('should terminate the previous worker before starting a new one', () => {
    const { result } = renderHook(() => useWorker(() => 42))

    act(() => { result.current.run() })
    const firstWorkerTerminate = lastWorker?.terminate

    act(() => { result.current.run() })

    expect(firstWorkerTerminate).toHaveBeenCalled()
  })

  it('should reset status to idle when terminate() is called', () => {
    const { result } = renderHook(() => useWorker(() => 42))

    act(() => { result.current.run() })
    expect(result.current.status).toBe('running')

    act(() => { result.current.terminate() })
    expect(result.current.status).toBe('idle')
  })

  it('should terminate the worker on unmount', () => {
    const { result, unmount } = renderHook(() => useWorker(() => 42))

    act(() => { result.current.run() })
    const workerTerminate = lastWorker?.terminate

    unmount()

    expect(workerTerminate).toHaveBeenCalled()
  })
})

/**
 * Observable-behavior tests with an *executing* Worker mock.
 *
 * Unlike the spy-only mock above (which records postMessage but never runs the
 * serialized function), this mock evaluates the actual worker script produced by
 * `createWorkerFromFn` and runs the real `fn` with the posted arguments, then
 * feeds the value back through `onmessage`. This validates the real
 * serialize -> run(args) -> result contract rather than only mock calls, so a
 * regression in argument passing, serialization, or result wiring is caught.
 */
describe('useWorker (executing worker)', () => {
  let lastScript: string | null = null
  const originalUrl = URL
  const RealBlob = globalThis.Blob

  beforeEach(() => {
    lastScript = null

    // The hook serializes the worker script into a Blob. Subclass Blob to
    // capture the exact script text the hook generated (robust against jsdom
    // Blob internals), so the mock Worker can execute the REAL script below.
    vi.stubGlobal('Blob', class extends RealBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        lastScript = parts.join('')
        super(parts, opts)
      }
    })

    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
    URL.revokeObjectURL = vi.fn()

    vi.stubGlobal('Worker', class {
      onmessage: ((e: MessageEvent<WorkerMessage>) => void) | null = null
      onerror: ((e: ErrorEvent) => void) | null = null
      terminate = vi.fn()

      postMessage(args: unknown[]) {
        // Reconstruct the worker's `self.onmessage` from the captured script and
        // run the REAL serialized function with the posted arguments.
        const fakeSelf: {
          onmessage: ((e: { data: unknown[] }) => void) | null
          postMessage: (msg: WorkerMessage) => void
        } = {
          onmessage: null,
          postMessage: (msg: WorkerMessage) => {
            queueMicrotask(() => this.onmessage?.(
              new MessageEvent('message', { data: msg })
            ))
          },
        }
        // The script body assigns `self.onmessage = function(e) {...}`.
        const installHandler = new Function('self', `${lastScript}`)
        installHandler(fakeSelf)
        fakeSelf.onmessage?.({ data: args })
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    URL.createObjectURL = originalUrl.createObjectURL
    URL.revokeObjectURL = originalUrl.revokeObjectURL
  })

  it('actually computes a typed result from typed input (run -> result)', async () => {
    const { result } = renderHook(() =>
      useWorker((numbers: number[]) => numbers.reduce((a, b) => a + b, 0))
    )

    await act(async () => {
      result.current.run([1, 2, 3, 4])
      await Promise.resolve()
    })

    expect(result.current.status).toBe('success')
    // 1 + 2 + 3 + 4 = 10 — proves the real fn ran with the real args.
    expect(result.current.result).toBe(10)
  })

  it('passes multiple typed arguments through to the function', async () => {
    const { result } = renderHook(() =>
      useWorker((a: number, b: number) => a * b)
    )

    await act(async () => {
      result.current.run(6, 7)
      await Promise.resolve()
    })

    expect(result.current.result).toBe(42)
  })

  it('resolves async worker functions to their awaited value', async () => {
    const { result } = renderHook(() =>
      useWorker(async (n: number) => Promise.resolve(n * n))
    )

    await act(async () => {
      result.current.run(5)
      // allow the worker Promise + the microtask hop to settle
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.status).toBe('success')
    expect(result.current.result).toBe(25)
  })

  it('surfaces a thrown error from the real function as status=error', async () => {
    const { result } = renderHook(() =>
      useWorker((input: number) => {
        if (input < 0) throw new Error('negative not allowed')
        return input
      })
    )

    await act(async () => {
      result.current.run(-1)
      await Promise.resolve()
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error?.message).toBe('negative not allowed')
  })
})
