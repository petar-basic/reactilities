import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOrientation } from './index'

function mockScreenOrientation(angle: number) {
  const listeners = new Map<string, () => void>()

  const orientation = {
    angle,
    type: Math.abs(angle) === 90 ? 'landscape-primary' : 'portrait-primary',
    addEventListener: vi.fn((event: string, handler: () => void) => {
      listeners.set(event, handler)
    }),
    removeEventListener: vi.fn((event: string) => {
      listeners.delete(event)
    }),
    dispatchEvent: vi.fn(),
    lock: vi.fn(),
    unlock: vi.fn(),
    onchange: null,
    _listeners: listeners
  }

  Object.defineProperty(screen, 'orientation', {
    value: orientation,
    configurable: true,
    writable: true
  })

  return { orientation, listeners }
}

describe('useOrientation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return portrait when angle is 0', () => {
    mockScreenOrientation(0)
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('portrait')
    expect(result.current.angle).toBe(0)
  })

  it('should return landscape when angle is 90', () => {
    mockScreenOrientation(90)
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('landscape')
    expect(result.current.angle).toBe(90)
  })

  it('should return landscape when angle is -90', () => {
    mockScreenOrientation(-90)
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('landscape')
    expect(result.current.angle).toBe(-90)
  })

  it('should update when the orientation changes', () => {
    const { orientation, listeners } = mockScreenOrientation(0)
    const { result } = renderHook(() => useOrientation())

    expect(result.current.orientation).toBe('portrait')

    // Simulate rotation to landscape
    orientation.angle = 90
    Object.defineProperty(screen, 'orientation', {
      value: orientation,
      configurable: true,
      writable: true
    })

    act(() => {
      listeners.get('change')?.()
    })

    expect(result.current.orientation).toBe('landscape')
    expect(result.current.angle).toBe(90)
  })

  it('should remove the orientation change listener on unmount', () => {
    const { orientation } = mockScreenOrientation(0)
    const { unmount } = renderHook(() => useOrientation())

    unmount()

    expect(orientation.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should remove the window orientationchange listener on unmount', () => {
    mockScreenOrientation(0)
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useOrientation())

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))
  })
})
