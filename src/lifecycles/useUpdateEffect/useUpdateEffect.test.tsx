import { StrictMode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUpdateEffect } from '../useUpdateEffect'

describe('useUpdateEffect', () => {
  it('should not run effect on initial mount', () => {
    const effect = vi.fn()
    renderHook(() => useUpdateEffect(effect, []))
    expect(effect).not.toHaveBeenCalled()
  })

  it('should run effect when dependency changes', () => {
    const effect = vi.fn()
    const { rerender } = renderHook(
      ({ value }) => useUpdateEffect(effect, [value]),
      { initialProps: { value: 1 } }
    )

    expect(effect).not.toHaveBeenCalled()

    rerender({ value: 2 })
    expect(effect).toHaveBeenCalledTimes(1)
  })

  it('should run again on subsequent dependency changes', () => {
    const effect = vi.fn()
    const { rerender } = renderHook(
      ({ value }) => useUpdateEffect(effect, [value]),
      { initialProps: { value: 0 } }
    )

    rerender({ value: 1 })
    rerender({ value: 2 })

    expect(effect).toHaveBeenCalledTimes(2)
  })

  it('should not re-run when dependency stays the same', () => {
    const effect = vi.fn()
    const { rerender } = renderHook(
      ({ value }) => useUpdateEffect(effect, [value]),
      { initialProps: { value: 'hello' } }
    )

    rerender({ value: 'hello' })

    expect(effect).not.toHaveBeenCalled()
  })

  it('should run cleanup returned from effect', () => {
    const cleanup = vi.fn()
    const { rerender, unmount } = renderHook(
      ({ value }) => useUpdateEffect(() => cleanup, [value]),
      { initialProps: { value: 1 } }
    )

    rerender({ value: 2 })
    unmount()

    expect(cleanup).toHaveBeenCalled()
  })

  // Mutation-proof regression test for the StrictMode mount bug.
  // In React 18+ StrictMode (dev), mount effects run effect → cleanup → effect.
  // The previous implementation flipped its "mounted" flag on the first pass
  // and never reset it (its cleanup was undefined), so the second pass fired
  // `effect()` on initial mount — the exact behavior this hook must prevent.
  // StrictMode is simulated by wrapping the hook in <StrictMode>, which makes
  // React double-invoke effects with a cleanup in between, matching dev mount.
  it('should not run effect on initial mount under StrictMode', () => {
    const effect = vi.fn()
    renderHook(() => useUpdateEffect(effect, []), { wrapper: StrictMode })
    expect(effect).not.toHaveBeenCalled()
  })

  it('should run effect on dependency change under StrictMode', () => {
    const effect = vi.fn()
    const { rerender } = renderHook(
      ({ value }) => useUpdateEffect(effect, [value]),
      { initialProps: { value: 1 }, wrapper: StrictMode }
    )

    expect(effect).not.toHaveBeenCalled()

    rerender({ value: 2 })
    expect(effect).toHaveBeenCalledTimes(1)
  })
})
