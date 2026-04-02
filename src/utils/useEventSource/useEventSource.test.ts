import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEventSource } from './index'

let lastSource: MockEventSource | null = null

class MockEventSource {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  readyState = MockEventSource.CONNECTING
  url: string
  withCredentials: boolean

  onopen: ((e: Event) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null

  close = vi.fn(() => {
    this.readyState = MockEventSource.CLOSED
  })

  constructor(url: string, init?: { withCredentials?: boolean }) {
    this.url = url
    this.withCredentials = init?.withCredentials ?? false
    lastSource = this
  }

  open() {
    this.readyState = MockEventSource.OPEN
    this.onopen?.(new Event('open'))
  }

  receiveMessage(data: string) {
    this.onmessage?.(new MessageEvent('message', { data }))
  }

  triggerError() {
    this.readyState = MockEventSource.CLOSED
    this.onerror?.(new Event('error'))
  }
}

vi.stubGlobal('EventSource', MockEventSource)

describe('useEventSource', () => {
  beforeEach(() => {
    lastSource = null
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should connect to the given URL on mount', () => {
    renderHook(() => useEventSource('/api/events'))
    expect(lastSource).not.toBeNull()
    expect(lastSource?.url).toBe('/api/events')
  })

  it('should not connect when url is null', () => {
    renderHook(() => useEventSource(null))
    expect(lastSource).toBeNull()
  })

  it('should set readyState to OPEN when connection opens', () => {
    const { result } = renderHook(() => useEventSource('/api/events'))

    act(() => {
      lastSource?.open()
    })

    expect(result.current.readyState).toBe(1)
  })

  it('should update lastMessage when a message is received', () => {
    const { result } = renderHook(() => useEventSource('/api/events'))

    act(() => {
      lastSource?.open()
      lastSource?.receiveMessage('{"count":42}')
    })

    expect(result.current.lastMessage?.data).toBe('{"count":42}')
  })

  it('should update readyState on error', () => {
    const { result } = renderHook(() => useEventSource('/api/events'))

    act(() => {
      lastSource?.triggerError()
    })

    expect(result.current.readyState).toBe(2)
  })

  it('should call onOpen callback when connection opens', () => {
    const onOpen = vi.fn()
    renderHook(() => useEventSource('/api/events', { onOpen }))

    act(() => {
      lastSource?.open()
    })

    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('should call onError callback when connection errors', () => {
    const onError = vi.fn()
    renderHook(() => useEventSource('/api/events', { onError }))

    act(() => {
      lastSource?.triggerError()
    })

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('should pass withCredentials to EventSource', () => {
    renderHook(() => useEventSource('/api/events', { withCredentials: true }))
    expect(lastSource?.withCredentials).toBe(true)
  })

  it('should close the connection on unmount', () => {
    const { unmount } = renderHook(() => useEventSource('/api/events'))
    const source = lastSource

    unmount()

    expect(source?.close).toHaveBeenCalledTimes(1)
  })

  it('should close manually when close() is called', () => {
    const { result } = renderHook(() => useEventSource('/api/events'))

    act(() => {
      result.current.close()
    })

    expect(result.current.readyState).toBe(2)
  })

  it('should reset lastMessage to null when close() is called', () => {
    const { result } = renderHook(() => useEventSource('/api/events'))

    act(() => {
      lastSource?.open()
      lastSource?.receiveMessage('{"count":1}')
    })
    expect(result.current.lastMessage).not.toBeNull()

    act(() => {
      result.current.close()
    })
    expect(result.current.lastMessage).toBeNull()
  })

  it('should start with null lastMessage', () => {
    const { result } = renderHook(() => useEventSource('/api/events'))
    expect(result.current.lastMessage).toBeNull()
  })
})
