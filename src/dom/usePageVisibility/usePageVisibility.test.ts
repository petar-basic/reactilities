import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePageVisibility } from '../usePageVisibility'

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('usePageVisibility', () => {
  beforeEach(() => {
    // Reset to visible before each test
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
  })

  it('should return true when tab is visible', () => {
    const { result } = renderHook(() => usePageVisibility())
    expect(result.current).toBe(true)
  })

  it('should return false when tab becomes hidden', () => {
    const { result } = renderHook(() => usePageVisibility())

    act(() => setVisibility('hidden'))

    expect(result.current).toBe(false)
  })

  it('should return true again when tab becomes visible', () => {
    const { result } = renderHook(() => usePageVisibility())

    act(() => setVisibility('hidden'))
    expect(result.current).toBe(false)

    act(() => setVisibility('visible'))
    expect(result.current).toBe(true)
  })

  it('should clean up the event listener on unmount', () => {
    const spy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => usePageVisibility())
    unmount()
    expect(spy).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    spy.mockRestore()
  })
})
