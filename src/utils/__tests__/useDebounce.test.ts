import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useDebounce from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    
    expect(result.current).toBe('initial')
  })

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // Change value
    rerender({ value: 'updated', delay: 500 })
    
    // Should still be initial value immediately
    expect(result.current).toBe('initial')

    // Fast forward time by 250ms (less than delay)
    act(() => {
      vi.advanceTimersByTime(250)
    })
    
    expect(result.current).toBe('initial')

    // Fast forward time by another 250ms (total 500ms)
    act(() => {
      vi.advanceTimersByTime(250)
    })
    
    expect(result.current).toBe('updated')
  })

  it('should reset timer on rapid value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    expect(result.current).toBe('initial')

    // First change
    rerender({ value: 'change1' })
    
    // Wait 250ms
    act(() => {
      vi.advanceTimersByTime(250)
    })
    
    expect(result.current).toBe('initial')

    // Second change (should reset timer)
    rerender({ value: 'change2' })
    
    // Wait another 250ms (total 500ms from first change, but only 250ms from second)
    act(() => {
      vi.advanceTimersByTime(250)
    })
    
    expect(result.current).toBe('initial')

    // Wait another 250ms (total 500ms from second change)
    act(() => {
      vi.advanceTimersByTime(250)
    })
    
    expect(result.current).toBe('change2')
  })

  it('should handle delay changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // Change value and delay
    rerender({ value: 'updated', delay: 1000 })
    
    // Wait 500ms (original delay)
    act(() => {
      vi.advanceTimersByTime(500)
    })
    
    expect(result.current).toBe('initial')

    // Wait another 500ms (total 1000ms - new delay)
    act(() => {
      vi.advanceTimersByTime(500)
    })
    
    expect(result.current).toBe('updated')
  })

  it('should handle zero delay', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'initial' } }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated' })
    
    // With zero delay, should update immediately after next tick
    act(() => {
      vi.advanceTimersByTime(0)
    })
    
    expect(result.current).toBe('updated')
  })

  it('should handle different data types', async () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } }
    )

    numberRerender({ value: 42 })
    
    act(() => {
      vi.advanceTimersByTime(100)
    })
    
    expect(numberResult.current).toBe(42)

    // Test with boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: false } }
    )

    boolRerender({ value: true })
    
    act(() => {
      vi.advanceTimersByTime(100)
    })
    
    expect(boolResult.current).toBe(true)

    // Test with object
    const initialObj = { name: 'John' }
    const updatedObj = { name: 'Jane' }
    
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: initialObj } }
    )

    objRerender({ value: updatedObj })
    
    act(() => {
      vi.advanceTimersByTime(100)
    })
    
    expect(objResult.current).toBe(updatedObj)
  })

  it('should handle null and undefined values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 'initial' as string | null | undefined } }
    )

    // Change to null
    rerender({ value: null })
    
    act(() => {
      vi.advanceTimersByTime(100)
    })
    
    expect(result.current).toBe(null)

    // Change to undefined
    rerender({ value: undefined })
    
    act(() => {
      vi.advanceTimersByTime(100)
    })
    
    expect(result.current).toBe(undefined)
  })

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
    
    const { unmount } = renderHook(() => useDebounce('test', 500))
    
    unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
    
    clearTimeoutSpy.mockRestore()
  })

  it('should handle very short delays', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })
    
    act(() => {
      vi.advanceTimersByTime(1)
    })
    
    expect(result.current).toBe('updated')
  })

  it('should handle very long delays', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 10000),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })
    
    // Wait 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    
    expect(result.current).toBe('initial')

    // Wait another 5 seconds (total 10 seconds)
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    
    expect(result.current).toBe('updated')
  })
})
