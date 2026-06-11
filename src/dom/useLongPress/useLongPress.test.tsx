import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLongPress } from '../useLongPress'
import React from 'react'

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should call callback after default threshold (500ms)', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useLongPress(callback))

    const event = { clientX: 0, clientY: 0 } as React.PointerEvent
    act(() => result.current.onPointerDown(event))
    act(() => vi.advanceTimersByTime(500))

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should not call callback before threshold', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useLongPress(callback, { threshold: 1000 }))

    const event = { clientX: 0, clientY: 0 } as React.PointerEvent
    act(() => result.current.onPointerDown(event))
    act(() => vi.advanceTimersByTime(999))

    expect(callback).not.toHaveBeenCalled()
  })

  it('should cancel on pointerUp before threshold', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useLongPress(callback))

    const event = { clientX: 0, clientY: 0 } as React.PointerEvent
    act(() => result.current.onPointerDown(event))
    act(() => vi.advanceTimersByTime(300))
    act(() => result.current.onPointerUp(event))
    act(() => vi.advanceTimersByTime(300))

    expect(callback).not.toHaveBeenCalled()
  })

  it('should cancel on pointerLeave before threshold', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useLongPress(callback))

    const event = { clientX: 0, clientY: 0 } as React.PointerEvent
    act(() => result.current.onPointerDown(event))
    act(() => vi.advanceTimersByTime(300))
    act(() => result.current.onPointerLeave(event))
    act(() => vi.advanceTimersByTime(300))

    expect(callback).not.toHaveBeenCalled()
  })

  it('should call onStart when press begins', () => {
    const onStart = vi.fn()
    const { result } = renderHook(() => useLongPress(vi.fn(), { onStart }))

    const event = { clientX: 0 } as React.PointerEvent
    act(() => result.current.onPointerDown(event))

    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel when press is released early', () => {
    const onCancel = vi.fn()
    const { result } = renderHook(() => useLongPress(vi.fn(), { onCancel }))

    const event = { clientX: 0 } as React.PointerEvent
    act(() => result.current.onPointerDown(event))
    act(() => result.current.onPointerUp(event))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should use custom threshold', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useLongPress(callback, { threshold: 2000 }))

    const event = {} as React.PointerEvent
    act(() => result.current.onPointerDown(event))
    act(() => vi.advanceTimersByTime(1999))
    expect(callback).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should return handlers with correct shape', () => {
    const { result } = renderHook(() => useLongPress(vi.fn()))
    expect(typeof result.current.onPointerDown).toBe('function')
    expect(typeof result.current.onPointerUp).toBe('function')
    expect(typeof result.current.onPointerLeave).toBe('function')
  })

  // BUG 1: pending timer must be cleared on unmount. Without the cleanup
  // effect, the timeout still fires after the component unmounts, invoking the
  // callback with a stale event on an unmounted component.
  it('should not call callback when unmounted before threshold', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useLongPress(callback))

    const event = { clientX: 0, clientY: 0 } as React.PointerEvent
    act(() => result.current.onPointerDown(event))
    act(() => vi.advanceTimersByTime(300))

    unmount()

    act(() => vi.advanceTimersByTime(300))

    expect(callback).not.toHaveBeenCalled()
  })

  // BUG 2: a second pointerdown must not orphan the first timer. Two
  // pointerdowns (e.g. a two-finger touch) followed by a single release should
  // leave no live timer. Without clearing the pending timer in `start`, the
  // first timeout id leaks and fires after release.
  it('should not fire callback after two pointerdowns then a single release', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useLongPress(callback))

    const event = { clientX: 0, clientY: 0 } as React.PointerEvent
    act(() => result.current.onPointerDown(event))
    act(() => vi.advanceTimersByTime(100))
    act(() => result.current.onPointerDown(event))
    act(() => result.current.onPointerUp(event))

    act(() => vi.advanceTimersByTime(1000))

    expect(callback).not.toHaveBeenCalled()
  })
})
