/**
 * Reverb WebSocket Hook using Pusher JS
 * 
 * Connects to Laravel Reverb WebSocket server using Pusher protocol
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import Pusher from 'pusher-js';

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

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const connectingRef = useRef(false); // Prevent multiple connection attempts
  const permanentlyDisabledRef = useRef(false); // Disable after repeated failures

  const connect = useCallback(() => {
    if (!enabled) return;
    if (permanentlyDisabledRef.current) return; // Don't try if permanently disabled
    if (pusherRef.current?.connection.state === 'connected') return;
    if (connectingRef.current) return; // Prevent multiple simultaneous connections

    const reverbHost = import.meta.env.VITE_REVERB_HOST || 'localhost';
    const reverbPort = import.meta.env.VITE_REVERB_PORT || '8080';
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'ws';
    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY || '';

    // In development, disable WebSocket if not explicitly enabled to avoid connection errors
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
      permanentlyDisabledRef.current = true;
      return;
    }

    if (!reverbKey) {
      permanentlyDisabledRef.current = true;
      return;
    }

    connectingRef.current = true;
    setIsConnecting(true);
    setError(null);

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
              const authUrl = `${import.meta.env.VITE_API_ORIGIN || 'http://localhost:8000'}/broadcasting/auth`;
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

      pusher.connection.bind('connected', () => {
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
          return;
        }
        // Only log in production or when explicitly enabled
        if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_WEBSOCKET === 'true') {
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
          return;
        }
        if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_WEBSOCKET === 'true') {
          console.warn('WebSocket server unavailable');
        }
      });

      pusher.connection.bind('failed', () => {
        connectingRef.current = false;
        setIsConnecting(false);
        // Suppress in development unless explicitly enabled
        if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
          permanentlyDisabledRef.current = true;
          return;
        }
        if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_WEBSOCKET === 'true') {
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
      setError(err instanceof Error ? err : new Error('Failed to create WebSocket connection'));
    }
  }, [enabled, onMessage, onError, onOpen, onClose]);

  const disconnect = useCallback(() => {
    connectingRef.current = false;
    if (channelRef.current) {
      channelRef.current.unbind_all();
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    if (pusherRef.current) {
      pusherRef.current.disconnect();
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
    // In development, don't connect unless explicitly enabled
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_WEBSOCKET !== 'true') {
      permanentlyDisabledRef.current = true;
      return;
    }
    
    if (enabled && !pusherRef.current && !permanentlyDisabledRef.current) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // Only depend on enabled to prevent infinite loops

  return {
    isConnected,
    isConnecting,
    error,
    send,
    disconnect,
  };
}

