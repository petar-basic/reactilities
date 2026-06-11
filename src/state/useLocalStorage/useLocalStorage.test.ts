import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from './index'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    
    // Reset window.dispatchEvent spy if it exists
    if (vi.isMockFunction(window.dispatchEvent)) {
      window.dispatchEvent.mockClear()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    expect(result.current[0]).toBe('initial-value')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
  })

  it('should return stored value from localStorage', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'))
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    expect(result.current[0]).toBe('stored-value')
  })

  it('should set initial value in localStorage if key does not exist', () => {
    renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('initial-value'))
  })

  it('should not set initial value if key already exists', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('existing-value'))
    
    renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    expect(localStorageMock.setItem).not.toHaveBeenCalled()
  })

  it('should update localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
  })

  it('should handle functional updates', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify('current-value'))
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    act(() => {
      result.current[1]((prev: string) => prev + '-updated')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('current-value-updated'))
  })

  it('should remove item from localStorage when value is null', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('test-key', 'initial-value'))
    
    act(() => {
      result.current[1](null)
    })
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('should remove item from localStorage when value is undefined', () => {
    const { result } = renderHook(() => useLocalStorage<string | undefined>('test-key', 'initial-value'))
    
    act(() => {
      result.current[1](undefined)
    })
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('should handle complex objects', () => {
    const complexObject = { name: 'John', age: 30, hobbies: ['reading', 'coding'] }
    
    const { result } = renderHook(() => useLocalStorage('test-key', complexObject))
    
    const newObject = { ...complexObject, age: 31 }
    
    act(() => {
      result.current[1](newObject)
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(newObject))
  })

  it('should handle arrays', () => {
    const initialArray = [1, 2, 3]
    
    const { result } = renderHook(() => useLocalStorage('test-key', initialArray))
    
    act(() => {
      result.current[1]([...initialArray, 4])
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify([1, 2, 3, 4]))
  })

  it('should handle functional updates with complex objects', () => {
    const initialObject = { count: 0, items: [] as any[] }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(initialObject))
    
    const { result } = renderHook(() => useLocalStorage('test-key', initialObject))
    
    act(() => {
      result.current[1]((prev: typeof initialObject) => ({ ...prev, count: prev.count + 1 }))
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify({ count: 1, items: [] }))
  })

  it('should handle JSON parse errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json')
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback-value'))
    
    // Should fall back to initial value when JSON parsing fails
    expect(result.current[0]).toBe('fallback-value')
  })

  it('should handle localStorage errors on initialization', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Mock setItem to throw error
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage is not available')
    })
    
    // Should not crash during initialization
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    // Should still return initial value
    expect(result.current[0]).toBe('initial-value')
    
    // Should log warning
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Error initializing localStorage:',
      expect.any(Error)
    )
    
    consoleWarnSpy.mockRestore()
  })

  it('should call setItem when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
  })

  it('should handle errors when setting value', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    // Mock setItem to throw error on next call
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage quota exceeded')
    })
    
    // Should not crash when trying to set value
    act(() => {
      result.current[1]('new-value')
    })
    
    // Should log warning
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Error setting localStorage:',
      expect.any(Error)
    )
    
    consoleWarnSpy.mockRestore()
  })

  it('should dispatch storage event when item is removed', () => {
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')
    
    const { result } = renderHook(() => useLocalStorage<string | null>('test-key', 'initial-value'))
    
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
    const { result: numberResult } = renderHook(() => useLocalStorage('number-key', 42))
    expect(numberResult.current[0]).toBe(42)
    
    // Test with boolean
    const { result: boolResult } = renderHook(() => useLocalStorage('bool-key', true))
    expect(boolResult.current[0]).toBe(true)
    
    // Test with null
    const { result: nullResult } = renderHook(() => useLocalStorage('null-key', null))
    expect(nullResult.current[0]).toBe(null)
  })

  it('should update when localStorage changes externally', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))

    // Simulate external localStorage change
    localStorageMock.getItem.mockReturnValue(JSON.stringify('external-value'))

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
  // Several of these need localStorage to behave like a real store (a write is
  // readable on the very next read) instead of the static return-value mock
  // used above, so they install a small in-memory backing store first.
  // ---------------------------------------------------------------------------

  const useRealLocalStorageStore = () => {
    const store = new Map<string, string>()
    localStorageMock.getItem.mockImplementation((key: string) =>
      store.has(key) ? store.get(key)! : null
    )
    localStorageMock.setItem.mockImplementation((key: string, value: string) => {
      store.set(key, value)
    })
    localStorageMock.removeItem.mockImplementation((key: string) => {
      store.delete(key)
    })
    return store
  }

  // BUG 1 — stable identity. Re-rendering without any storage change must return
  // the SAME object reference. Fails on the pre-fix code (which re-ran
  // JSON.parse on every render and produced a new object each time).
  it('returns a stable object reference across renders when storage is unchanged', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify({ a: 1, nested: { b: 2 } }))

    const { result, rerender } = renderHook(() =>
      useLocalStorage('obj-key', { a: 0, nested: { b: 0 } })
    )

    const first = result.current[0]
    rerender()
    rerender()
    const afterRerenders = result.current[0]

    expect(afterRerenders).toBe(first)
  })

  it('returns a stable array reference across renders when storage is unchanged', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify([1, 2, 3]))

    const { result, rerender } = renderHook(() => useLocalStorage<number[]>('arr-key', []))

    const first = result.current[0]
    rerender()
    const second = result.current[0]

    expect(second).toBe(first)
  })

  // BUG 3 — functional updates compose. Two functional updaters applied within a
  // single act must compose (0 -> 2). Fails on the pre-fix code, which read a
  // stale render-time `store` snapshot for both calls and yielded 1.
  it('composes two functional updates applied in a single act (0 -> 2)', () => {
    useRealLocalStorageStore()

    const { result } = renderHook(() => useLocalStorage('counter', 0))

    act(() => {
      result.current[1]((v: number) => v + 1)
      result.current[1]((v: number) => v + 1)
    })

    expect(result.current[0]).toBe(2)
  })

  it('composes many functional updates in a single act (0 -> 5)', () => {
    useRealLocalStorageStore()

    const { result } = renderHook(() => useLocalStorage('counter', 0))

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
    useRealLocalStorageStore()

    const { result } = renderHook(() => useLocalStorage('rt-key', 'initial-value'))

    act(() => {
      result.current[1]('next-value')
    })

    expect(result.current[0]).toBe('next-value')
  })

  it('reflects a functional update in the rendered output after setValue', () => {
    useRealLocalStorageStore()

    const { result } = renderHook(() =>
      useLocalStorage('rt-obj', { count: 0 })
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
      const [value] = useLocalStorage('ssr-key', 'ssr-initial')
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
      const [value] = useLocalStorage('ssr-obj', { theme: 'dark' })
      return React.createElement('span', null, JSON.stringify(value))
    }

    let html = ''
    expect(() => {
      html = renderToString(React.createElement(SsrConsumer))
    }).not.toThrow()

    expect(html).toContain('dark')
  })
})
