import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThrottleCallback } from './index'

describe('useThrottleCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call the callback immediately on first call', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottleCallback(callback, 500))

    act(() => {
      result.current()
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should not call the callback again within the interval', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottleCallback(callback, 500))

    act(() => {
      result.current()
      result.current()
      result.current()
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should call the callback again after the interval elapses', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottleCallback(callback, 500))

    act(() => {
      result.current()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    act(() => {
      result.current()
    })

    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('should fire a trailing call after the interval when called during throttle window', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottleCallback(callback, 500))

    act(() => {
      result.current('first')
    })

    act(() => {
      result.current('second')
    })

    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('second')
  })

  it('should pass all arguments to the callback', () => {
    const callback = vi.fn()
    const { result } = renderHook(() =>
      useThrottleCallback((a: string, b: number) => callback(a, b), 300)
    )

    act(() => {
      result.current('hello', 42)
    })

    expect(callback).toHaveBeenCalledWith('hello', 42)
  })

  it('should always use the latest callback version', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    const { result, rerender } = renderHook(
      ({ cb }) => useThrottleCallback(cb, 500),
      { initialProps: { cb: callback1 } }
    )

    act(() => {
      vi.advanceTimersByTime(500)
    })

    rerender({ cb: callback2 })

    act(() => {
      result.current()
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledTimes(1)
  })

  it('should return a stable function reference when interval does not change', () => {
    const callback = vi.fn()
    const { result, rerender } = renderHook(() => useThrottleCallback(callback, 300))

    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })

  it('should use default interval of 500ms', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useThrottleCallback(callback))

    act(() => {
      result.current()
    })

    act(() => {
      result.current()
    })

    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledTimes(2)
  })
})
