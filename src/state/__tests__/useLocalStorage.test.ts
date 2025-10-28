import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useLocalStorage from '../useLocalStorage'

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

  it('should handle localStorage errors gracefully', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    // Should not throw error during initialization
    expect(() => {
      renderHook(() => useLocalStorage('test-key', 'initial-value'))
    }).not.toThrow()
    
    expect(consoleWarnSpy).toHaveBeenCalled()
    consoleWarnSpy.mockRestore()
  })

  it('should call setItem when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial-value'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
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
})
