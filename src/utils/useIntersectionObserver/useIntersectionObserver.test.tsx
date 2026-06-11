import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import { useIntersectionObserver } from '../useIntersectionObserver'

// Capture the callback passed to the IntersectionObserver constructor
// so we can trigger intersection events manually in tests
let capturedCallback: ((entries: Partial<IntersectionObserverEntry>[]) => void) | null = null
let constructorCalls = 0
const mockObserve = vi.fn()
const mockUnobserve = vi.fn()
const mockDisconnect = vi.fn()

// Override the setup.ts mock implementation to capture the callback
beforeEach(() => {
  capturedCallback = null
  constructorCalls = 0
  mockObserve.mockClear()
  mockUnobserve.mockClear()
  mockDisconnect.mockClear()

  vi.mocked(window.IntersectionObserver).mockImplementation(class {
    constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
      constructorCalls += 1
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
  // Mutation-proof type usage (BUG 2): the generic produces a ref typed
  // `RefObject<HTMLDivElement | null>`, assignable straight to `<div ref={ref}>`
  // with NO cast. If the hook reverts to returning `RefObject<HTMLElement | null>`,
  // this assignment fails to type-check under React 19 types.
  const { ref, isIntersecting, entry } = useIntersectionObserver<HTMLDivElement>(options)
  return (
    <div
      ref={ref}
      data-testid="observed"
      data-intersecting={String(isIntersecting)}
      data-has-entry={String(entry !== null)}
    />
  )
}

// Re-render with a fresh inline threshold array every render to exercise BUG 1.
function InlineArrayComponent({ tick }: { tick: number }) {
  // `threshold: [0, 0.5, 1]` is a NEW array identity on every render. The hook
  // must normalize it so the observer is created once, not per render.
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    threshold: [0, 0.5, 1],
  })
  return (
    <div
      ref={ref}
      data-testid="observed"
      data-tick={String(tick)}
      data-intersecting={String(isIntersecting)}
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

  // Mutation-proof loop guard (BUG 1): an inline `threshold: [0, 0.5, 1]` has a
  // fresh array identity every render. The buggy code put that raw array in the
  // effect deps, so each render tore down and recreated the observer (and each
  // new observer fired its callback -> setEntry loop). The fix normalizes the
  // threshold into a stable key, so the observer must be constructed ONCE across
  // many re-renders. This fails on the original code.
  it('should construct the observer only once when threshold is an inline array across re-renders', () => {
    const { rerender } = render(<InlineArrayComponent tick={0} />)

    expect(constructorCalls).toBe(1)
    expect(mockObserve).toHaveBeenCalledTimes(1)

    // Several re-renders with the same (but new-identity) inline array.
    rerender(<InlineArrayComponent tick={1} />)
    rerender(<InlineArrayComponent tick={2} />)
    rerender(<InlineArrayComponent tick={3} />)

    // No churn: still a single observer, never re-created, never torn down.
    expect(constructorCalls).toBe(1)
    expect(mockObserve).toHaveBeenCalledTimes(1)
    expect(mockUnobserve).not.toHaveBeenCalled()
  })

  it('should not re-create the observer when an intersection event triggers a state update (no loop)', () => {
    render(<InlineArrayComponent tick={0} />)
    expect(constructorCalls).toBe(1)

    // A real intersection event updates state and re-renders the component; with
    // the inline array this previously caused an observer churn loop.
    act(() => capturedCallback?.([createEntry(true)]))

    expect(screen.getByTestId('observed').dataset.intersecting).toBe('true')
    expect(constructorCalls).toBe(1)
    expect(mockObserve).toHaveBeenCalledTimes(1)
  })

  // BUG 3: element mounts after the first render. With the object-ref API the
  // hook tracks ref assignment via state, so the observer attaches once the
  // element appears.
  it('should observe an element that mounts after the first render', () => {
    function LateMount({ show }: { show: boolean }) {
      const { ref } = useIntersectionObserver<HTMLDivElement>()
      return show ? <div ref={ref} data-testid="late" /> : <span data-testid="placeholder" />
    }

    const { rerender } = render(<LateMount show={false} />)
    // Nothing to observe yet.
    expect(mockObserve).not.toHaveBeenCalled()

    rerender(<LateMount show={true} />)
    // The element appeared after the first effect run; the observer attaches.
    expect(mockObserve).toHaveBeenCalledTimes(1)
    expect(mockObserve).toHaveBeenCalledWith(expect.any(HTMLElement))
  })
})
