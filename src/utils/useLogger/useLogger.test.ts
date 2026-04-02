import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLogger } from './index'

describe('useLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should log Mounted on first render', () => {
    renderHook(() => useLogger('TestComponent', { value: 1 }))

    expect(console.log).toHaveBeenCalledWith(
      '[TestComponent] Mounted',
      { value: 1 }
    )
  })

  it('should log Updated with changed props on re-render', () => {
    const { rerender } = renderHook(
      ({ props }) => useLogger('TestComponent', props),
      { initialProps: { props: { value: 1, name: 'Alice' } } }
    )

    rerender({ props: { value: 2, name: 'Alice' } })

    expect(console.log).toHaveBeenCalledWith(
      '[TestComponent] Updated',
      { value: 2, name: 'Alice' },
      '— changed:',
      { value: 2 }
    )
  })

  it('should log Unmounted when component unmounts', () => {
    const { unmount } = renderHook(() => useLogger('TestComponent', {}))
    unmount()

    expect(console.log).toHaveBeenCalledWith('[TestComponent] Unmounted')
  })

  it('should include component name in all log messages', () => {
    const { rerender, unmount } = renderHook(
      ({ p }) => useLogger('MyWidget', p),
      { initialProps: { p: { x: 1 } } }
    )

    rerender({ p: { x: 2 } })
    unmount()

    const calls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    expect(calls.every(call => (call[0] as string).includes('MyWidget'))).toBe(true)
  })

  it('should log empty changed object when no props changed', () => {
    const props = { value: 42 }

    const { rerender } = renderHook(
      ({ p }) => useLogger('TestComponent', p),
      { initialProps: { p: props } }
    )

    // Re-render with the exact same object reference
    rerender({ p: props })

    const updateCall = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .find(call => (call[0] as string).includes('Updated'))

    expect(updateCall).toBeDefined()
    expect(updateCall?.[3]).toEqual({})
  })

  it('should detect newly added keys as changed', () => {
    const { rerender } = renderHook(
      ({ p }) => useLogger('C', p),
      { initialProps: { p: { a: 1 } as Record<string, unknown> } }
    )

    rerender({ p: { a: 1, b: 2 } })

    const updateCall = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .find(call => (call[0] as string).includes('Updated'))

    expect(updateCall?.[3]).toEqual({ b: 2 })
  })

  it('should only call Mounted once across multiple re-renders', () => {
    const { rerender } = renderHook(
      ({ v }) => useLogger('C', { v }),
      { initialProps: { v: 1 } }
    )

    rerender({ v: 2 })
    rerender({ v: 3 })

    const mountCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls
      .filter(call => (call[0] as string).includes('Mounted'))

    expect(mountCalls).toHaveLength(1)
  })
})
