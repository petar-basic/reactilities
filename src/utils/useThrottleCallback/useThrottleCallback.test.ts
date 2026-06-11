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

  it('should not double-invoke when a leading-edge call lands on a pending trailing timer', () => {
    // The hook reads wall-clock time via Date.now() to decide the leading-edge branch,
    // while scheduling the trailing call via setTimeout. To deterministically construct
    // the race — a leading-edge call happening WHILE a trailing timer is still pending —
    // we control Date.now() independently from the fake setTimeout queue.
    let mockNow = 0
    const dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => mockNow)
    try {
      const callback = vi.fn()
      const { result } = renderHook(() => useThrottleCallback(callback, 500))

      // t=0: leading-edge call fires immediately and records lastCalled=0
      mockNow = 0
      act(() => {
        result.current('a')
      })
      expect(callback).toHaveBeenCalledTimes(1)

      // t=100: call during the throttle window schedules a trailing timer.
      // delay = interval - (now - lastCalled) = 500 - 100 = 400ms (would fire at queue-time 400).
      mockNow = 100
      act(() => {
        result.current('b')
      })
      expect(callback).toHaveBeenCalledTimes(1)

      // t=500: a NEW call lands on the interval boundary (now 500 >= lastCalled 0 + 500),
      // taking the immediate branch — while the trailing timer scheduled above is STILL pending
      // (we have not advanced the fake timer queue at all). The fix must clearTimeout that pending
      // timer here; otherwise it will fire next and double-invoke the callback.
      mockNow = 500
      act(() => {
        result.current('c')
      })
      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenLastCalledWith('c')

      // Flush the timer queue: the previously-pending trailing timer must NOT fire.
      // Without clearTimeout in the immediate branch, this produces a 3rd invocation with 'b'.
      act(() => {
        vi.runOnlyPendingTimers()
      })
      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenLastCalledWith('c')
    } finally {
      dateNowSpy.mockRestore()
    }
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
