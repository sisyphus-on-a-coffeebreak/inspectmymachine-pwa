/**
 * Push Notifications Hook
 * 
 * Hook for managing web push notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../providers/useAuth';
import { apiClient } from '../lib/apiClient';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isSubscribing: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  error: Error | null;
}

/**
 * Hook for managing web push notifications
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      if (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
      ) {
        setIsSupported(true);
        
        // Check current subscription status
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        } catch (err) {
          console.error('Error checking push subscription:', err);
        }
      } else {
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    if (!isSupported || !user) {
      setError(new Error('Push notifications not supported or user not logged in'));
      return;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.VITE_VAPID_PUBLIC_KEY || ''
        ),
      });

      // Send subscription to backend
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      await apiClient.post('/v1/push/subscribe', {
        subscription: subscriptionData,
        user_id: user.id,
      });

      setIsSubscribed(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to subscribe to push notifications');
      setError(error);
      console.error('Push subscription error:', error);
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, user]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!isSupported) {
      return;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Notify backend
        if (user) {
          await apiClient.post('/v1/push/unsubscribe', {
            endpoint: subscription.endpoint,
            user_id: user.id,
          });
        }

        setIsSubscribed(false);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to unsubscribe from push notifications');
      setError(error);
      console.error('Push unsubscription error:', error);
    } finally {
      setIsSubscribing(false);
    }
  }, [isSupported, user]);

  return {
    isSupported,
    isSubscribed,
    isSubscribing,
    subscribe,
    unsubscribe,
    error,
  };
}

/**
 * Convert VAPID public key from URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}


