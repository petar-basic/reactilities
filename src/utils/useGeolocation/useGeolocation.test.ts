import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useGeolocation } from '../useGeolocation'

const mockPosition: GeolocationPosition = {
  coords: {
    latitude: 48.8566,
    longitude: 2.3522,
    accuracy: 10,
    altitude: 100,
    altitudeAccuracy: 5,
    heading: 0,
    speed: 0,
  } as GeolocationCoordinates,
  timestamp: 1234567890,
}

const mockError = {
  code: 1,
  message: 'Permission denied',
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as GeolocationPositionError

describe('useGeolocation', () => {
  beforeEach(() => {
    // navigator.geolocation is mocked in setup.ts with vi.fn()
    vi.mocked(navigator.geolocation.watchPosition).mockReturnValue(1)
    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation(() => {})
  })

  it('should return loading state initially', () => {
    const { result } = renderHook(() => useGeolocation())

    expect(result.current.loading).toBe(true)
    expect(result.current.latitude).toBeNull()
    expect(result.current.longitude).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should update state on position success via watchPosition', async () => {
    let watchCallback: PositionCallback | null = null
    vi.mocked(navigator.geolocation.watchPosition).mockImplementation((success) => {
      watchCallback = success
      return 1
    })

    const { result } = renderHook(() => useGeolocation())

    await act(async () => {
      watchCallback?.(mockPosition)
    })

    expect(result.current.latitude).toBe(48.8566)
    expect(result.current.longitude).toBe(2.3522)
    expect(result.current.accuracy).toBe(10)
    expect(result.current.altitude).toBe(100)
    expect(result.current.timestamp).toBe(1234567890)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle position error', async () => {
    vi.mocked(navigator.geolocation.watchPosition).mockImplementation((_success, error) => {
      error!(mockError)
      return 1
    })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe(mockError)
    expect(result.current.latitude).toBeNull()
    expect(result.current.longitude).toBeNull()
  })

  it('should report POSITION_UNAVAILABLE error when geolocation API is missing', async () => {
    // setup.ts defines navigator.geolocation with writable:true — use direct assignment
    const original = navigator.geolocation;
    (navigator as any).geolocation = undefined

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error?.code).toBe(2) // POSITION_UNAVAILABLE
    expect(result.current.error?.message).toContain('not supported');

    (navigator as any).geolocation = original
  })

  it('should clear watch on unmount', () => {
    vi.mocked(navigator.geolocation.watchPosition).mockReturnValue(42)

    const { unmount } = renderHook(() => useGeolocation())
    unmount()

    expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(42)
  })

  it('should pass options to watchPosition', () => {
    renderHook(() => useGeolocation({ enableHighAccuracy: true, timeout: 5000 }))

    expect(navigator.geolocation.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true, timeout: 5000 })
    )
  })

  // BUG 2 (mutation-proof): watchPosition is the single source of position
  // updates; the redundant getCurrentPosition call has been dropped so it can
  // no longer overwrite a fresher watch fix with an older cached one.
  it('should NOT call getCurrentPosition (watchPosition is the only source)', () => {
    renderHook(() => useGeolocation({ enableHighAccuracy: true }))

    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled()
    expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1)
  })

  // BUG 1 (mutation-proof): changing a primitive option after mount must
  // re-register the watch — clearWatch the old id and call watchPosition again
  // with the NEW options. On the buggy code (deps: []) no re-register happens,
  // so clearWatch is never called and watchPosition stays at 1 call.
  it('should re-register the watch with new options when an option changes', () => {
    vi.mocked(navigator.geolocation.watchPosition).mockReturnValue(7)

    const { rerender } = renderHook(
      ({ highAccuracy }) => useGeolocation({ enableHighAccuracy: highAccuracy }),
      { initialProps: { highAccuracy: false } }
    )

    expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1)
    expect(navigator.geolocation.watchPosition).toHaveBeenLastCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: false })
    )

    // Change an option after mount.
    rerender({ highAccuracy: true })

    // Old watch is cleared, and a new watch is registered with the new option.
    expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(7)
    expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(2)
    expect(navigator.geolocation.watchPosition).toHaveBeenLastCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true })
    )
  })

  // Re-registering must not leak watches and must not re-register when the
  // option values are unchanged across re-renders (stable primitive deps).
  it('should NOT re-register the watch when options are unchanged', () => {
    const { rerender } = renderHook(() =>
      useGeolocation({ enableHighAccuracy: true, timeout: 5000 })
    )

    expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1)

    rerender()
    rerender()

    expect(navigator.geolocation.watchPosition).toHaveBeenCalledTimes(1)
    expect(navigator.geolocation.clearWatch).not.toHaveBeenCalled()
  })
})
