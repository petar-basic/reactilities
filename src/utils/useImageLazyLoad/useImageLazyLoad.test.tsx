import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import React from 'react'
import { useImageLazyLoad } from './index'

let capturedCallback: ((entries: Partial<IntersectionObserverEntry>[]) => void) | null = null
const disconnectMock = vi.fn()
const observeMock = vi.fn()

// Reuse the IntersectionObserver already defined in setup.ts via mockImplementation
beforeEach(() => {
  capturedCallback = null
  disconnectMock.mockClear()
  observeMock.mockClear()

  vi.mocked(window.IntersectionObserver).mockImplementation(class {
    constructor(cb: (entries: Partial<IntersectionObserverEntry>[]) => void) {
      capturedCallback = cb
    }
    observe = observeMock
    disconnect = disconnectMock
    unobserve = vi.fn()
  } as unknown as typeof IntersectionObserver)

  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    _src = ''

    set src(value: string) {
      this._src = value
    }

    get src() {
      return this._src
    }
  })
})

function TestImage({ src, placeholder }: { src: string; placeholder?: string }) {
  const { ref, src: currentSrc, status, isLoaded } = useImageLazyLoad(src, { placeholder })
  return (
    <img
      ref={ref}
      src={currentSrc}
      alt="test"
      data-testid="lazy-img"
      data-status={status}
      data-loaded={String(isLoaded)}
    />
  )
}

describe('useImageLazyLoad', () => {
  it('should show placeholder src before image loads', () => {
    render(<TestImage src="/real.jpg" placeholder="/placeholder.jpg" />)
    expect(screen.getByTestId('lazy-img')).toHaveAttribute('src', '/placeholder.jpg')
  })

  it('should show empty src with no placeholder', () => {
    render(<TestImage src="/real.jpg" />)
    // React 18 omits src attribute for empty string — verify no real src is shown yet
    const el = screen.getByTestId('lazy-img')
    const src = el.getAttribute('src')
    expect(src === '' || src === null).toBe(true)
  })

  it('should have idle status initially', () => {
    render(<TestImage src="/real.jpg" />)
    expect(screen.getByTestId('lazy-img').dataset.status).toBe('idle')
  })

  it('should observe the image element', () => {
    render(<TestImage src="/real.jpg" />)
    expect(observeMock).toHaveBeenCalled()
  })

  it('should set status to loading when element becomes visible', () => {
    render(<TestImage src="/real.jpg" />)

    act(() => {
      capturedCallback?.([{ isIntersecting: true, target: screen.getByTestId('lazy-img') }])
    })

    expect(screen.getByTestId('lazy-img').dataset.status).toBe('loading')
  })

  it('should not trigger loading when not intersecting', () => {
    render(<TestImage src="/real.jpg" />)

    act(() => {
      capturedCallback?.([{ isIntersecting: false }])
    })

    expect(screen.getByTestId('lazy-img').dataset.status).toBe('idle')
  })

  it('should disconnect observer after triggering load', () => {
    render(<TestImage src="/real.jpg" />)

    act(() => {
      capturedCallback?.([{ isIntersecting: true }])
    })

    expect(disconnectMock).toHaveBeenCalled()
  })

  it('should set isLoaded to false initially', () => {
    render(<TestImage src="/real.jpg" />)
    expect(screen.getByTestId('lazy-img').dataset.loaded).toBe('false')
  })

  it('should disconnect observer on unmount', () => {
    const { unmount } = render(<TestImage src="/real.jpg" />)
    unmount()
    expect(disconnectMock).toHaveBeenCalled()
  })
})
