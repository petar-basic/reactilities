import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNetworkState } from '../useNetworkState'

describe('useNetworkState', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return online status when navigator.onLine is true', () => {
    const { result } = renderHook(() => useNetworkState())
    expect(result.current.online).toBe(true)
  })

  it('should return offline status when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const { result } = renderHook(() => useNetworkState())
    expect(result.current.online).toBe(false)
  })

  it('should update to offline when offline event fires', () => {
    const { result } = renderHook(() => useNetworkState())
    expect(result.current.online).toBe(true)

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current.online).toBe(false)
  })

  it('should update to online when online event fires', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const { result } = renderHook(() => useNetworkState())
    expect(result.current.online).toBe(false)

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current.online).toBe(true)
  })

  it('should include Network Information API data when available', () => {
    const mockConnection = {
      downlink: 10,
      downlinkMax: 100,
      effectiveType: '4g' as const,
      rtt: 50,
      saveData: false,
      type: 'wifi' as const,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(navigator, 'connection', {
      value: mockConnection,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useNetworkState())

    expect(result.current.downlink).toBe(10)
    expect(result.current.effectiveType).toBe('4g')
    expect(result.current.rtt).toBe(50)
    expect(result.current.saveData).toBe(false)
    expect(result.current.type).toBe('wifi')
  })

  it('should return undefined connection fields when Network Information API is not available', () => {
    const { result } = renderHook(() => useNetworkState())

    expect(result.current.downlink).toBeUndefined()
    expect(result.current.effectiveType).toBeUndefined()
    expect(result.current.rtt).toBeUndefined()
  })

  it('should return stable object reference when state has not changed', () => {
    const { result, rerender } = renderHook(() => useNetworkState())
    const firstResult = result.current
    rerender()
    // useSyncExternalStore with shallow equality should return same reference
    expect(result.current).toBe(firstResult)
  })
})
