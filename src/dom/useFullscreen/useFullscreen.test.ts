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

describe('useFullscreen', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'fullscreenElement', {
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

  it('should remove event listener on unmount', () => {
    const spy = vi.spyOn(document, 'removeEventListener')
    const ref = { current: makeElement() }
    const { unmount } = renderHook(() => useFullscreen(ref))
    unmount()
    expect(spy).toHaveBeenCalledWith('fullscreenchange', expect.any(Function))
    spy.mockRestore()
  })
})
