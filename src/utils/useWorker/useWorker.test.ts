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
        // eslint-disable-next-line @typescript-eslint/no-this-alias
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
