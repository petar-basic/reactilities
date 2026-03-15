import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from '../useWebSocket'

// Capture the last created socket instance so we can trigger events manually
let lastSocket: MockWebSocket | null = null

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string

  onopen: ((e: Event) => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null

  send = vi.fn()
  close = vi.fn()

  constructor(url: string) {
    this.url = url
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastSocket = this
  }

  // Test helpers
  open() {
    this.readyState = MockWebSocket.OPEN
    this.onopen?.(new Event('open'))
  }

  receiveMessage(data: string) {
    this.onmessage?.(new MessageEvent('message', { data }))
  }

  disconnect(code = 1000) {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close', { code }))
  }

  error() {
    this.readyState = MockWebSocket.CLOSED
    this.onerror?.(new Event('error'))
  }
}

vi.stubGlobal('WebSocket', MockWebSocket)

describe('useWebSocket', () => {
  beforeEach(() => {
    lastSocket = null
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should connect to the given URL on mount', () => {
    renderHook(() => useWebSocket('ws://localhost:8080'))
    expect(lastSocket).not.toBeNull()
    expect(lastSocket?.url).toBe('ws://localhost:8080')
  })

  it('should not connect when url is null', () => {
    renderHook(() => useWebSocket(null))
    expect(lastSocket).toBeNull()
  })

  it('should set readyState to OPEN when connection opens', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'))

    act(() => {
      lastSocket?.open()
    })

    expect(result.current.readyState).toBe(1) // OPEN
  })

  it('should set readyState to CLOSED when connection closes', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'))

    act(() => {
      lastSocket?.open()
      lastSocket?.disconnect()
    })

    expect(result.current.readyState).toBe(3) // CLOSED
  })

  it('should update lastMessage when a message is received', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'))

    act(() => {
      lastSocket?.open()
      lastSocket?.receiveMessage('hello world')
    })

    expect(result.current.lastMessage?.data).toBe('hello world')
  })

  it('should parse JSON into lastJsonMessage', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'))

    act(() => {
      lastSocket?.open()
      lastSocket?.receiveMessage('{"type":"chat","text":"hi"}')
    })

    expect(result.current.lastJsonMessage).toEqual({ type: 'chat', text: 'hi' })
  })

  it('should not crash when receiving non-JSON message', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'))

    act(() => {
      lastSocket?.open()
      lastSocket?.receiveMessage('plain text')
    })

    expect(result.current.lastMessage?.data).toBe('plain text')
    expect(result.current.lastJsonMessage).toBeNull()
  })

  it('should send a string message when OPEN', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'))

    act(() => {
      lastSocket?.open()
    })

    act(() => {
      result.current.sendMessage('ping')
    })

    expect(lastSocket?.send).toHaveBeenCalledWith('ping')
  })

  it('should send JSON message serialized as string', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'))

    act(() => {
      lastSocket?.open()
    })

    act(() => {
      result.current.sendJsonMessage({ type: 'subscribe', channel: 'news' })
    })

    expect(lastSocket?.send).toHaveBeenCalledWith('{"type":"subscribe","channel":"news"}')
  })

  it('should call onOpen callback when connection opens', () => {
    const onOpen = vi.fn()
    renderHook(() => useWebSocket('ws://localhost:8080', { onOpen }))

    act(() => {
      lastSocket?.open()
    })

    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('should call onMessage callback when message is received', () => {
    const onMessage = vi.fn()
    renderHook(() => useWebSocket('ws://localhost:8080', { onMessage }))

    act(() => {
      lastSocket?.open()
      lastSocket?.receiveMessage('data')
    })

    expect(onMessage).toHaveBeenCalledTimes(1)
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ data: 'data' }))
  })

  it('should call onClose callback when connection closes', () => {
    const onClose = vi.fn()
    renderHook(() => useWebSocket('ws://localhost:8080', { onClose }))

    act(() => {
      lastSocket?.open()
      lastSocket?.disconnect()
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onError callback when connection errors', () => {
    const onError = vi.fn()
    renderHook(() => useWebSocket('ws://localhost:8080', { onError }))

    act(() => {
      lastSocket?.error()
    })

    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('should close the connection on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket('ws://localhost:8080'))
    const socket = lastSocket

    unmount()

    expect(socket?.close).toHaveBeenCalledTimes(1)
  })

  it('should expose getWebSocket utility', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'))
    expect(result.current.getWebSocket()).toBe(lastSocket)
  })

  it('should attempt reconnection after disconnect if shouldReconnect returns true', () => {
    renderHook(() =>
      useWebSocket('ws://localhost:8080', {
        reconnectAttempts: 1,
        reconnectInterval: 1000,
        shouldReconnect: () => true,
      })
    )

    const firstSocket = lastSocket

    act(() => {
      firstSocket?.open()
      firstSocket?.disconnect(1001)
    })

    act(() => {
      vi.advanceTimersByTime(1100)
    })

    // A new socket should have been created for the reconnect attempt
    expect(lastSocket).not.toBe(firstSocket)
  })
})
