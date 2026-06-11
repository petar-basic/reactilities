import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, render, act } from '@testing-library/react'
import { StrictMode } from 'react'
import { useAutoSave } from './index'

// Drives the hook through a real component so it can be mounted under an
// explicit <StrictMode> root. renderHook's `wrapper` option does NOT trigger
// StrictMode's dev-only mount->cleanup->remount double-invoke, but rendering
// <StrictMode> as the root element does — which is exactly what reproduces the
// spurious-save bug.
function AutoSaveProbe<T>(props: {
  data: T
  onSave: (data: T) => Promise<void> | void
  delay?: number
}) {
  const { status } = useAutoSave(props)
  return <span data-testid="status">{status}</span>
}

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should start with idle status', () => {
    const { result } = renderHook(() =>
      useAutoSave({ data: 'initial', onSave: vi.fn() })
    )
    expect(result.current.status).toBe('idle')
  })

  it('should start with null lastSavedAt', () => {
    const { result } = renderHook(() =>
      useAutoSave({ data: 'initial', onSave: vi.fn() })
    )
    expect(result.current.lastSavedAt).toBeNull()
  })

  it('should not call onSave on initial mount', () => {
    const onSave = vi.fn()
    renderHook(() => useAutoSave({ data: 'initial', onSave }))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('should set status to pending when data changes', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave: vi.fn() }),
      { initialProps: { data: 'initial' } }
    )

    rerender({ data: 'updated' })

    expect(result.current.status).toBe('pending')
  })

  it('should call onSave after the delay', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 1000 }),
      { initialProps: { data: 'initial' } }
    )

    rerender({ data: 'updated' })

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(onSave).toHaveBeenCalledWith('updated')
  })

  it('should set status to saved after successful save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 500 }),
      { initialProps: { data: 'initial' } }
    )

    rerender({ data: 'updated' })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.status).toBe('saved')
  })

  it('should set lastSavedAt after successful save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 500 }),
      { initialProps: { data: 'initial' } }
    )

    rerender({ data: 'updated' })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.lastSavedAt).toBeInstanceOf(Date)
  })

  it('should set status to error when onSave throws', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'))
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 500 }),
      { initialProps: { data: 'initial' } }
    )

    rerender({ data: 'updated' })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.status).toBe('error')
  })

  it('should reset the timer on rapid data changes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 1000 }),
      { initialProps: { data: 'initial' } }
    )

    rerender({ data: 'change1' })

    act(() => { vi.advanceTimersByTime(500) })

    rerender({ data: 'change2' })

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('change2')
  })

  it('should save immediately when save() is called', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 5000 }),
      { initialProps: { data: 'initial' } }
    )

    rerender({ data: 'updated' })

    await act(async () => {
      await result.current.save()
    })

    expect(onSave).toHaveBeenCalledWith('updated')
    expect(result.current.status).toBe('saved')
  })

  it('should not call onSave for unchanged initial data under StrictMode', () => {
    // StrictMode double-invokes effects on mount (setup -> cleanup -> setup).
    // The previous first-render-flag guard flipped its flag during the first
    // setup, so the second setup treated the unchanged initial data as a
    // change and scheduled a spurious save. Tracking the last-seen data keeps
    // the guard correct across the remount.
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <StrictMode>
        <AutoSaveProbe data="initial" onSave={onSave} delay={1000} />
      </StrictMode>
    )

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('should save a genuine change exactly once under StrictMode', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <StrictMode>
        <AutoSaveProbe data="initial" onSave={onSave} delay={1000} />
      </StrictMode>
    )

    rerender(
      <StrictMode>
        <AutoSaveProbe data="updated" onSave={onSave} delay={1000} />
      </StrictMode>
    )

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('updated')
  })

  it('should cancel a pending save when unmounted before the delay elapses', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender, unmount } = renderHook(
      ({ data }) => useAutoSave({ data, onSave, delay: 1000 }),
      { initialProps: { data: 'initial' } }
    )

    rerender({ data: 'updated' })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('should use default delay of 2000ms', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ data }) => useAutoSave({ data, onSave }),
      { initialProps: { data: 'initial' } }
    )

    rerender({ data: 'updated' })

    act(() => { vi.advanceTimersByTime(1999) })
    expect(onSave).not.toHaveBeenCalled()

    await act(async () => { vi.advanceTimersByTime(1) })
    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
