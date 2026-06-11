import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useThrottle } from './index'

describe('useThrottle', () => {
  beforeEach(() => {
    // Anchor the fake clock so Date.now() advances together with timers.
    vi.useFakeTimers({ now: 0 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('initial', 500))

    expect(result.current).toBe('initial')
  })

  // (a) LEADING EDGE.
  // After the interval has elapsed with no pending update, the next change must
  // surface *immediately* (synchronously inside the effect, with NO timer
  // advance) — that is the leading edge of the new window. The fix takes the
  // `now >= lastUpdated.current + interval` branch and calls setState directly.
  // The buggy code (`if (lastUpdated.current && ...)`) instead schedules a full
  // interval timeout, so the value would still be the old one until ~500ms
  // later. Asserting the change with zero timer advance fails on the bug.
  it('should pass a change through immediately on the leading edge after a quiet interval', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 500),
      { initialProps: { value: 'a' } }
    )

    expect(result.current).toBe('a')

    // Let a full interval pass with no changes so the next change is a fresh
    // leading edge.
    act(() => {
      vi.advanceTimersByTime(600)
    })

    // Change the value but do NOT advance any timers.
    act(() => {
      rerender({ value: 'b' })
    })

    // Leading edge: the value must already be 'b' without waiting.
    expect(result.current).toBe('b')
  })

  // (b) RAPID CONTINUOUS CHANGES FROM MOUNT.
  // This is the core regression test. On the buggy code each change clears the
  // previous full-interval timeout and reschedules another full interval, so a
  // value changing faster than the interval NEVER updates (frozen at 'v0').
  // The fix fires the trailing edge for the *remaining* time, so the throttled
  // value advances at each interval boundary. This test FAILS on the buggy code.
  it('should produce intermediate updates under rapid continuous changes, not a frozen value', () => {
    let value = 'v0'
    const { result, rerender } = renderHook(() => useThrottle(value, 500))

    expect(result.current).toBe('v0')

    // Drive a change every 100ms for 1200ms total (changes are far more
    // frequent than the 500ms interval).
    const seen: string[] = [result.current]
    for (let i = 1; i <= 12; i++) {
      value = `v${i}`
      rerender()
      act(() => {
        vi.advanceTimersByTime(100)
      })
      seen.push(result.current)
    }

    // The throttled value must have moved past the initial frozen value.
    expect(result.current).not.toBe('v0')
    // And it must have emitted more than one distinct value over the run.
    expect(new Set(seen).size).toBeGreaterThan(1)
  })

  // (c) TRAILING EDGE — with precise remaining-time timing.
  // The fix schedules the trailing timeout for the *remaining* time of the
  // current window (`lastUpdated + interval - now`), so after a burst the final
  // value lands exactly one interval after the window opened. The buggy code
  // schedules a *full* interval from each change, so the trailing value lands
  // much later (one full interval after the LAST change). Here the window opens
  // at t=0 and the last change is at t=200; advancing to exactly t=500 (300ms,
  // the remaining time) must already show 'final'. The bug would not fire until
  // t=700, so it still reads 'first' at this point and FAILS.
  it('should fire the trailing value after the remaining interval time, not a full interval after the last change', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 500),
      { initialProps: { value: 'first' } }
    )

    expect(result.current).toBe('first')

    // Burst of changes within the first interval window (opened at t=0).
    rerender({ value: 'second' }) // t=0
    act(() => {
      vi.advanceTimersByTime(100) // t=100
    })
    rerender({ value: 'third' })
    act(() => {
      vi.advanceTimersByTime(100) // t=200
    })
    rerender({ value: 'final' })

    // Advance the remaining 300ms to reach exactly t=500 (one interval since
    // the window opened). The trailing value must already be delivered.
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('final')
  })

  // (d) COALESCING — at most one update per interval window.
  // Several changes that all fall inside a single interval must collapse into a
  // single throttled emission of the latest value (not one update per change,
  // and not skipped). This pins the throttle semantics: a mutation that turns
  // the trailing timeout into an immediate per-change update would emit
  // intermediate values and fail the mid-window assertion below.
  it('should coalesce multiple changes within one interval into a single latest update', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 500),
      { initialProps: { value: 0 } }
    )

    expect(result.current).toBe(0)

    // Three changes, all inside the first 500ms window.
    rerender({ value: 1 })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    rerender({ value: 2 })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    rerender({ value: 3 })

    // Still inside the window: value must not have updated yet (coalesced).
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe(0)

    // Window elapses: exactly the latest value is delivered.
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe(3)
  })

  it('should allow a new update only after the interval has elapsed since the last update', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value, 500),
      { initialProps: { value: 'a' } }
    )

    // First change settles after one interval.
    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('b')

    // A change shortly after the last update must wait out the interval.
    rerender({ value: 'c' })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('b')

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('c')
  })

  it('should clean up the pending timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

    const { rerender, unmount } = renderHook(
      ({ value }) => useThrottle(value, 500),
      { initialProps: { value: 'a' } }
    )

    // Schedule a trailing timeout, then unmount before it fires.
    rerender({ value: 'b' })
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()

    clearTimeoutSpy.mockRestore()
  })

  it('should use the default interval of 500ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useThrottle(value),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'b' })

    act(() => {
      vi.advanceTimersByTime(499)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('b')
  })
})
