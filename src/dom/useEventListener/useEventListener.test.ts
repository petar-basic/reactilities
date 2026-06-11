import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { useEventListener } from '../useEventListener'

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

  // --- Mutation-proof behavior (BUG 1 & BUG 2) ---------------------------------

  it('attaches listener to a late-mounted ref once the element appears', () => {
    // ref.current is null at mount (e.g. {show && <div ref={ref} />} with show=false),
    // then the element appears on a later render. RefObject identity is stable, so the
    // old [target, ...] deps would NEVER re-run the effect → listener never attached.
    const ref = { current: null as HTMLElement | null }

    const { rerender } = renderHook(() => {
      useEventListener(ref as any, 'click', mockHandler)
    })

    expect(mockElement.addEventListener).not.toHaveBeenCalled()

    // The element mounts; a state flip triggers this re-render.
    ref.current = mockElement
    rerender()

    expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined)

    // And the attached listener actually fires the handler.
    const listener = (mockElement.addEventListener as any).mock.calls[0][1]
    listener(new Event('click'))
    expect(mockHandler).toHaveBeenCalledTimes(1)
  })

  it('follows the element when the ref is replaced across renders', () => {
    const firstEl = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement
    const secondEl = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLElement

    const ref = { current: firstEl as HTMLElement | null }

    const { rerender } = renderHook(() => {
      useEventListener(ref as any, 'click', mockHandler)
    })

    expect(firstEl.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined)
    const firstListener = (firstEl.addEventListener as any).mock.calls[0][1]

    // Element gets replaced with a brand new node.
    ref.current = secondEl
    rerender()

    // Detach from the old node (exact handler), attach to the new one.
    expect(firstEl.removeEventListener).toHaveBeenCalledWith('click', firstListener, undefined)
    expect(secondEl.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), undefined)
  })

  it('fires { once: true } exactly once with an inline options object across renders + dispatches', () => {
    // Real DOM node so we can dispatch real events and trust { once: true } semantics.
    const realEl = document.createElement('div')
    const ref = { current: realEl as HTMLElement | null }
    const handler = vi.fn()

    const { rerender } = renderHook(
      ({ n }) => {
        // INLINE options object: a new identity every render. Old deps included the
        // object → re-register every render → a FRESH once-listener after each render →
        // the handler fires again on each subsequent dispatch. We interleave dispatches
        // with re-renders so a re-registering impl is exposed: after the first dispatch
        // consumes the once-listener, a broken impl re-registers a new one on the next
        // render, and the second dispatch fires the handler a second time.
        useEventListener(ref as any, 'click', handler, { once: true })
        return n
      },
      { initialProps: { n: 0 } }
    )

    // First dispatch consumes the once-listener.
    realEl.dispatchEvent(new Event('click'))
    expect(handler).toHaveBeenCalledTimes(1)

    // Re-render with a fresh inline options object. A correct impl keeps the (already
    // spent) once-listener; a churning impl re-registers a live one.
    rerender({ n: 1 })
    realEl.dispatchEvent(new Event('click'))

    rerender({ n: 2 })
    realEl.dispatchEvent(new Event('click'))

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not re-register when an equivalent inline options object is passed each render', () => {
    const { rerender } = renderHook(
      ({ n }) => {
        const ref = useRef<HTMLElement>(mockElement)
        useEventListener(ref, 'click', mockHandler, { passive: true })
        return n
      },
      { initialProps: { n: 0 } }
    )

    expect(mockElement.addEventListener).toHaveBeenCalledTimes(1)

    rerender({ n: 1 })
    rerender({ n: 2 })

    // Equivalent options primitives → no churn.
    expect(mockElement.addEventListener).toHaveBeenCalledTimes(1)
    expect(mockElement.removeEventListener).not.toHaveBeenCalled()
  })

  it('supports window and document targets at runtime', () => {
    const winAdd = vi.spyOn(window, 'addEventListener')
    const docAdd = vi.spyOn(document, 'addEventListener')

    renderHook(() => {
      useEventListener(window, 'resize', mockHandler)
      useEventListener(document, 'keydown', mockHandler)
    })

    expect(winAdd).toHaveBeenCalledWith('resize', expect.any(Function), undefined)
    expect(docAdd).toHaveBeenCalledWith('keydown', expect.any(Function), undefined)

    winAdd.mockRestore()
    docAdd.mockRestore()
  })
})
