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

  it('should update state on position success via getCurrentPosition', async () => {
    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success) => {
      success(mockPosition)
    })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.latitude).toBe(48.8566)
    expect(result.current.longitude).toBe(2.3522)
    expect(result.current.accuracy).toBe(10)
    expect(result.current.altitude).toBe(100)
    expect(result.current.timestamp).toBe(1234567890)
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
    expect(result.current.loading).toBe(false)
  })

  it('should handle position error', async () => {
    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((_success, error) => {
      error!(mockError)
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

  it('should pass options to getCurrentPosition and watchPosition', () => {
    renderHook(() => useGeolocation({ enableHighAccuracy: true, timeout: 5000 }))

    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true, timeout: 5000 })
    )
    expect(navigator.geolocation.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true, timeout: 5000 })
    )
  })
})
