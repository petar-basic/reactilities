import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOrientation, getServerSnapshot } from './index'

// Allows the test to set `type` independently of `angle`. The old buggy
// implementation ignored `type` and derived orientation purely from
// `Math.abs(angle) === 90`, so these tests double as mutation guards.
function mockScreenOrientation(angle: number, type?: string) {
  const listeners = new Map<string, () => void>()

  const orientation = {
    angle,
    type: type ?? (Math.abs(angle) === 90 ? 'landscape-primary' : 'portrait-primary'),
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

// matchMedia is undefined in jsdom by default. Provide a controllable mock so
// the matchMedia fallback path can be exercised.
function mockMatchMedia(isLandscape: boolean) {
  const mql = {
    matches: isLandscape,
    media: '(orientation: landscape)',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
    dispatchEvent: vi.fn()
  }
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockReturnValue(mql),
    configurable: true,
    writable: true
  })
  return mql
}

function removeScreenOrientation() {
  Object.defineProperty(screen, 'orientation', {
    value: undefined,
    configurable: true,
    writable: true
  })
}

describe('useOrientation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    // Reset matchMedia (jsdom does not define it by default).
    Object.defineProperty(window, 'matchMedia', {
      value: undefined,
      configurable: true,
      writable: true
    })
  })

  it('should return portrait when angle is 0 and type is portrait', () => {
    mockScreenOrientation(0, 'portrait-primary')
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('portrait')
    expect(result.current.angle).toBe(0)
  })

  it('should return landscape when angle is 90', () => {
    mockScreenOrientation(90, 'landscape-primary')
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('landscape')
    expect(result.current.angle).toBe(90)
  })

  // MUTATION GUARD: landscape-natural devices (desktops, many tablets) report
  // angle 0 while clearly in landscape. The old `Math.abs(angle) === 90` heuristic
  // returns 'portrait' here, so this fails on the buggy code.
  it('should return landscape when angle is 0 but type is landscape-primary', () => {
    mockScreenOrientation(0, 'landscape-primary')
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('landscape')
    expect(result.current.angle).toBe(0)
  })

  // MUTATION GUARD: landscape-secondary reports angle 270. The old heuristic
  // `Math.abs(270) === 90` is false → returns 'portrait' on the buggy code.
  it('should return landscape when angle is 270 (landscape-secondary)', () => {
    mockScreenOrientation(270, 'landscape-secondary')
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('landscape')
    expect(result.current.angle).toBe(270)
  })

  it('should return landscape when angle is -90 (landscape-secondary)', () => {
    mockScreenOrientation(-90, 'landscape-secondary')
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('landscape')
    expect(result.current.angle).toBe(-90)
  })

  // MUTATION GUARD: portrait-secondary reports angle 180. The old heuristic
  // already returned 'portrait' here, but type-based logic must agree.
  it('should return portrait when angle is 180 (portrait-secondary)', () => {
    mockScreenOrientation(180, 'portrait-secondary')
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('portrait')
    expect(result.current.angle).toBe(180)
  })

  it('should update when the orientation changes', () => {
    const { orientation, listeners } = mockScreenOrientation(0, 'portrait-primary')
    const { result } = renderHook(() => useOrientation())

    expect(result.current.orientation).toBe('portrait')

    // Simulate rotation to landscape
    orientation.angle = 90
    orientation.type = 'landscape-primary'

    act(() => {
      listeners.get('change')?.()
    })

    expect(result.current.orientation).toBe('landscape')
    expect(result.current.angle).toBe(90)
  })

  it('falls back to matchMedia when screen.orientation has no type', () => {
    // Screen Orientation API present (angle available) but no type string.
    mockScreenOrientation(0, undefined as unknown as string)
    // Override type to be absent.
    Object.defineProperty(screen, 'orientation', {
      value: { angle: 0, type: undefined, addEventListener: vi.fn(), removeEventListener: vi.fn() },
      configurable: true,
      writable: true
    })
    mockMatchMedia(true)
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('landscape')
    expect(result.current.angle).toBe(0)
  })

  it('uses matchMedia when screen.orientation is unavailable (legacy)', () => {
    removeScreenOrientation()
    mockMatchMedia(true)
    ;(window as Window & { orientation?: number }).orientation = 90
    const { result } = renderHook(() => useOrientation())
    expect(result.current.orientation).toBe('landscape')
    expect(result.current.angle).toBe(90)
    delete (window as Window & { orientation?: number }).orientation
  })

  // SSR safety: the server snapshot must never throw and must return the
  // documented default so the first client render matches the server render.
  it('getServerSnapshot returns a safe default and does not throw', () => {
    expect(() => getServerSnapshot()).not.toThrow()
    expect(getServerSnapshot()).toEqual({ orientation: 'portrait', angle: 0 })
  })

  it('getServerSnapshot returns a stable reference (tear-free)', () => {
    expect(getServerSnapshot()).toBe(getServerSnapshot())
  })

  it('should remove the orientation change listener on unmount', () => {
    const { orientation } = mockScreenOrientation(0, 'portrait-primary')
    const { unmount } = renderHook(() => useOrientation())

    unmount()

    expect(orientation.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should remove the window orientationchange listener on unmount', () => {
    mockScreenOrientation(0, 'portrait-primary')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useOrientation())

    unmount()

    expect(removeSpy).toHaveBeenCalledWith('orientationchange', expect.any(Function))
  })
})
