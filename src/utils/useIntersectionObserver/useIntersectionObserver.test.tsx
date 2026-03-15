import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import React from 'react'
import { useIntersectionObserver } from '../useIntersectionObserver'

// Capture the callback passed to the IntersectionObserver constructor
// so we can trigger intersection events manually in tests
let capturedCallback: ((entries: Partial<IntersectionObserverEntry>[]) => void) | null = null
const mockObserve = vi.fn()
const mockUnobserve = vi.fn()
const mockDisconnect = vi.fn()

// Override the setup.ts mock implementation to capture the callback
beforeEach(() => {
  capturedCallback = null
  mockObserve.mockClear()
  mockUnobserve.mockClear()
  mockDisconnect.mockClear()

  vi.mocked(window.IntersectionObserver).mockImplementation(class {
    constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
      capturedCallback = cb
    }
    observe = mockObserve
    unobserve = mockUnobserve
    disconnect = mockDisconnect
  } as any)
})

function createEntry(isIntersecting: boolean): IntersectionObserverEntry {
  return {
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    target: document.createElement('div'),
    boundingClientRect: new DOMRect(),
    intersectionRect: new DOMRect(),
    rootBounds: null,
    time: 0,
  } as unknown as IntersectionObserverEntry
}

interface TestProps {
  options?: Parameters<typeof useIntersectionObserver>[0]
}

function TestComponent({ options }: TestProps) {
  const { ref, isIntersecting, entry } = useIntersectionObserver(options)
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      data-testid="observed"
      data-intersecting={String(isIntersecting)}
      data-has-entry={String(entry !== null)}
    />
  )
}

describe('useIntersectionObserver', () => {
  it('should observe the element after mount', () => {
    render(<TestComponent />)
    expect(mockObserve).toHaveBeenCalledTimes(1)
    expect(mockObserve).toHaveBeenCalledWith(expect.any(HTMLElement))
  })

  it('should start with isIntersecting false and no entry', () => {
    render(<TestComponent />)
    const el = screen.getByTestId('observed')
    expect(el.dataset.intersecting).toBe('false')
    expect(el.dataset.hasEntry).toBe('false')
  })

  it('should update isIntersecting to true when element enters viewport', () => {
    render(<TestComponent />)

    act(() => {
      capturedCallback?.([createEntry(true)])
    })

    expect(screen.getByTestId('observed').dataset.intersecting).toBe('true')
  })

  it('should update isIntersecting to false when element leaves viewport', () => {
    render(<TestComponent />)

    act(() => capturedCallback?.([createEntry(true)]))
    expect(screen.getByTestId('observed').dataset.intersecting).toBe('true')

    act(() => capturedCallback?.([createEntry(false)]))
    expect(screen.getByTestId('observed').dataset.intersecting).toBe('false')
  })

  it('should populate entry after first intersection event', () => {
    render(<TestComponent />)

    act(() => capturedCallback?.([createEntry(true)]))

    expect(screen.getByTestId('observed').dataset.hasEntry).toBe('true')
  })

  it('should freeze state when freezeOnceVisible is true and element is visible', () => {
    render(<TestComponent options={{ freezeOnceVisible: true }} />)

    // Enter viewport
    act(() => capturedCallback?.([createEntry(true)]))
    expect(screen.getByTestId('observed').dataset.intersecting).toBe('true')

    // The observer should have been unobserved — the element is now "frozen"
    // (hook unobserves on re-run when frozen=true, preventing further callbacks)
    expect(mockUnobserve).toHaveBeenCalledTimes(1)

    // State stays true because no new observer updates it
    expect(screen.getByTestId('observed').dataset.intersecting).toBe('true')
  })

  it('should NOT freeze state when freezeOnceVisible is false (default)', () => {
    render(<TestComponent />)

    act(() => capturedCallback?.([createEntry(true)]))
    expect(screen.getByTestId('observed').dataset.intersecting).toBe('true')

    act(() => capturedCallback?.([createEntry(false)]))
    expect(screen.getByTestId('observed').dataset.intersecting).toBe('false')
  })

  it('should unobserve element on unmount', () => {
    const { unmount } = render(<TestComponent />)
    unmount()
    expect(mockUnobserve).toHaveBeenCalledTimes(1)
  })

  it('should create a new observer when options change', () => {
    const { rerender } = render(<TestComponent options={{ threshold: 0.1 }} />)
    expect(mockObserve).toHaveBeenCalledTimes(1)

    rerender(<TestComponent options={{ threshold: 0.5 }} />)

    // Old observer cleans up and new one is created
    expect(mockUnobserve).toHaveBeenCalledTimes(1)
    expect(mockObserve).toHaveBeenCalledTimes(2)
  })
})
