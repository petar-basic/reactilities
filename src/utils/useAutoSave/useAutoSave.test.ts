import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from './index'

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
