import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFullscreen } from '../useFullscreen'

function makeElement() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

function simulateFullscreenChange(element: HTMLElement | null) {
  Object.defineProperty(document, 'fullscreenElement', {
    value: element,
    configurable: true,
  })
  document.dispatchEvent(new Event('fullscreenchange'))
}

function simulateWebkitFullscreenChange(element: HTMLElement | null) {
  Object.defineProperty(document, 'webkitFullscreenElement', {
    value: element,
    configurable: true,
  })
  document.dispatchEvent(new Event('webkitfullscreenchange'))
}

describe('useFullscreen', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'fullscreenElement', {
      value: null,
      configurable: true,
    })
    Object.defineProperty(document, 'webkitFullscreenElement', {
      value: null,
      configurable: true,
    })
  })

  it('should start as not fullscreen', () => {
    const ref = { current: makeElement() }
    const { result } = renderHook(() => useFullscreen(ref))
    expect(result.current.isFullscreen).toBe(false)
  })

  it('should become fullscreen when element enters fullscreen', () => {
    const el = makeElement()
    el.requestFullscreen = vi.fn().mockResolvedValue(undefined)
    const ref = { current: el }

    const { result } = renderHook(() => useFullscreen(ref))

    act(() => {
      simulateFullscreenChange(el)
    })

    expect(result.current.isFullscreen).toBe(true)
  })

  it('should exit fullscreen when fullscreenElement becomes null', () => {
    const el = makeElement()
    const ref = { current: el }
    const { result } = renderHook(() => useFullscreen(ref))

    act(() => simulateFullscreenChange(el))
    expect(result.current.isFullscreen).toBe(true)

    act(() => simulateFullscreenChange(null))
    expect(result.current.isFullscreen).toBe(false)
  })

  it('should call requestFullscreen on enter()', async () => {
    const el = makeElement()
    el.requestFullscreen = vi.fn().mockResolvedValue(undefined)
    const ref = { current: el }

    const { result } = renderHook(() => useFullscreen(ref))

    await act(async () => {
      await result.current.enter()
    })

    expect(el.requestFullscreen).toHaveBeenCalledTimes(1)
  })

  it('should call document.exitFullscreen on exit()', async () => {
    const el = makeElement()
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined)
    const ref = { current: el }

    const { result } = renderHook(() => useFullscreen(ref))

    act(() => simulateFullscreenChange(el))

    await act(async () => {
      await result.current.exit()
    })

    expect(document.exitFullscreen).toHaveBeenCalledTimes(1)
  })

  it('should expose enter, exit, toggle functions', () => {
    const ref = { current: makeElement() }
    const { result } = renderHook(() => useFullscreen(ref))
    expect(typeof result.current.enter).toBe('function')
    expect(typeof result.current.exit).toBe('function')
    expect(typeof result.current.toggle).toBe('function')
  })

  it('should remove event listeners on unmount', () => {
    const spy = vi.spyOn(document, 'removeEventListener')
    const ref = { current: makeElement() }
    const { unmount } = renderHook(() => useFullscreen(ref))
    unmount()
    expect(spy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function))
    expect(spy).toHaveBeenCalledWith(
      'webkitfullscreenchange',
      expect.any(Function)
    )
    spy.mockRestore()
  })

  describe('webkit-prefixed fallback', () => {
    // Mutation-proof: only the webkit-prefixed API is present (no standard
    // requestFullscreen / fullscreenElement). With the unprefixed-only code,
    // enter() silently no-ops and the webkitfullscreenchange event is ignored,
    // so both assertions below fail. They only pass once the prefix fallbacks
    // and dual event listeners are implemented.
    it('should call webkitRequestFullscreen on enter() when standard API is absent', async () => {
      const el = makeElement()
      // Ensure the standard API is not available on this element.
      ;(el as { requestFullscreen?: unknown }).requestFullscreen = undefined
      const webkitRequest = vi.fn().mockResolvedValue(undefined)
      ;(
        el as unknown as { webkitRequestFullscreen: () => Promise<void> }
      ).webkitRequestFullscreen = webkitRequest
      const ref = { current: el }

      const { result } = renderHook(() => useFullscreen(ref))

      await act(async () => {
        await result.current.enter()
      })

      expect(webkitRequest).toHaveBeenCalledTimes(1)
    })

    it('should update isFullscreen from a webkitfullscreenchange event', () => {
      const el = makeElement()
      const ref = { current: el }
      const { result } = renderHook(() => useFullscreen(ref))

      act(() => simulateWebkitFullscreenChange(el))
      expect(result.current.isFullscreen).toBe(true)

      act(() => simulateWebkitFullscreenChange(null))
      expect(result.current.isFullscreen).toBe(false)
    })

    it('should call webkitExitFullscreen on exit() when standard API is absent', async () => {
      const el = makeElement()
      const ref = { current: el }
      ;(document as { exitFullscreen?: unknown }).exitFullscreen = undefined
      const webkitExit = vi.fn().mockResolvedValue(undefined)
      ;(
        document as unknown as { webkitExitFullscreen: () => Promise<void> }
      ).webkitExitFullscreen = webkitExit

      const { result } = renderHook(() => useFullscreen(ref))

      act(() => simulateWebkitFullscreenChange(el))

      await act(async () => {
        await result.current.exit()
      })

      expect(webkitExit).toHaveBeenCalledTimes(1)

      // Clean up the prefixed property so it doesn't leak into other tests.
      delete (document as { webkitExitFullscreen?: unknown }).webkitExitFullscreen
    })
  })

  describe('isSupported', () => {
    it('should be true when requestFullscreen is available', () => {
      const original = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'requestFullscreen'
      )
      // jsdom does not implement requestFullscreen; define it for this test.
      ;(
        HTMLElement.prototype as { requestFullscreen?: unknown }
      ).requestFullscreen = vi.fn()

      const ref = { current: makeElement() }
      const { result } = renderHook(() => useFullscreen(ref))
      expect(result.current.isSupported).toBe(true)

      if (original) {
        Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', original)
      } else {
        delete (HTMLElement.prototype as { requestFullscreen?: unknown })
          .requestFullscreen
      }
    })

    it('should be false when no Fullscreen API is available', () => {
      const original = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'requestFullscreen'
      )
      delete (HTMLElement.prototype as { requestFullscreen?: unknown })
        .requestFullscreen

      const ref = { current: makeElement() }
      const { result } = renderHook(() => useFullscreen(ref))
      expect(result.current.isSupported).toBe(false)

      if (original) {
        Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', original)
      }
    })
  })
})
