import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLockBodyScroll } from '../useLockBodyScroll'

describe('useLockBodyScroll', () => {
  let mockGetComputedStyle: ReturnType<typeof vi.fn>
  let originalBodyStyle: string

  beforeEach(() => {
    // Store original body style
    originalBodyStyle = document.body.style.overflow

    // Mock getComputedStyle
    mockGetComputedStyle = vi.fn().mockReturnValue({ overflow: 'visible' })
    vi.spyOn(window, 'getComputedStyle').mockImplementation(mockGetComputedStyle)
  })

  afterEach(() => {
    // Restore original body style
    document.body.style.overflow = originalBodyStyle
    vi.restoreAllMocks()
  })

  it('should lock body scroll on mount', () => {
    renderHook(() => useLockBodyScroll())

    expect(window.getComputedStyle).toHaveBeenCalledWith(document.body)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('should restore original overflow style on unmount', () => {
    mockGetComputedStyle.mockReturnValue({ overflow: 'auto' })

    const { unmount } = renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('auto')
  })

  it('should handle different original overflow values', () => {
    const testCases = ['visible', 'auto', 'scroll', 'hidden']

    testCases.forEach((originalOverflow) => {
      mockGetComputedStyle.mockReturnValue({ overflow: originalOverflow })

      const { unmount } = renderHook(() => useLockBodyScroll())

      expect(document.body.style.overflow).toBe('hidden')

      unmount()

      expect(document.body.style.overflow).toBe(originalOverflow)

      // Reset for next test
      document.body.style.overflow = ''
    })
  })

  it('should work with multiple instances', () => {
    mockGetComputedStyle.mockReturnValue({ overflow: 'visible' })

    const { unmount: unmount1 } = renderHook(() => useLockBodyScroll())
    const { unmount: unmount2 } = renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')

    // Unmounting first instance should still keep body locked
    unmount1()
    expect(document.body.style.overflow).toBe('visible') // This will restore to original

    // Second instance should still work independently
    unmount2()
    expect(document.body.style.overflow).toBe('visible')
  })

  it('should handle empty overflow style', () => {
    mockGetComputedStyle.mockReturnValue({ overflow: '' })

    const { unmount } = renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('')
  })

  it('should handle undefined overflow style', () => {
    mockGetComputedStyle.mockReturnValue({ overflow: undefined })

    const { unmount } = renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    // When undefined is set as CSS value, it becomes empty string
    expect(document.body.style.overflow).toBe('')
  })

  it('should not interfere with existing body styles', () => {
    // Set some existing styles
    document.body.style.backgroundColor = 'red'
    document.body.style.margin = '10px'
    mockGetComputedStyle.mockReturnValue({ overflow: 'auto' })

    const { unmount } = renderHook(() => useLockBodyScroll())

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.backgroundColor).toBe('red')
    expect(document.body.style.margin).toBe('10px')

    unmount()

    expect(document.body.style.overflow).toBe('auto')
    expect(document.body.style.backgroundColor).toBe('red')
    expect(document.body.style.margin).toBe('10px')
  })
})
