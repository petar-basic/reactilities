import { useCallback, useEffect, useRef, useState } from 'react';

type ReadyState = 0 | 1 | 2 | 3; // CONNECTING | OPEN | CLOSING | CLOSED

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
  sendJsonMessage: (message: any) => void;
  lastMessage: MessageEvent | null;
  lastJsonMessage: any;
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
    shouldReconnect = (_closeEvent: CloseEvent) => true,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options;

  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<ReadyState>(0);
  
  const webSocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const lastJsonMessageRef = useRef<any>(null);

  const getWebSocket = useCallback(() => webSocketRef.current, []);

  const sendMessage = useCallback((message: string | ArrayBuffer | Blob) => {
    const socket = webSocketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  const sendJsonMessage = useCallback((message: any) => {
    sendMessage(JSON.stringify(message));
  }, [sendMessage]);

  const connectWebSocket = useCallback(() => {
    if (!socketUrl) return;

    try {
      const socket = new WebSocket(socketUrl, protocols);
      webSocketRef.current = socket;

      socket.onopen = (event) => {
        setReadyState(WebSocket.OPEN);
        reconnectAttemptsRef.current = 0;
        onOpen?.(event);
      };

      socket.onclose = (event) => {
        setReadyState(WebSocket.CLOSED);
        onClose?.(event);

        // Attempt reconnection if conditions are met
        if (
          shouldReconnect(event) &&
          reconnectAttemptsRef.current < reconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectWebSocket();
          }, reconnectInterval);
        }
      };

      socket.onerror = (event) => {
        setReadyState(WebSocket.CLOSED);
        onError?.(event);
      };

      socket.onmessage = (event) => {
        setLastMessage(event);
        onMessage?.(event);

        // Try to parse JSON messages
        try {
          const jsonMessage = JSON.parse(event.data);
          lastJsonMessageRef.current = jsonMessage;
        } catch {
          // Not JSON, ignore
        }
      };

      setReadyState(WebSocket.CONNECTING);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setReadyState(WebSocket.CLOSED);
    }
  }, [socketUrl, protocols, reconnectAttempts, reconnectInterval, shouldReconnect, onOpen, onClose, onError, onMessage]);

  useEffect(() => {
    if (socketUrl) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [connectWebSocket, socketUrl]);

  return {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage: lastJsonMessageRef.current,
    readyState,
    getWebSocket
  };
}
