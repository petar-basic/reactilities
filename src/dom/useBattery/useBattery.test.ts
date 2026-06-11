import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBattery } from './index'

type BatteryListener = () => void

interface MockBattery {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
  _listeners: Map<string, BatteryListener>
  addEventListener: (event: string, listener: BatteryListener) => void
  removeEventListener: (event: string, listener: BatteryListener) => void
  triggerEvent: (event: string) => void
}

function createMockBattery(initial: Partial<MockBattery> = {}): MockBattery {
  const _listeners = new Map<string, BatteryListener>()

  const battery: MockBattery = {
    charging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
    level: 1,
    _listeners,
    addEventListener: vi.fn((event: string, listener: BatteryListener) => {
      _listeners.set(event, listener)
    }),
    removeEventListener: vi.fn((event: string) => {
      _listeners.delete(event)
    }),
    triggerEvent(event: string) {
      _listeners.get(event)?.()
    },
    ...initial
  }

  return battery
}

describe('useBattery', () => {
  let mockBattery: MockBattery
  let getBatterySpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockBattery = createMockBattery({
      charging: false,
      level: 0.75,
      chargingTime: 0,
      dischargingTime: 3600
    })

    getBatterySpy = vi.fn().mockResolvedValue(mockBattery)

    Object.defineProperty(navigator, 'getBattery', {
      value: getBatterySpy,
      configurable: true,
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('should report isSupported as true when getBattery exists', async () => {
    const { result } = renderHook(() => useBattery())
    // isSupported now resolves after mount (inside an effect), so flush effects.
    await act(async () => {})
    expect(result.current.isSupported).toBe(true)
  })

  // MUTATION-PROOF (SSR hydration): isSupported must be `false` on the first
  // render even when navigator.getBattery exists, so the server render and the
  // client's first render agree. The hook's documented usage `if (!isSupported)
  // return null` must therefore render the not-supported branch on the server.
  //
  // This fails on the buggy version (useState initializer returns `true`
  // immediately), which renders the supported branch on the client's first pass
  // while the server renders null -> hydration mismatch.
  it('should render the not-supported branch on the server even when getBattery exists', async () => {
    // getBattery IS defined here (set up in beforeEach), mirroring Chromium.
    const { renderToString } = await import('react-dom/server')
    const React = await import('react')

    function SsrConsumer() {
      const { isSupported, level } = useBattery()
      if (!isSupported) return React.createElement('span', null, 'unsupported')
      return React.createElement('span', null, `level:${level}`)
    }

    let html = ''
    expect(() => {
      html = renderToString(React.createElement(SsrConsumer))
    }).not.toThrow()

    expect(html).toContain('unsupported')
    expect(html).not.toContain('level:')
  })

  // MUTATION-PROOF (first committed render vs post-effect): capture every value
  // the hook returns. The first committed render must be `false` (proving the
  // initializer does not compute support eagerly), and a later render must flip
  // to `true` after the effect runs. Fails if support is computed in useState.
  it('should start isSupported false on the first render then flip to true after effects', async () => {
    const observed: boolean[] = []

    renderHook(() => {
      const { isSupported } = useBattery()
      observed.push(isSupported)
      return isSupported
    })

    // First committed render, before effects, must be false.
    expect(observed[0]).toBe(false)

    await act(async () => {})

    // After effects run, support detection sets it to true.
    expect(observed[observed.length - 1]).toBe(true)
    expect(observed).toContain(true)
  })

  it('should report isSupported as false when getBattery is missing', () => {
    Object.defineProperty(navigator, 'getBattery', {
      value: undefined,
      configurable: true,
      writable: true
    })

    const { result } = renderHook(() => useBattery())
    expect(result.current.isSupported).toBe(false)
  })

  it('should populate battery state after mounting', async () => {
    const { result } = renderHook(() => useBattery())

    await act(async () => {})

    expect(result.current.charging).toBe(false)
    expect(result.current.level).toBe(0.75)
    expect(result.current.dischargingTime).toBe(3600)
  })

  it('should update when charging state changes', async () => {
    const { result } = renderHook(() => useBattery())
    await act(async () => {})

    act(() => {
      mockBattery.charging = true
      mockBattery.triggerEvent('chargingchange')
    })

    expect(result.current.charging).toBe(true)
  })

  it('should update when battery level changes', async () => {
    const { result } = renderHook(() => useBattery())
    await act(async () => {})

    act(() => {
      mockBattery.level = 0.2
      mockBattery.triggerEvent('levelchange')
    })

    expect(result.current.level).toBe(0.2)
  })

  it('should update when dischargingTime changes', async () => {
    const { result } = renderHook(() => useBattery())
    await act(async () => {})

    act(() => {
      mockBattery.dischargingTime = 1800
      mockBattery.triggerEvent('dischargingtimechange')
    })

    expect(result.current.dischargingTime).toBe(1800)
  })

  it('should not add event listeners if the component unmounts before getBattery resolves', async () => {
    let resolveBattery!: (battery: MockBattery) => void
    getBatterySpy.mockReturnValue(new Promise(resolve => { resolveBattery = resolve }))

    const { unmount } = renderHook(() => useBattery())
    unmount()

    await act(async () => { resolveBattery(mockBattery) })

    expect(mockBattery.addEventListener).not.toHaveBeenCalled()
  })

  it('should remove event listeners on unmount', async () => {
    const { unmount } = renderHook(() => useBattery())
    await act(async () => {})

    unmount()

    expect(mockBattery._listeners.size).toBe(0)
  })
})
