import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWhyDidYouRender } from './index'

describe('useWhyDidYouRender', () => {
  beforeEach(() => {
    vi.spyOn(console, 'group').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not log anything on the first render', () => {
    renderHook(() => useWhyDidYouRender('Test', { value: 1 }))

    expect(console.group).not.toHaveBeenCalled()
    expect(console.log).not.toHaveBeenCalled()
  })

  it('should not log when nothing changed between renders', () => {
    const { rerender } = renderHook(
      ({ v }) => useWhyDidYouRender('Test', { v }),
      { initialProps: { v: 1 } }
    )

    rerender({ v: 1 })

    expect(console.group).not.toHaveBeenCalled()
  })

  it('should log when a value changes', () => {
    const { rerender } = renderHook(
      ({ v }) => useWhyDidYouRender('MyComponent', { v }),
      { initialProps: { v: 1 } }
    )

    rerender({ v: 2 })

    expect(console.group).toHaveBeenCalledWith(
      expect.stringContaining('MyComponent')
    )
  })

  it('should log the previous and current value for each changed key', () => {
    const { rerender } = renderHook(
      ({ v }) => useWhyDidYouRender('Test', { v }),
      { initialProps: { v: 'before' } }
    )

    rerender({ v: 'after' })

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('v'),
      'before',
      '→',
      'after'
    )
  })

  it('should close the console group after logging', () => {
    const { rerender } = renderHook(
      ({ v }) => useWhyDidYouRender('Test', { v }),
      { initialProps: { v: 1 } }
    )

    rerender({ v: 2 })

    expect(console.groupEnd).toHaveBeenCalled()
  })

  it('should detect multiple changed values', () => {
    const { rerender } = renderHook(
      ({ a, b }) => useWhyDidYouRender('Test', { a, b }),
      { initialProps: { a: 1, b: 'x' } }
    )

    rerender({ a: 2, b: 'y' })

    const logCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    const keys = logCalls.map(call => call[0])
    expect(keys.some((k: string) => k.includes('a'))).toBe(true)
    expect(keys.some((k: string) => k.includes('b'))).toBe(true)
  })

  it('should detect newly added keys as changed', () => {
    const { rerender } = renderHook(
      ({ p }) => useWhyDidYouRender('Test', p),
      { initialProps: { p: { a: 1 } as Record<string, unknown> } }
    )

    rerender({ p: { a: 1, b: 2 } })

    const logCalls = (console.log as ReturnType<typeof vi.fn>).mock.calls
    expect(logCalls.some(call => (call[0] as string).includes('b'))).toBe(true)
  })

  it('should only log once per render even with multiple changed keys', () => {
    const { rerender } = renderHook(
      ({ a, b, c }) => useWhyDidYouRender('Test', { a, b, c }),
      { initialProps: { a: 1, b: 2, c: 3 } }
    )

    rerender({ a: 10, b: 20, c: 30 })

    expect(console.group).toHaveBeenCalledTimes(1)
    expect(console.groupEnd).toHaveBeenCalledTimes(1)
  })
})
