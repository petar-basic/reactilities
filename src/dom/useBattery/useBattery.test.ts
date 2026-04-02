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

  it('should report isSupported as true when getBattery exists', () => {
    const { result } = renderHook(() => useBattery())
    expect(result.current.isSupported).toBe(true)
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
