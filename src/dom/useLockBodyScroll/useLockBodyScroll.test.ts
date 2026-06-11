import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { StrictMode } from 'react'
import { renderHook } from '@testing-library/react'
import { useLockBodyScroll } from '../useLockBodyScroll'

describe('useLockBodyScroll', () => {
  let originalBodyStyle: string

  beforeEach(() => {
    // Store original body style and start each test from a clean inline value.
    originalBodyStyle = document.body.style.overflow
    document.body.style.overflow = ''
  })

  afterEach(() => {
    // Restore original body style for isolation between tests.
    document.body.style.overflow = originalBodyStyle
  })

  it('should lock body scroll on mount', () => {
    renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should restore original inline overflow style on unmount', () => {
    document.body.style.overflow = 'auto'

    const { unmount } = renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('auto')
  })

  it('should handle different original inline overflow values', () => {
    const testCases = ['visible', 'auto', 'scroll', 'hidden']

    testCases.forEach((originalOverflow) => {
      document.body.style.overflow = originalOverflow

      const { unmount } = renderHook(() => useLockBodyScroll())

      expect(document.body.style.overflow).toBe('hidden')

      unmount()

      expect(document.body.style.overflow).toBe(originalOverflow)

      // Reset for next test
      document.body.style.overflow = ''
    })
  })

  // MUTATION-PROOF: nested/stacked locks must be reference-counted.
  // Fails on the old code because it restored a per-instance computed value
  // regardless of whether other locks were still active.
  it('keeps body locked when the FIRST of two instances unmounts, restores only when the LAST unmounts', () => {
    // No inline overflow set -> original is ''.
    const { unmount: unmount1 } = renderHook(() => useLockBodyScroll())
    const { unmount: unmount2 } = renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')

    // Unmounting the first instance must NOT unlock: the second is still open.
    unmount1()
    expect(document.body.style.overflow).toBe('hidden')

    // Only when the last instance unmounts is the original value restored.
    unmount2()
    expect(document.body.style.overflow).toBe('')
  })

  // MUTATION-PROOF: original inline value restored exactly, even with stacking.
  // With a non-empty original ('scroll'), closing the FIRST lock while the
  // second is still open must keep the body 'hidden'. The old per-instance
  // code restored instance 1's captured 'scroll', unlocking the page behind
  // the still-open second overlay.
  it('restores the exact original inline overflow ("scroll") only after the last stacked lock releases', () => {
    document.body.style.overflow = 'scroll'

    const { unmount: unmount1 } = renderHook(() => useLockBodyScroll())
    const { unmount: unmount2 } = renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')

    // Close the FIRST lock first: body must stay locked (second still open).
    unmount1()
    expect(document.body.style.overflow).toBe('hidden')

    // Last lock releases -> exact original 'scroll' restored.
    unmount2()
    expect(document.body.style.overflow).toBe('scroll')
  })

  // MUTATION-PROOF: when nothing was set originally, after the last lock the
  // inline value must be ''. Single-instance can't discriminate under jsdom
  // (computed mirrors inline), so this stacks and closes the FIRST lock first:
  // the old per-instance code restores instance 1's captured '' while the
  // second overlay is still open, unlocking the page behind it. Then after
  // both close, the value must be exactly ''.
  it('restores to empty inline overflow when nothing was set originally', () => {
    expect(document.body.style.overflow).toBe('')

    const { unmount: unmount1 } = renderHook(() => useLockBodyScroll())
    const { unmount: unmount2 } = renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')

    // Close the FIRST lock first: body must stay locked (second still open).
    unmount1()
    expect(document.body.style.overflow).toBe('hidden')

    // Last lock releases -> exact original '' restored.
    unmount2()
    expect(document.body.style.overflow).toBe('')
  })

  it('should not interfere with existing body styles', () => {
    // Set some existing styles
    document.body.style.backgroundColor = 'red'
    document.body.style.margin = '10px'
    document.body.style.overflow = 'auto'

    const { unmount } = renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.backgroundColor).toBe('red')
    expect(document.body.style.margin).toBe('10px')

    unmount()

    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.backgroundColor).toBe('red')
    expect(document.body.style.margin).toBe('10px')

    // cleanup the extra styles
    document.body.style.backgroundColor = ''
    document.body.style.margin = ''
  })

  // StrictMode double-invokes effects in dev (mount/unmount/mount). The
  // reference count must stay balanced and the page must end up locked, then
  // fully restored after the real unmount.
  it('stays balanced and correct under StrictMode double-invoke', () => {
    document.body.style.overflow = 'auto'

    const { unmount } = renderHook(() => useLockBodyScroll(), {
      wrapper: StrictMode,
    })

    // After the dev mount/unmount/mount cycle the lock must be applied.
    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    // Count balanced back to 0 -> original restored exactly.
    expect(document.body.style.overflow).toBe('auto')
  })
})
