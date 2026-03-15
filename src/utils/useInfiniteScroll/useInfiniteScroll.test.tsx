import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import React, { useState } from 'react'
import { useInfiniteScroll } from '../useInfiniteScroll'

let capturedCallback: ((entries: Partial<IntersectionObserverEntry>[]) => void) | null = null
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

beforeEach(() => {
  capturedCallback = null
  mockObserve.mockClear()
  mockDisconnect.mockClear()

  vi.mocked(window.IntersectionObserver).mockImplementation(class {
    constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
      capturedCallback = cb
    }
    observe = mockObserve
    unobserve = vi.fn()
    disconnect = mockDisconnect
  } as any)
})

function intersect(isIntersecting: boolean) {
  capturedCallback?.([{ isIntersecting } as IntersectionObserverEntry])
}

interface TestProps {
  onLoadMore?: () => void | Promise<void>
  hasMore?: boolean
  isLoading?: boolean
}

function TestComponent({ onLoadMore = vi.fn(), hasMore = true, isLoading }: TestProps) {
  const { loaderRef, isLoading: loading } = useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
  })
  return (
    <>
      <div data-testid="loader" ref={loaderRef as React.RefObject<HTMLDivElement>} />
      <span data-testid="loading">{String(loading)}</span>
    </>
  )
}

describe('useInfiniteScroll', () => {
  it('should call onLoadMore when loader intersects', () => {
    const onLoadMore = vi.fn()
    render(<TestComponent onLoadMore={onLoadMore} />)

    act(() => intersect(true))

    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })

  it('should not call onLoadMore when hasMore is false', () => {
    const onLoadMore = vi.fn()
    render(<TestComponent onLoadMore={onLoadMore} hasMore={false} />)

    act(() => intersect(true))

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('should not call onLoadMore when entry is not intersecting', () => {
    const onLoadMore = vi.fn()
    render(<TestComponent onLoadMore={onLoadMore} />)

    act(() => intersect(false))

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('should not call onLoadMore when externalLoading is true', () => {
    const onLoadMore = vi.fn()
    render(<TestComponent onLoadMore={onLoadMore} isLoading={true} />)

    act(() => intersect(true))

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('should set isLoading true while async onLoadMore resolves', async () => {
    let resolve!: () => void
    const onLoadMore = vi.fn(
      () => new Promise<void>((r) => { resolve = r })
    )

    render(<TestComponent onLoadMore={onLoadMore} />)

    act(() => intersect(true))

    expect(screen.getByTestId('loading').textContent).toBe('true')

    await act(async () => { resolve() })

    expect(screen.getByTestId('loading').textContent).toBe('false')
  })

  it('should observe the loader element on mount', () => {
    render(<TestComponent />)
    expect(mockObserve).toHaveBeenCalledWith(expect.any(HTMLElement))
  })

  it('should disconnect observer on unmount', () => {
    const { unmount } = render(<TestComponent />)
    unmount()
    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  it('should always call latest onLoadMore reference', () => {
    const first = vi.fn()
    const second = vi.fn()

    function Wrapper() {
      const [fn, setFn] = useState(() => first)
      return (
        <>
          <TestComponent onLoadMore={fn} />
          <button onClick={() => setFn(() => second)}>swap</button>
        </>
      )
    }

    const { getByText } = render(<Wrapper />)

    act(() => getByText('swap').click())
    act(() => intersect(true))

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
