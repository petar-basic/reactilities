import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act, screen } from '@testing-library/react'
import React from 'react'
import { useImageLazyLoad } from './index'

let capturedCallback: ((entries: Partial<IntersectionObserverEntry>[]) => void) | null = null
const disconnectMock = vi.fn()
const observeMock = vi.fn()

// Captures the most recently constructed Image instance so tests can drive its
// onload/onerror lifecycle deterministically.
let lastImage: { _src: string; onload: (() => void) | null; onerror: (() => void) | null } | null =
  null

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

  lastImage = null
  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    _src = ''

    constructor() {
      lastImage = this as unknown as typeof lastImage
    }

    set src(value: string) {
      this._src = value
    }

    get src() {
      return this._src
    }
  })
})

// Drive the observer + Image to fully load the most recent target.
function triggerLoad(target?: Element) {
  act(() => {
    capturedCallback?.([{ isIntersecting: true, target }])
  })
  act(() => {
    lastImage?.onload?.()
  })
}

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

  it('should set src to the real URL and status to loaded once the image loads', () => {
    render(<TestImage src="/real.jpg" placeholder="/placeholder.jpg" />)

    triggerLoad()

    const el = screen.getByTestId('lazy-img')
    expect(el).toHaveAttribute('src', '/real.jpg')
    expect(el.dataset.status).toBe('loaded')
    expect(el.dataset.loaded).toBe('true')
  })

  it('should set status to error when the image fails to load', () => {
    render(<TestImage src="/real.jpg" placeholder="/placeholder.jpg" />)

    act(() => {
      capturedCallback?.([{ isIntersecting: true }])
    })
    act(() => {
      lastImage?.onerror?.()
    })

    const el = screen.getByTestId('lazy-img')
    expect(el.dataset.status).toBe('error')
    // src stays on the placeholder on error
    expect(el).toHaveAttribute('src', '/placeholder.jpg')
  })

  // BUG 1: state must reset when imageSrc changes.
  it('should reset src to placeholder and status to idle when imageSrc changes', () => {
    const { rerender } = render(<TestImage src="/real.jpg" placeholder="/placeholder.jpg" />)

    // Fully load the first image.
    triggerLoad()
    let el = screen.getByTestId('lazy-img')
    expect(el).toHaveAttribute('src', '/real.jpg')
    expect(el.dataset.status).toBe('loaded')

    // Change the source — the old loaded image must NOT linger.
    rerender(<TestImage src="/new.jpg" placeholder="/placeholder.jpg" />)
    el = screen.getByTestId('lazy-img')
    expect(el).toHaveAttribute('src', '/placeholder.jpg')
    expect(el.dataset.status).toBe('idle')
    expect(el.dataset.loaded).toBe('false')
  })

  it('should load the new image after imageSrc changes', () => {
    const { rerender } = render(<TestImage src="/real.jpg" placeholder="/placeholder.jpg" />)
    triggerLoad()

    rerender(<TestImage src="/new.jpg" placeholder="/placeholder.jpg" />)
    // The re-run observer must fire for the new source.
    triggerLoad()

    const el = screen.getByTestId('lazy-img')
    expect(el).toHaveAttribute('src', '/new.jpg')
    expect(el.dataset.status).toBe('loaded')
  })

  // BUG 2: a target that mounts after the first effect run must still be observed.
  function LateMountImage({ src }: { src: string }) {
    const { ref, src: currentSrc, status } = useImageLazyLoad(src)
    const [mounted, setMounted] = React.useState(false)
    return (
      <div>
        <button onClick={() => setMounted(true)}>mount</button>
        {mounted && (
          <img
            ref={ref}
            src={currentSrc}
            alt="late"
            data-testid="late-img"
            data-status={status}
          />
        )}
      </div>
    )
  }

  it('should observe an element that mounts after the first render', () => {
    render(<LateMountImage src="/real.jpg" />)

    // Element is not in the DOM yet, so nothing is observed.
    expect(observeMock).not.toHaveBeenCalled()

    // Mount the <img> late.
    act(() => {
      screen.getByText('mount').click()
    })

    // The hook must attach the observer to the newly mounted element.
    expect(observeMock).toHaveBeenCalled()

    // And the full load lifecycle must work for the late element.
    triggerLoad()
    const el = screen.getByTestId('late-img')
    expect(el).toHaveAttribute('src', '/real.jpg')
    expect(el.dataset.status).toBe('loaded')
  })
})
