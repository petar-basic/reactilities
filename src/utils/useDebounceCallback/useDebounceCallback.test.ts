import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounceCallback } from './index'

describe('useDebounceCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not call the callback immediately', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebounceCallback(callback, 500))

    act(() => {
      result.current('arg1')
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should call the callback after the delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebounceCallback(callback, 500))

    act(() => {
      result.current('arg1')
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('arg1')
  })

  it('should reset the timer on each call', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebounceCallback(callback, 500))

    act(() => {
      result.current('first')
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    act(() => {
      result.current('second')
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Still not called — second call reset the timer
    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('second')
  })

  it('should only call once for rapid successive calls', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebounceCallback(callback, 300))

    act(() => {
      result.current('a')
      result.current('b')
      result.current('c')
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('c')
  })

  it('should pass all arguments to the callback', () => {
    const callback = vi.fn()
    const { result } = renderHook(() =>
      useDebounceCallback((a: string, b: number, c: boolean) => callback(a, b, c), 100)
    )

    act(() => {
      result.current('hello', 42, true)
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledWith('hello', 42, true)
  })

  it('should always use the latest callback version', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    const { result, rerender } = renderHook(
      ({ cb }) => useDebounceCallback(cb, 200),
      { initialProps: { cb: callback1 } }
    )

    act(() => {
      result.current('test')
    })

    // Update the callback before the timer fires
    rerender({ cb: callback2 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledWith('test')
  })

  it('should return a stable function reference when delay does not change', () => {
    const callback = vi.fn()
    const { result, rerender } = renderHook(() => useDebounceCallback(callback, 300))

    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('should return a new function reference when delay changes', () => {
    const callback = vi.fn()
    const { result, rerender } = renderHook(
      ({ delay }) => useDebounceCallback(callback, delay),
      { initialProps: { delay: 300 } }
    )

    const first = result.current
    rerender({ delay: 600 })
    expect(result.current).not.toBe(first)
  })

  it('should cancel pending call on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebounceCallback(callback, 500))

    act(() => {
      result.current('test')
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it('should handle zero delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebounceCallback(callback, 0))

    act(() => {
      result.current('arg')
    })

    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(callback).toHaveBeenCalledWith('arg')
  })
})
