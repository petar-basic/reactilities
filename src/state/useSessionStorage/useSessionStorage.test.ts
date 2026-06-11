import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSessionStorage } from './index'

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

describe('useSessionStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorageMock.getItem.mockReturnValue(null)
    sessionStorageMock.setItem.mockClear()
    sessionStorageMock.removeItem.mockClear()

    // Reset window.dispatchEvent spy if it exists
    if (vi.isMockFunction(window.dispatchEvent)) {
      window.dispatchEvent.mockClear()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial value when sessionStorage is empty', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'))

    expect(result.current[0]).toBe('initial-value')
    expect(sessionStorageMock.getItem).toHaveBeenCalledWith('test-key')
  })

  it('should return stored value from sessionStorage', () => {
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'))

    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'))

    expect(result.current[0]).toBe('stored-value')
  })

  it('should set initial value in sessionStorage if key does not exist', () => {
    renderHook(() => useSessionStorage('test-key', 'initial-value'))

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('initial-value'))
  })

  it('should not set initial value if key already exists', () => {
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify('existing-value'))

    renderHook(() => useSessionStorage('test-key', 'initial-value'))

    expect(sessionStorageMock.setItem).not.toHaveBeenCalled()
  })

  it('should update sessionStorage when setValue is called', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'))

    act(() => {
      result.current[1]('new-value')
    })

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
  })

  it('should handle functional updates', () => {
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify('current-value'))

    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'))

    act(() => {
      result.current[1]((prev: string) => prev + '-updated')
    })

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('current-value-updated'))
  })

  it('should remove item from sessionStorage when value is null', () => {
    const { result } = renderHook(() => useSessionStorage<string | null>('test-key', 'initial-value'))

    act(() => {
      result.current[1](null)
    })

    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('should remove item from sessionStorage when value is undefined', () => {
    const { result } = renderHook(() => useSessionStorage<string | undefined>('test-key', 'initial-value'))

    act(() => {
      result.current[1](undefined)
    })

    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('should handle complex objects', () => {
    const complexObject = { name: 'John', age: 30, hobbies: ['reading', 'coding'] }

    const { result } = renderHook(() => useSessionStorage('test-key', complexObject))

    const newObject = { ...complexObject, age: 31 }

    act(() => {
      result.current[1](newObject)
    })

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(newObject))
  })

  it('should handle arrays', () => {
    const initialArray = [1, 2, 3]

    const { result } = renderHook(() => useSessionStorage('test-key', initialArray))

    act(() => {
      result.current[1]([...initialArray, 4])
    })

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify([1, 2, 3, 4]))
  })

  it('should handle functional updates with complex objects', () => {
    const initialObject = { count: 0, items: [] as any[] }
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify(initialObject))

    const { result } = renderHook(() => useSessionStorage('test-key', initialObject))

    act(() => {
      result.current[1]((prev: typeof initialObject) => ({ ...prev, count: prev.count + 1 }))
    })

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify({ count: 1, items: [] }))
  })

  it('should handle JSON parse errors gracefully', () => {
    sessionStorageMock.getItem.mockReturnValue('invalid-json')

    const { result } = renderHook(() => useSessionStorage('test-key', 'fallback-value'))

    // Should fall back to initial value when JSON parsing fails
    expect(result.current[0]).toBe('fallback-value')
  })

  it('should handle sessionStorage errors on initialization', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Mock setItem to throw error
    sessionStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('sessionStorage is not available')
    })

    // Should not crash during initialization
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'))

    // Should still return initial value
    expect(result.current[0]).toBe('initial-value')

    // Should log warning
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Error initializing sessionStorage:',
      expect.any(Error)
    )

    consoleWarnSpy.mockRestore()
  })

  it('should call setItem when value changes', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'))

    act(() => {
      result.current[1]('new-value')
    })

    expect(sessionStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
  })

  it('should handle errors when setting value', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'))

    // Mock setItem to throw error on next call
    sessionStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('sessionStorage quota exceeded')
    })

    // Should not crash when trying to set value
    act(() => {
      result.current[1]('new-value')
    })

    // Should log warning
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Error setting sessionStorage:',
      expect.any(Error)
    )

    consoleWarnSpy.mockRestore()
  })

  it('should dispatch storage event when item is removed', () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

    const { result } = renderHook(() => useSessionStorage<string | null>('test-key', 'initial-value'))

    act(() => {
      result.current[1](null)
    })

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'storage',
        key: 'test-key',
        newValue: null
      })
    )

    dispatchEventSpy.mockRestore()
  })

  it('should handle different data types', () => {
    // Test with number
    const { result: numberResult } = renderHook(() => useSessionStorage('number-key', 42))
    expect(numberResult.current[0]).toBe(42)

    // Test with boolean
    const { result: boolResult } = renderHook(() => useSessionStorage('bool-key', true))
    expect(boolResult.current[0]).toBe(true)

    // Test with null
    const { result: nullResult } = renderHook(() => useSessionStorage('null-key', null))
    expect(nullResult.current[0]).toBe(null)
  })

  it('should update when sessionStorage changes externally', () => {
    const { result } = renderHook(() => useSessionStorage('test-key', 'initial-value'))

    // Simulate external sessionStorage change
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify('external-value'))

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify('external-value')
      }))
    })

    expect(result.current[0]).toBe('external-value')
  })

  // ---------------------------------------------------------------------------
  // Mutation-proof regression tests for the three fixed bugs.
  //
  // Several of these need sessionStorage to behave like a real store (a write
  // is readable on the very next read) instead of the static return-value mock
  // used above, so they install a small in-memory backing store first.
  // ---------------------------------------------------------------------------

  const useRealSessionStorageStore = () => {
    const store = new Map<string, string>()
    sessionStorageMock.getItem.mockImplementation((key: string) =>
      store.has(key) ? store.get(key)! : null
    )
    sessionStorageMock.setItem.mockImplementation((key: string, value: string) => {
      store.set(key, value)
    })
    sessionStorageMock.removeItem.mockImplementation((key: string) => {
      store.delete(key)
    })
    return store
  }

  // BUG 1 — stable identity. Re-rendering without any storage change must return
  // the SAME object reference. Fails on the pre-fix code (which re-ran
  // JSON.parse on every render and produced a new object each time).
  it('returns a stable object reference across renders when storage is unchanged', () => {
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify({ a: 1, nested: { b: 2 } }))

    const { result, rerender } = renderHook(() =>
      useSessionStorage('obj-key', { a: 0, nested: { b: 0 } })
    )

    const first = result.current[0]
    rerender()
    rerender()
    const afterRerenders = result.current[0]

    expect(afterRerenders).toBe(first)
  })

  it('returns a stable array reference across renders when storage is unchanged', () => {
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify([1, 2, 3]))

    const { result, rerender } = renderHook(() => useSessionStorage<number[]>('arr-key', []))

    const first = result.current[0]
    rerender()
    const second = result.current[0]

    expect(second).toBe(first)
  })

  // BUG 3 — functional updates compose. Two functional updaters applied within a
  // single act must compose (0 -> 2). Fails on the pre-fix code, which read a
  // stale render-time `store` snapshot for both calls and yielded 1.
  it('composes two functional updates applied in a single act (0 -> 2)', () => {
    useRealSessionStorageStore()

    const { result } = renderHook(() => useSessionStorage('counter', 0))

    act(() => {
      result.current[1]((v: number) => v + 1)
      result.current[1]((v: number) => v + 1)
    })

    expect(result.current[0]).toBe(2)
  })

  it('composes many functional updates in a single act (0 -> 5)', () => {
    useRealSessionStorageStore()

    const { result } = renderHook(() => useSessionStorage('counter', 0))

    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current[1]((v: number) => v + 1)
      }
    })

    expect(result.current[0]).toBe(5)
  })

  // BUG 3 (round-trip) — after setValue the RENDERED value reflects the new
  // value. No existing test asserted the rendered output after a set.
  it('reflects the new value in the rendered output after setValue (round-trip)', () => {
    useRealSessionStorageStore()

    const { result } = renderHook(() => useSessionStorage('rt-key', 'initial-value'))

    act(() => {
      result.current[1]('next-value')
    })

    expect(result.current[0]).toBe('next-value')
  })

  it('reflects a functional update in the rendered output after setValue', () => {
    useRealSessionStorageStore()

    const { result } = renderHook(() =>
      useSessionStorage('rt-obj', { count: 0 })
    )

    act(() => {
      result.current[1]((prev: { count: number }) => ({ count: prev.count + 1 }))
    })

    expect(result.current[0]).toEqual({ count: 1 })
  })

  // BUG 2 — SSR. getServerSnapshot must return the serialized initialValue and
  // must NOT throw. Fails on the pre-fix code, which threw inside
  // getServerSnapshot. We exercise the hook through renderToString to drive the
  // server-snapshot path.
  it('renders the initial value on the server without throwing (SSR)', async () => {
    const { renderToString } = await import('react-dom/server')
    const React = await import('react')

    function SsrConsumer() {
      const [value] = useSessionStorage('ssr-key', 'ssr-initial')
      return React.createElement('span', null, String(value))
    }

    let html = ''
    expect(() => {
      html = renderToString(React.createElement(SsrConsumer))
    }).not.toThrow()

    expect(html).toContain('ssr-initial')
  })

  it('renders an initial object value on the server without throwing (SSR)', async () => {
    const { renderToString } = await import('react-dom/server')
    const React = await import('react')

    function SsrConsumer() {
      const [value] = useSessionStorage('ssr-obj', { theme: 'dark' })
      return React.createElement('span', null, JSON.stringify(value))
    }

    let html = ''
    expect(() => {
      html = renderToString(React.createElement(SsrConsumer))
    }).not.toThrow()

    expect(html).toContain('dark')
  })
})
