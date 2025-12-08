/**
 * WebSocket Hook
 * 
 * Manages WebSocket connection for real-time updates
 * Gracefully degrades if WebSocket is not available
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

export interface UseWebSocketOptions {
  url?: string;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  send: (message: WebSocketMessage) => void;
  reconnect: () => void;
  disconnect: () => void;
}

/**
 * Hook for managing WebSocket connections
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    url,
    enabled = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    onMessage,
    onError,
    onOpen,
    onClose,
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const permanentlyDisabledRef = useRef(false); // Stop trying if server is permanently unavailable
  const hasAttemptedRef = useRef(false); // Track if we've attempted connection at least once

  // Get WebSocket URL from environment or construct from API origin
  const getWebSocketUrl = useCallback((): string | null => {
    if (url) return url;
    
    // Use Reverb WebSocket server (default port 8080)
    const reverbHost = import.meta.env.VITE_REVERB_HOST || 'localhost';
    const reverbPort = import.meta.env.VITE_REVERB_PORT || '8080';
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'ws';
    
    // In development, check if WebSocket is explicitly enabled
    // If not, disable WebSocket to avoid connection errors
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
      // But allow if Reverb is configured
      if (!reverbHost || reverbHost === 'localhost' && reverbPort === '8080') {
        // Reverb is likely running, try to connect
      } else {
        return null; // Disable WebSocket in dev unless explicitly enabled
      }
    }
    
    // Use Reverb WebSocket URL
    return `${reverbScheme}://${reverbHost}:${reverbPort}/app/${import.meta.env.VITE_REVERB_APP_KEY || ''}`;
  }, [url]);

  const connect = useCallback(() => {
    if (!enabled) return;
    if (permanentlyDisabledRef.current) return; // Don't try if permanently disabled
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (isConnecting) return;

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      permanentlyDisabledRef.current = true;
      return;
    }

    // Mark that we've attempted connection
    hasAttemptedRef.current = true;

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        permanentlyDisabledRef.current = false; // Reset on successful connection
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (err) {
          // Silently handle parse errors
        }
      };

      ws.onerror = (event) => {
        // Silently handle errors - don't propagate to console
        // Call onError callback if provided, but don't log
        if (onError) {
          try {
            onError(event);
          } catch {
            // Ignore errors in error handler
          }
        }
        // Immediately disable after first error to prevent retries
        permanentlyDisabledRef.current = true;
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
        onClose?.();

        // Disable permanently after ANY close event (connection failed or refused)
        // This prevents console spam from repeated connection attempts
        permanentlyDisabledRef.current = true;
      };

      setSocket(ws);
    } catch (err) {
      setIsConnecting(false);
      permanentlyDisabledRef.current = true; // Disable on creation failure
      // Silently fail - don't log errors
    }
  }, [enabled, getWebSocketUrl, isConnecting, maxReconnectAttempts, reconnectInterval, onMessage, onError, onOpen, onClose]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setSocket(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(() => connect(), 1000);
  }, [connect, disconnect]);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: Date.now(),
      }));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    send,
    reconnect,
    disconnect,
  };
}


