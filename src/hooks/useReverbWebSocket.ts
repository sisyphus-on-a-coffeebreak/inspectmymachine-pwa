/**
 * Reverb WebSocket Hook using Pusher JS
 * 
 * Connects to Laravel Reverb WebSocket server using Pusher protocol
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Pusher from 'pusher-js';
import { API_ORIGIN } from '../lib/apiConfig';

// Global console suppression for WebSocket errors in development
// This runs at module load time to catch errors before they're logged
if (typeof window !== 'undefined' && import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress WebSocket connection errors from Pusher
    if (message.includes('WebSocket') && (message.includes('failed') || message.includes('closed') || message.includes('connection'))) {
      return; // Suppress
    }
    originalError.apply(console, args);
  };
  
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress WebSocket connection warnings from Pusher
    if (message.includes('WebSocket') && message.includes('connection')) {
      return; // Suppress
    }
    originalWarn.apply(console, args);
  };
}

export interface ReverbWebSocketMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

export interface UseReverbWebSocketOptions {
  enabled?: boolean;
  onMessage?: (message: ReverbWebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface UseReverbWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  send: (message: ReverbWebSocketMessage) => void;
  disconnect: () => void;
}

/**
 * Hook for managing Reverb WebSocket connections via Pusher JS
 */
export function useReverbWebSocket(options: UseReverbWebSocketOptions = {}): UseReverbWebSocketReturn {
  const {
    enabled = true,
    onMessage,
    onError,
    onOpen,
    onClose,
  } = options;

  // Early check: If WebSocket is disabled in development, return immediately
  // This prevents any Pusher-related code from running
  const isWebSocketDisabled = useMemo(() => {
    if (!enabled) return true;
    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY || '';
    // In development, disable WebSocket unless explicitly enabled
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
      return true;
    }
    if (!reverbKey || reverbKey.trim() === '') {
      return true;
    }
    return false;
  }, [enabled]);

  // Early return if WebSocket is disabled - return a no-op implementation
  // This prevents any Pusher code from running, including imports
  if (isWebSocketDisabled) {
    return {
      isConnected: false,
      isConnecting: false,
      error: null,
      send: () => {
        // No-op
      },
      disconnect: () => {
        // No-op
      },
    };
  }

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const connectingRef = useRef(false); // Prevent multiple connection attempts
  const permanentlyDisabledRef = useRef(isWebSocketDisabled); // Disable if WebSocket is disabled

  const connect = useCallback(() => {
    // Early exit if WebSocket is disabled - check this first to prevent any Pusher operations
    if (isWebSocketDisabled || !enabled || permanentlyDisabledRef.current) {
      permanentlyDisabledRef.current = true;
      return;
    }
    if (pusherRef.current?.connection.state === 'connected') return;
    if (connectingRef.current) return; // Prevent multiple simultaneous connections

    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY || '';
    
    // Double-check: if no key, don't proceed
    if (!reverbKey || reverbKey.trim() === '') {
      permanentlyDisabledRef.current = true;
      return;
    }

    const reverbHost = import.meta.env.VITE_REVERB_HOST || 'localhost';
    const reverbPort = import.meta.env.VITE_REVERB_PORT || '8080';
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'ws';

    connectingRef.current = true;
    setIsConnecting(true);
    setError(null);

    // Store original console methods for restoration
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Suppress Pusher's internal error logging in development
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
      // Suppress WebSocket-related errors in development
      console.error = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        // Only suppress WebSocket connection errors
        if (message.includes('WebSocket') && (message.includes('failed') || message.includes('closed'))) {
          return; // Suppress this error
        }
        originalError.apply(console, args);
      };
      console.warn = (...args: any[]) => {
        const message = args[0]?.toString() || '';
        // Only suppress WebSocket connection warnings
        if (message.includes('WebSocket') && message.includes('connection')) {
          return; // Suppress this warning
        }
        originalWarn.apply(console, args);
      };
    }

    try {
      // Configure Pusher for Reverb
      // Reverb uses the Pusher protocol but with custom host/port
      const pusher = new Pusher(reverbKey, {
        wsHost: reverbHost,
        wsPort: parseInt(reverbPort),
        wssPort: parseInt(reverbPort),
        forceTLS: reverbScheme === 'wss',
        enabledTransports: reverbScheme === 'wss' ? ['wss'] : ['ws'],
        disableStats: true,
        cluster: '', // Reverb doesn't use cluster - empty string is required
        // Suppress Pusher's internal logging unless explicitly enabled
        enableLogging: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true',
        // Custom authorizer: skip auth for public channels
        authorizer: (channel: any, options: any) => {
          return {
            authorize: (socketId: string, callback: Function) => {
              // Public channels (no 'private-' or 'presence-' prefix) don't need auth
              if (!channel.name.startsWith('private-') && !channel.name.startsWith('presence-')) {
                // Public channel - authorize immediately without server call
                callback(null, { auth: '' });
                return;
              }
              // Private/presence channels need authentication
              const authUrl = `${API_ORIGIN}/broadcasting/auth`;
              fetch(authUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                credentials: 'include',
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              })
                .then(response => response.json())
                .then(data => callback(null, data))
                .catch(error => callback(error, null));
            }
          };
        },
      });

      pusherRef.current = pusher;
      
      // Restore console methods after Pusher is created
      // Pusher will log errors during connection attempts, but we've suppressed them
      if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
        // Keep console suppressed during connection lifecycle
        // Will restore in error handlers or after successful connection
      }

      pusher.connection.bind('connected', () => {
        // Restore console methods on successful connection
        if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
          console.error = originalError;
          console.warn = originalWarn;
        }
        connectingRef.current = false;
        setIsConnected(true);
        setIsConnecting(false);
        onOpen?.();

        // Subscribe to dashboard channel (public channel, no auth needed)
        try {
          const channel = pusher.subscribe('dashboard.stats');
          channelRef.current = channel;

          // Listen for subscription success
          channel.bind('pusher:subscription_succeeded', () => {
            // Channel subscribed successfully
          });

          // Listen for subscription error
          channel.bind('pusher:subscription_error', (status: number) => {
            // Silently handle subscription errors - fallback to polling
            console.warn('WebSocket channel subscription failed, using polling fallback');
          });

          // Listen for dashboard updates
          channel.bind('dashboard.stats.update', (data: any) => {
            onMessage?.({
              type: 'dashboard.stats.update',
              data,
              timestamp: Date.now(),
            });
          });

          channel.bind('dashboard.stats.partial', (data: any) => {
            onMessage?.({
              type: 'dashboard.stats.partial',
              data,
              timestamp: Date.now(),
            });
          });
        } catch (err) {
          // Log subscription errors in development
          if (import.meta.env.DEV) {
            console.warn('Failed to subscribe to dashboard channel:', err);
          }
        }
      });

      pusher.connection.bind('disconnected', () => {
        connectingRef.current = false;
        setIsConnected(false);
        setIsConnecting(false);
        onClose?.();
      });

      pusher.connection.bind('error', (err: any) => {
        connectingRef.current = false;
        setIsConnecting(false);
        // Suppress errors in development unless explicitly enabled
        // This prevents console spam when Reverb server is not running
        if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
          // Silently disable - don't log errors
          permanentlyDisabledRef.current = true;
          // Disconnect immediately to prevent further error logs
          try {
            pusher.disconnect();
          } catch {
            // Ignore disconnect errors
          }
          return;
        }
        // Only log in production or when explicitly enabled
        if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_WEBSOCKET === 'true') {
          console.warn('WebSocket connection error:', err?.error || err);
        }
        if (onError) {
          try {
            onError(err);
          } catch {
            // Ignore errors in error handler
          }
        }
      });

      pusher.connection.bind('unavailable', () => {
        connectingRef.current = false;
        setIsConnecting(false);
        // Suppress in development unless explicitly enabled
        if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
          permanentlyDisabledRef.current = true;
          // Disconnect immediately to prevent further error logs
          try {
            pusher.disconnect();
          } catch {
            // Ignore disconnect errors
          }
          return;
        }
        // Only log in production when explicitly enabled
        if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_WEBSOCKET === 'true') {
          console.warn('WebSocket server unavailable');
        }
      });

      pusher.connection.bind('failed', () => {
        connectingRef.current = false;
        setIsConnecting(false);
        // Suppress in development unless explicitly enabled
        if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
          permanentlyDisabledRef.current = true;
          // Disconnect immediately to prevent further error logs
          try {
            pusher.disconnect();
          } catch {
            // Ignore disconnect errors
          }
          return;
        }
        // Only log in production when explicitly enabled
        if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_WEBSOCKET === 'true') {
          console.warn('WebSocket connection failed');
        }
      });

      pusher.connection.bind('state_change', (states: any) => {
        // Handle connection state changes
        if (states.current === 'connected') {
          connectingRef.current = false;
          setIsConnected(true);
          setIsConnecting(false);
        } else if (states.current === 'disconnected' || states.current === 'failed') {
          connectingRef.current = false;
          setIsConnected(false);
          setIsConnecting(false);
        }
      });
    } catch (err) {
      connectingRef.current = false;
      setIsConnecting(false);
      // Suppress errors in development unless explicitly enabled
      if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
        permanentlyDisabledRef.current = true;
        // Don't set error state - silently fail
        return;
      }
      setError(err instanceof Error ? err : new Error('Failed to create WebSocket connection'));
    }
  }, [enabled, onMessage, onError, onOpen, onClose, isWebSocketDisabled]);

  const disconnect = useCallback(() => {
    connectingRef.current = false;
    if (channelRef.current) {
      try {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
      } catch {
        // Ignore unsubscribe errors
      }
      channelRef.current = null;
    }
    if (pusherRef.current) {
      try {
        // Silently disconnect - errors are expected when server is unavailable
        pusherRef.current.disconnect();
      } catch {
        // Ignore disconnect errors - these are expected when WebSocket server is not running
      }
      pusherRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const send = useCallback((message: ReverbWebSocketMessage) => {
    // With Pusher/Reverb, we don't send messages directly
    // Instead, we trigger events on the server side
    // For client-to-server communication, use HTTP API
    console.warn('Direct message sending not supported with Pusher/Reverb. Use HTTP API instead.');
  }, []);

  useEffect(() => {
    // Early exit if WebSocket is disabled - don't even attempt connection
    if (isWebSocketDisabled) {
      permanentlyDisabledRef.current = true;
      return;
    }
    
    // Only connect if enabled and not already connected/disconnected
    if (enabled && !pusherRef.current && !permanentlyDisabledRef.current) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isWebSocketDisabled]); // Include isWebSocketDisabled to re-check when it changes

  return {
    isConnected,
    isConnecting,
    error,
    send,
    disconnect,
  };
}

