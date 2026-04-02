import { useCallback, useEffect, useRef, useState } from "react";

type EventSourceReadyState = 0 | 1 | 2; // CONNECTING | OPEN | CLOSED

interface UseEventSourceOptions {
  withCredentials?: boolean;
  onOpen?: (event: Event) => void;
  onError?: (event: Event) => void;
}

interface UseEventSourceReturn {
  lastMessage: MessageEvent | null;
  readyState: EventSourceReadyState;
  close: () => void;
}

/**
 * Hook for managing Server-Sent Events (SSE) connections
 * SSE is a lightweight alternative to WebSocket for one-way real-time data from server to client
 * Handles connection state and automatic cleanup
 *
 * @param url - SSE endpoint URL (pass null to skip connecting)
 * @param options - Configuration options for the EventSource
 * @returns Object with last received message, connection state, and close function.
 *   Calling close() resets lastMessage to null so consumers don't render stale data on reconnect.
 *
 * @example
 * function LiveFeed() {
 *   const { lastMessage, readyState } = useEventSource('/api/events');
 *
 *   return (
 *     <div>
 *       <span>{readyState === 1 ? 'Connected' : 'Disconnected'}</span>
 *       <p>{lastMessage?.data}</p>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Live notifications feed
 * const { lastMessage } = useEventSource('/api/notifications/stream');
 *
 * useEffect(() => {
 *   if (lastMessage) {
 *     const notification = JSON.parse(lastMessage.data);
 *     addNotification(notification);
 *   }
 * }, [lastMessage]);
 */
export function useEventSource(
  url: string | null,
  options: UseEventSourceOptions = {}
): UseEventSourceReturn {
  const { withCredentials = false, onOpen, onError } = options;

  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<EventSourceReadyState>(0);

  const sourceRef = useRef<EventSource | null>(null);

  // Store callbacks in refs so the effect doesn't depend on them
  const onOpenRef = useRef(onOpen);
  const onErrorRef = useRef(onError);

  onOpenRef.current = onOpen;
  onErrorRef.current = onError;

  const close = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    setLastMessage(null);
    setReadyState(2);
  }, []);

  useEffect(() => {
    if (!url) return;

    const source = new EventSource(url, { withCredentials });
    sourceRef.current = source;
    setReadyState(0);

    source.onopen = (event) => {
      setReadyState(1);
      onOpenRef.current?.(event);
    };

    source.onerror = (event) => {
      setReadyState(source.readyState as EventSourceReadyState);
      onErrorRef.current?.(event);
    };

    source.onmessage = (event) => {
      setLastMessage(event);
    };

    return () => {
      source.close();
    };
  }, [url, withCredentials]);

  return { lastMessage, readyState, close };
}
