import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScrollTo } from './index'

describe('useScrollTo', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn()
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 5000,
      configurable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should scroll to top with smooth behavior by default', () => {
    const { result } = renderHook(() => useScrollTo())

    act(() => {
      result.current.scrollToTop()
    })

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('should scroll to top with custom behavior', () => {
    const { result } = renderHook(() => useScrollTo())

    act(() => {
      result.current.scrollToTop({ behavior: 'instant' })
    })

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })

  it('should scroll to bottom using document scrollHeight', () => {
    const { result } = renderHook(() => useScrollTo())

    act(() => {
      result.current.scrollToBottom()
    })

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    })
  })

  it('should scroll to exact coordinates', () => {
    const { result } = renderHook(() => useScrollTo())

    act(() => {
      result.current.scrollTo(100, 500)
    })

    expect(window.scrollTo).toHaveBeenCalledWith({ left: 100, top: 500, behavior: 'smooth' })
  })

  it('should scroll to exact coordinates with custom behavior', () => {
    const { result } = renderHook(() => useScrollTo())

    act(() => {
      result.current.scrollTo(0, 300, { behavior: 'instant' })
    })

    expect(window.scrollTo).toHaveBeenCalledWith({ left: 0, top: 300, behavior: 'instant' })
  })

  it('should scroll element into view', () => {
    const element = document.createElement('div')
    element.scrollIntoView = vi.fn()
    const { result } = renderHook(() => useScrollTo())

    act(() => {
      result.current.scrollToElement(element)
    })

    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    })
  })

  it('should scroll element into view with custom options', () => {
    const element = document.createElement('div')
    element.scrollIntoView = vi.fn()
    const { result } = renderHook(() => useScrollTo())

    act(() => {
      result.current.scrollToElement(element, { behavior: 'instant', block: 'center' })
    })

    expect(element.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'instant',
      block: 'center',
      inline: 'nearest'
    })
  })

  it('should handle null element in scrollToElement without throwing', () => {
    const { result } = renderHook(() => useScrollTo())

    expect(() => {
      act(() => {
        result.current.scrollToElement(null)
      })
    }).not.toThrow()
  })

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useScrollTo())
    const { scrollToTop, scrollToBottom, scrollToElement, scrollTo } = result.current

    rerender()

    expect(result.current.scrollToTop).toBe(scrollToTop)
    expect(result.current.scrollToBottom).toBe(scrollToBottom)
    expect(result.current.scrollToElement).toBe(scrollToElement)
    expect(result.current.scrollTo).toBe(scrollTo)
  })
})
