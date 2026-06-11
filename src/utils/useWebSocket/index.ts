import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ReadyState = 0 | 1 | 2 | 3; // CONNECTING | OPEN | CLOSING | CLOSED

// Stable default — defined at module level so it never changes reference
const DEFAULT_SHOULD_RECONNECT: (closeEvent: CloseEvent) => boolean = () => true;

interface UseWebSocketOptions {
  protocols?: string | string[];
  reconnectAttempts?: number;
  reconnectInterval?: number;
  shouldReconnect?: (closeEvent: CloseEvent) => boolean;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
}

interface UseWebSocketReturn {
  sendMessage: (message: string | ArrayBuffer | Blob) => void;
  sendJsonMessage: (message: unknown) => void;
  lastMessage: MessageEvent | null;
  lastJsonMessage: unknown;
  readyState: ReadyState;
  getWebSocket: () => WebSocket | null;
}

/**
 * Hook for managing WebSocket connections with automatic reconnection
 * Handles connection state, message sending, and reconnection logic
 *
 * @param socketUrl - WebSocket URL to connect to
 * @param options - Configuration options for WebSocket behavior
 * @returns Object with message sending functions, connection state, and utilities
 *
 * @example
 * const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket('ws://localhost:8080', {
 *   reconnectAttempts: 3,
 *   reconnectInterval: 3000,
 *   onOpen: () => console.log('Connected'),
 *   onMessage: (event) => console.log('Message:', event.data)
 * });
 *
 * const handleSendMessage = () => {
 *   sendJsonMessage({ type: 'chat', message: 'Hello!' });
 * };
 */
export function useWebSocket(
  socketUrl: string | null,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    protocols,
    reconnectAttempts = 3,
    reconnectInterval = 3000,
    shouldReconnect = DEFAULT_SHOULD_RECONNECT,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options;

  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  // Initialize from socketUrl: a null/falsy url means we are deliberately not
  // connecting (the documented way to defer), so the socket is CLOSED(3), not
  // stuck reporting CONNECTING(0). With a url we are about to connect, so start
  // at CONNECTING(0).
  const [readyState, setReadyState] = useState<ReadyState>(socketUrl ? 0 : 3);

  const webSocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);

  // Flag set during effect cleanup (unmount / URL change) to mark the close as
  // intentional. WebSocket.close() fires onclose asynchronously AFTER cleanup
  // has run, so without this flag the handler would schedule a reconnect for a
  // socket whose component is already gone (zombie reconnect / StrictMode
  // double-connect).
  const manuallyClosedRef = useRef(false);

  // Store callbacks in refs so connectWebSocket doesn't need to depend on them.
  // Without this, inline callback props (e.g. onMessage={() => ...}) would cause
  // connectWebSocket to be recreated on every render, which reconnects the socket.
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  const onMessageRef = useRef(onMessage);
  const shouldReconnectRef = useRef(shouldReconnect);
  // protocols is held in a ref (like the callbacks) so an inline array passed
  // fresh each render (e.g. { protocols: ['graphql-ws'] }) doesn't change
  // connectWebSocket's identity and tear down/reopen the socket every render.
  // The dep below uses a stable string key instead. Protocol changes do not
  // force a reconnect; the new protocols apply on the next (re)connect.
  const protocolsRef = useRef(protocols);

  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;
  onErrorRef.current = onError;
  onMessageRef.current = onMessage;
  shouldReconnectRef.current = shouldReconnect;
  protocolsRef.current = protocols;

  // Stable dependency key for protocols so identity churn from inline arrays
  // doesn't recreate connectWebSocket on every render.
  const protocolsKey = Array.isArray(protocols) ? protocols.join(',') : protocols;

  const getWebSocket = useCallback(() => webSocketRef.current, []);

  const sendMessage = useCallback((message: string | ArrayBuffer | Blob) => {
    const socket = webSocketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  const sendJsonMessage = useCallback((message: unknown) => {
    sendMessage(JSON.stringify(message));
  }, [sendMessage]);

  const connectWebSocket = useCallback(() => {
    if (!socketUrl) return;

    // A fresh connection is being opened intentionally; clear the
    // manual-close flag so genuine disconnects can reconnect again.
    manuallyClosedRef.current = false;

    try {
      const socket = new WebSocket(socketUrl, protocolsRef.current);
      webSocketRef.current = socket;

      socket.onopen = (event) => {
        setReadyState(WebSocket.OPEN);
        reconnectAttemptsRef.current = 0;
        onOpenRef.current?.(event);
      };

      socket.onclose = (event) => {
        setReadyState(WebSocket.CLOSED);
        onCloseRef.current?.(event);

        // Don't reconnect a socket that was closed intentionally by cleanup
        // (unmount / URL change / StrictMode remount).
        if (manuallyClosedRef.current) {
          return;
        }

        // Attempt reconnection if conditions are met
        if (
          shouldReconnectRef.current(event) &&
          reconnectAttemptsRef.current < reconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, reconnectInterval);
        }
      };

      socket.onerror = (event) => {
        setReadyState(WebSocket.CLOSED);
        onErrorRef.current?.(event);
      };

      socket.onmessage = (event) => {
        setLastMessage(event);
        onMessageRef.current?.(event);
      };

      setReadyState(WebSocket.CONNECTING);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setReadyState(WebSocket.CLOSED);
    }
    // protocolsKey (a stable string) is used instead of protocols so an inline
    // array reference doesn't churn this callback's identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketUrl, protocolsKey, reconnectAttempts, reconnectInterval]);

  useEffect(() => {
    if (socketUrl) {
      connectWebSocket();
    } else {
      // No url: we're intentionally not connecting (deferred / disconnect via
      // url=null). Reflect CLOSED(3) so consumers don't see a permanent
      // CONNECTING. The cleanup below already tears down any prior socket when
      // the url transitions string -> null.
      setReadyState(3);
    }

    return () => {
      // Mark this close as intentional BEFORE closing. close() fires onclose
      // asynchronously after cleanup runs, so the flag must be set first to
      // prevent a zombie reconnect. Reset reconnect attempts for the next
      // (re)connect (e.g. URL change / StrictMode remount).
      manuallyClosedRef.current = true;
      reconnectAttemptsRef.current = 0;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }

      const socket = webSocketRef.current;
      if (socket) {
        // Detach ALL handlers so any late events on the old socket are ignored,
        // then close it. Detaching onclose is essential: close() fires it
        // asynchronously, and by then a URL change may have opened a new socket
        // and reset manuallyClosedRef — so the flag alone can't protect the old
        // socket. Removing its onclose guarantees it can never reconnect.
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      }
    };
  }, [connectWebSocket, socketUrl]);

  // Derive the parsed JSON message during render from lastMessage (state),
  // rather than mutating a ref inside onmessage and reading it during render.
  // Reading a mutable ref during render is unsafe under concurrent rendering
  // (tearing). Deriving from lastMessage keeps it a pure function of state and
  // preserves the previous semantics: null when there is no message or when the
  // payload is not valid JSON.
  const lastJsonMessage = useMemo<unknown>(() => {
    if (!lastMessage) return null;
    try {
      return JSON.parse(lastMessage.data);
    } catch {
      return null;
    }
  }, [lastMessage]);

  return {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket
  };
}
