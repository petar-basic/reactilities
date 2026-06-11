import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
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

  describe('SSR safety (getServerSnapshot)', () => {
    it('does not throw and renders the default state during server render', () => {
      // renderToString exercises getServerSnapshot. The old implementation
      // threw "useNetworkState is a client-only hook", crashing SSR.
      function Probe() {
        const { online } = useNetworkState()
        return createElement('span', null, online ? 'online' : 'offline')
      }

      let html = ''
      expect(() => {
        html = renderToString(createElement(Probe))
      }).not.toThrow()

      // Default server snapshot is online: true so first client render matches.
      expect(html).toContain('online')
    })

    it('returns a complete default state object with online: true and undefined connection fields', () => {
      function Probe() {
        const state = useNetworkState()
        return createElement(
          'span',
          null,
          JSON.stringify({
            online: state.online,
            hasDownlink: state.downlink !== undefined,
            hasEffectiveType: state.effectiveType !== undefined,
            hasRtt: state.rtt !== undefined,
            hasType: state.type !== undefined,
          }),
        )
      }

      const html = renderToString(createElement(Probe))
      const json = html.replace(/^<span[^>]*>/, '').replace(/<\/span>$/, '')
      const decoded = json.replace(/&quot;/g, '"')

      expect(JSON.parse(decoded)).toEqual({
        online: true,
        hasDownlink: false,
        hasEffectiveType: false,
        hasRtt: false,
        hasType: false,
      })
    })

    it('honors a defaultState override during server render', () => {
      function Probe() {
        const { online } = useNetworkState({ online: false })
        return createElement('span', null, online ? 'online' : 'offline')
      }

      const html = renderToString(createElement(Probe))
      expect(html).toContain('offline')
    })
  })

  describe('reactivity', () => {
    it('reacts to a connection "change" event (Network Information API)', () => {
      const listeners: Record<string, ((...args: unknown[]) => void)[]> = {}
      const mockConnection = {
        downlink: 10,
        downlinkMax: 100,
        effectiveType: '4g' as const,
        rtt: 50,
        saveData: false,
        type: 'wifi' as const,
        addEventListener: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
          ;(listeners[event] ||= []).push(cb)
        }),
        removeEventListener: vi.fn(),
      }

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useNetworkState())
      expect(result.current.effectiveType).toBe('4g')
      expect(result.current.downlink).toBe(10)

      // Connection metrics change, then the API fires its "change" event. If
      // subscribe never registered the "change" listener (e.g. gutted), the
      // dispatched event below won't update state and this assertion fails.
      act(() => {
        mockConnection.downlink = 1.5
        mockConnection.effectiveType = '2g'
        mockConnection.rtt = 300
        listeners['change']?.forEach((cb) => cb())
      })

      expect(result.current.effectiveType).toBe('2g')
      expect(result.current.downlink).toBe(1.5)
      expect(result.current.rtt).toBe(300)
    })
  })

  describe('listener cleanup', () => {
    it('removes the exact online/offline handlers on unmount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      const removeSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useNetworkState())

      const onlineAdd = addSpy.mock.calls.find(([type]) => type === 'online')
      const offlineAdd = addSpy.mock.calls.find(([type]) => type === 'offline')
      expect(onlineAdd).toBeDefined()
      expect(offlineAdd).toBeDefined()

      const onlineHandler = onlineAdd![1]
      const offlineHandler = offlineAdd![1]

      unmount()

      // Must remove with the SAME handler reference that was added, otherwise
      // the listener leaks. Removing a different/wrong reference fails here.
      expect(removeSpy).toHaveBeenCalledWith('online', onlineHandler)
      expect(removeSpy).toHaveBeenCalledWith('offline', offlineHandler)
    })

    it('removes the connection "change" handler on unmount', () => {
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

      const { unmount } = renderHook(() => useNetworkState())

      const changeAdd = mockConnection.addEventListener.mock.calls.find(
        ([type]) => type === 'change',
      )
      expect(changeAdd).toBeDefined()
      const changeHandler = changeAdd![1]

      unmount()

      expect(mockConnection.removeEventListener).toHaveBeenCalledWith('change', changeHandler)
    })
  })
})
