import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebSocket } from '../useWebSocket'

// Capture the last created socket instance so we can trigger events manually
let lastSocket: MockWebSocket | null = null
// Total number of WebSocket instances constructed (across reconnects/renders).
let socketCount = 0

class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url: string
  protocols?: string | string[]

  onopen: ((e: Event) => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null

  send = vi.fn()
  close = vi.fn((code = 1000) => {
    this.readyState = MockWebSocket.CLOSED
    // Real WebSocket.close() fires onclose ASYNCHRONOUSLY, after the calling
    // stack (i.e. after the effect cleanup has already run). Model that here so
    // tests exercise the zombie-reconnect path the production code must guard.
    queueMicrotask(() => {
      this.onclose?.(new CloseEvent('close', { code }))
    })
  })

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
    socketCount++
     
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
    socketCount = 0
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

  it('should derive lastJsonMessage from the CURRENT lastMessage (not a stale ref)', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'))

    act(() => {
      lastSocket?.open()
    })

    // First receive a valid JSON payload.
    act(() => {
      lastSocket?.receiveMessage('{"seq":1}')
    })
    expect(result.current.lastJsonMessage).toEqual({ seq: 1 })

    // Then receive a NON-JSON payload. lastMessage must update to the plain
    // text AND lastJsonMessage must reflect that current message (null), not
    // retain the previously parsed { seq: 1 }. The ref-based implementation
    // only updated the ref on successful JSON.parse, so it would still return
    // the stale { seq: 1 } here — this assertion fails if the fix is reverted.
    act(() => {
      lastSocket?.receiveMessage('not json at all')
    })
    expect(result.current.lastMessage?.data).toBe('not json at all')
    expect(result.current.lastJsonMessage).toBeNull()

    // Receive another valid JSON payload and confirm it tracks again.
    act(() => {
      lastSocket?.receiveMessage('{"seq":2}')
    })
    expect(result.current.lastJsonMessage).toEqual({ seq: 2 })
  })

  it('should keep lastJsonMessage consistent with lastMessage (pure derivation, no tearing)', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8080'))

    act(() => {
      lastSocket?.open()
    })

    const payloads = ['{"a":1}', 'plain', '{"b":[1,2,3]}', 'also-plain']

    for (const payload of payloads) {
      act(() => {
        lastSocket?.receiveMessage(payload)
      })

      // lastJsonMessage must ALWAYS be a pure function of the current
      // lastMessage: equal to JSON.parse(lastMessage.data) when parseable,
      // null otherwise. A ref read during render cannot guarantee this
      // invariant (it lags / retains stale values), so reverting the
      // derivation breaks this loop.
      const raw = result.current.lastMessage?.data as string
      let expected: unknown = null
      try {
        expected = JSON.parse(raw)
      } catch {
        expected = null
      }
      expect(result.current.lastJsonMessage).toEqual(expected)
    }
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

  // --- Mutation-proof regression tests ---------------------------------------

  it('should NOT schedule a reconnect after unmount (no zombie connection)', async () => {
    const { unmount } = renderHook(() =>
      useWebSocket('ws://localhost:8080', {
        reconnectAttempts: 3,
        reconnectInterval: 1000,
        shouldReconnect: () => true,
      })
    )

    expect(socketCount).toBe(1)
    const socket = lastSocket

    // Unmount runs the effect cleanup, which calls socket.close(). The mock
    // (like a real WebSocket) fires onclose asynchronously AFTER cleanup.
    unmount()
    expect(socket?.close).toHaveBeenCalledTimes(1)

    // Flush the async onclose (microtask) that close() queued.
    await act(async () => {
      await Promise.resolve()
    })

    // Then advance well past reconnectInterval to let any scheduled reconnect
    // timer fire. With the bug, the onclose handler scheduled a setTimeout that
    // would construct a brand-new WebSocket here.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    // No additional socket may be constructed after unmount.
    expect(socketCount).toBe(1)
    expect(lastSocket).toBe(socket)
  })

  it('should NOT reconnect on URL change cleanup (stale socket stays closed)', async () => {
    const { rerender } = renderHook(
      ({ url }) =>
        useWebSocket(url, {
          reconnectAttempts: 3,
          reconnectInterval: 1000,
          shouldReconnect: () => true,
        }),
      { initialProps: { url: 'ws://localhost:8080' } }
    )

    expect(socketCount).toBe(1)

    // Change the URL: the effect tears down the old socket and opens a new one.
    rerender({ url: 'ws://localhost:9090' })

    // After the URL change there should be exactly two sockets: the closed old
    // one and the new one.
    expect(socketCount).toBe(2)
    expect(lastSocket?.url).toBe('ws://localhost:9090')
    const newSocket = lastSocket

    // Flush the async onclose from the old socket's close() and advance timers.
    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    // The stale socket must NOT have reconnected (would be a 3rd construction
    // pointing at the old URL and clobbering webSocketRef).
    expect(socketCount).toBe(2)
    expect(lastSocket).toBe(newSocket)
    expect(lastSocket?.url).toBe('ws://localhost:9090')
  })

  it('should NOT reconstruct the socket when an inline protocols array is passed fresh each render', () => {
    const { result, rerender } = renderHook(() =>
      // New array reference on EVERY render — the classic identity-churn footgun.
      useWebSocket('ws://localhost:8080', { protocols: ['graphql-ws'] })
    )

    expect(socketCount).toBe(1)
    const socket = lastSocket
    expect(socket?.protocols).toEqual(['graphql-ws'])

    act(() => {
      lastSocket?.open()
    })

    // Re-render several times with a fresh inline protocols array each time.
    rerender()
    rerender()
    rerender()

    // With the bug, connectWebSocket's identity churned every render, so the
    // effect tore down and reopened the socket each time -> socketCount > 1.
    expect(socketCount).toBe(1)
    expect(lastSocket).toBe(socket)

    // The hook API must still work after the re-renders.
    act(() => {
      result.current.sendMessage('ping')
    })
    expect(socket?.send).toHaveBeenCalledWith('ping')
  })

  it('should still reconnect on a genuine disconnect (not a manual close)', async () => {
    renderHook(() =>
      useWebSocket('ws://localhost:8080', {
        reconnectAttempts: 1,
        reconnectInterval: 1000,
        shouldReconnect: () => true,
      })
    )

    const firstSocket = lastSocket
    expect(socketCount).toBe(1)

    // A real server-side disconnect (not via close()) must still reconnect.
    act(() => {
      firstSocket?.open()
      firstSocket?.disconnect(1006)
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100)
    })

    expect(socketCount).toBe(2)
    expect(lastSocket).not.toBe(firstSocket)
  })

  it('should report CLOSED (not CONNECTING) when mounted with url=null', () => {
    const { result } = renderHook(() => useWebSocket(null))

    // No socket is created when deferring with url=null.
    expect(lastSocket).toBeNull()
    // The bug initialized readyState to CONNECTING(0) and never updated it for a
    // null url, so consumers saw a permanent CONNECTING. After the fix it must
    // report CLOSED(3). This assertion fails if the fix is reverted.
    expect(result.current.readyState).toBe(3) // CLOSED
    expect(result.current.readyState).not.toBe(0) // not CONNECTING
  })

  it('should connect (CONNECTING -> OPEN) when url transitions null -> string', () => {
    const { result, rerender } = renderHook(
      ({ url }: { url: string | null }) => useWebSocket(url),
      { initialProps: { url: null as string | null } }
    )

    // Deferred: no socket, CLOSED.
    expect(lastSocket).toBeNull()
    expect(result.current.readyState).toBe(3) // CLOSED

    // Provide a url: a socket is created and we are CONNECTING.
    rerender({ url: 'ws://localhost:8080' })
    expect(lastSocket).not.toBeNull()
    expect(lastSocket?.url).toBe('ws://localhost:8080')
    expect(result.current.readyState).toBe(0) // CONNECTING

    // Opening transitions to OPEN.
    act(() => {
      lastSocket?.open()
    })
    expect(result.current.readyState).toBe(1) // OPEN
  })

  it('should close and report CLOSED when url transitions string -> null', async () => {
    const { result, rerender } = renderHook(
      ({ url }: { url: string | null }) => useWebSocket(url),
      { initialProps: { url: 'ws://localhost:8080' as string | null } }
    )

    const socket = lastSocket
    expect(socket).not.toBeNull()

    act(() => {
      socket?.open()
    })
    expect(result.current.readyState).toBe(1) // OPEN

    // Drop the url to disconnect: cleanup closes the socket and readyState must
    // become CLOSED(3). With the bug there was no else-branch, so a string->null
    // transition where the socket's async onclose is detached during cleanup
    // would leave readyState reflecting OPEN. Setting CLOSED in the else-branch
    // guarantees consumers observe the disconnect; reverting fails this.
    rerender({ url: null })

    expect(socket?.close).toHaveBeenCalledTimes(1)

    // Flush the old socket's async onclose; no reconnect, no new socket.
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.readyState).toBe(3) // CLOSED
    expect(lastSocket).toBe(socket) // no new socket constructed
  })
})
