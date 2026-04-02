import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIdleTimeout } from './index'

describe('useIdleTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start as not idle', () => {
    const { result } = renderHook(() => useIdleTimeout({ timeout: 1000 }))
    expect(result.current.isIdle).toBe(false)
  })

  it('should become idle after the timeout', () => {
    const { result } = renderHook(() => useIdleTimeout({ timeout: 1000 }))

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.isIdle).toBe(true)
  })

  it('should not become idle before the timeout', () => {
    const { result } = renderHook(() => useIdleTimeout({ timeout: 1000 }))

    act(() => {
      vi.advanceTimersByTime(999)
    })

    expect(result.current.isIdle).toBe(false)
  })

  it('should call onIdle when the timeout expires', () => {
    const onIdle = vi.fn()
    renderHook(() => useIdleTimeout({ timeout: 1000, onIdle }))

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onIdle).toHaveBeenCalledTimes(1)
  })

  it('should call onActive when user activity is detected while idle', () => {
    const onActive = vi.fn()
    const { result } = renderHook(() => useIdleTimeout({ timeout: 1000, onActive }))

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.isIdle).toBe(true)

    act(() => {
      document.dispatchEvent(new Event('mousemove'))
    })

    expect(result.current.isIdle).toBe(false)
    expect(onActive).toHaveBeenCalledTimes(1)
  })

  it('should not call onActive on activity when not idle', () => {
    const onActive = vi.fn()
    renderHook(() => useIdleTimeout({ timeout: 1000, onActive }))

    act(() => {
      document.dispatchEvent(new Event('mousemove'))
    })

    expect(onActive).not.toHaveBeenCalled()
  })

  it('should reset the timer on user activity', () => {
    const { result } = renderHook(() => useIdleTimeout({ timeout: 1000 }))

    act(() => {
      vi.advanceTimersByTime(800)
    })

    act(() => {
      document.dispatchEvent(new Event('mousemove'))
    })

    act(() => {
      vi.advanceTimersByTime(800)
    })

    // Still not idle — activity reset the timer
    expect(result.current.isIdle).toBe(false)

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isIdle).toBe(true)
  })

  it('should reset the timer manually via reset()', () => {
    const { result } = renderHook(() => useIdleTimeout({ timeout: 1000 }))

    act(() => {
      vi.advanceTimersByTime(800)
    })

    act(() => {
      result.current.reset()
    })

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(result.current.isIdle).toBe(false)

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current.isIdle).toBe(true)
  })

  it('should listen to custom events', () => {
    const { result } = renderHook(() =>
      useIdleTimeout({ timeout: 1000, events: ['keydown'] })
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.isIdle).toBe(true)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown'))
    })

    expect(result.current.isIdle).toBe(false)
  })

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useIdleTimeout({ timeout: 1000 }))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalled()
    removeEventListenerSpy.mockRestore()
  })

  it('should clear the timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout')
    const { unmount } = renderHook(() => useIdleTimeout({ timeout: 1000 }))

    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
