import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import useEventListener from '../useEventListener'

describe('useEventListener', () => {
  let mockElement: HTMLElement
  let mockHandler: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockHandler = vi.fn()
    mockElement = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement
  })

  it('should add event listener to element', () => {
    renderHook(() => {
      const ref = useRef<HTMLElement>(mockElement)
      useEventListener(ref, 'click', mockHandler)
      return ref
    })

    expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined)
  })

  it('should add event listener with options', () => {
    const options = { passive: true, once: true }
    
    renderHook(() => {
      const ref = useRef<HTMLElement>(mockElement)
      useEventListener(ref, 'scroll', mockHandler, options)
      return ref
    })

    expect(mockElement.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), options)
  })

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(mockElement)
      useEventListener(ref, 'click', mockHandler)
      return ref
    })

    unmount()

    expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined)
  })

  it('should remove and re-add event listener when eventName changes', () => {
    const { rerender } = renderHook(
      ({ eventName }) => {
        const ref = useRef<HTMLElement>(mockElement)
        useEventListener(ref, eventName, mockHandler)
        return ref
      },
      { initialProps: { eventName: 'click' } }
    )

    expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined)

    rerender({ eventName: 'mouseover' })

    expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined)
    expect(mockElement.addEventListener).toHaveBeenCalledWith('mouseover', expect.any(Function), undefined)
  })

  it('should remove and re-add event listener when options change', () => {
    const { rerender } = renderHook(
      ({ options }) => {
        const ref = useRef<HTMLElement>(mockElement)
        useEventListener(ref, 'click', mockHandler, options)
        return ref
      },
      { initialProps: { options: undefined as AddEventListenerOptions | undefined } }
    )

    expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined)

    const newOptions = { passive: true }
    rerender({ options: newOptions })

    expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined)
    expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), newOptions)
  })

  it('should handle null ref', () => {
    renderHook(() => {
      const ref = useRef<HTMLElement | null>(null)
      useEventListener(ref as any, 'click', mockHandler)
      return ref
    })

    expect(mockElement.addEventListener).not.toHaveBeenCalled()
  })

  it('should handle element without addEventListener', () => {
    const elementWithoutListener = {} as HTMLElement

    renderHook(() => {
      const ref = useRef<HTMLElement>(elementWithoutListener)
      useEventListener(ref, 'click', mockHandler)
      return ref
    })

    // Should not throw error
    expect(true).toBe(true)
  })

  it('should not add event listener when ref current is initially null', () => {
    const ref = { current: null as HTMLElement | null }
    
    renderHook(() => {
      useEventListener(ref as any, 'click', mockHandler)
    })

    expect(mockElement.addEventListener).not.toHaveBeenCalled()
  })

  it('should handle direct element reference instead of ref', () => {
    renderHook(() => {
      // Cast to RefObject to test the fallback behavior
      const directElement = mockElement as any
      useEventListener(directElement, 'click', mockHandler)
    })

    expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined)
  })
})
