/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface ToastOptions {
  id?: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastEntry extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function getVariantStyles(variant: ToastVariant = 'default'): React.CSSProperties {
  switch (variant) {
    case 'success':
      return { backgroundColor: '#ecfdf5', borderColor: '#34d399', color: '#065f46' };
    case 'error':
      return { backgroundColor: '#fef2f2', borderColor: '#f87171', color: '#7f1d1d' };
    case 'warning':
      return { backgroundColor: '#fffbeb', borderColor: '#fbbf24', color: '#78350f' };
    default:
      return { backgroundColor: '#f3f4f6', borderColor: '#9ca3af', color: '#111827' };
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef<Map<string, number>>(new Map());
  const { trigger: hapticTrigger } = useHapticFeedback();

  useEffect(() => {
    const timersRef = timers.current;
    return () => {
      timersRef.forEach((timeout) => window.clearTimeout(timeout));
      timersRef.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timeout = timers.current.get(id);
    if (timeout) {
      window.clearTimeout(timeout);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ duration = 5000, ...options }: ToastOptions) => {
      const id = options.id ?? createId();
      
      // Haptic feedback based on toast variant
      if (options.variant === 'error') {
        hapticTrigger('error');
      } else if (options.variant === 'success') {
        hapticTrigger('success');
      } else if (options.variant === 'warning') {
        hapticTrigger('warning');
      }
      
      setToasts((prev) => {
        const next = prev.filter((toast) => toast.id !== id);
        return [...next, { ...options, id }];
      });

      if (duration > 0) {
        const timeout = window.setTimeout(() => dismissToast(id), duration);
        timers.current.set(id, timeout);
      }

      return id;
    },
    [dismissToast, hapticTrigger],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 1000,
          maxWidth: '360px',
        }}
      >
        {toasts.map((toast) => {
          const styles = getVariantStyles(toast.variant);
          return (
            <div
              key={toast.id}
              role="status"
              style={{
                borderRadius: '12px',
                padding: '12px 16px',
                border: '1px solid',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                ...styles,
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  {toast.title && (
                    <div style={{ fontWeight: 600, marginBottom: toast.description ? 4 : 0 }}>{toast.title}</div>
                  )}
                  {toast.description && <div style={{ fontSize: '14px', lineHeight: 1.4 }}>{toast.description}</div>}
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: styles.color,
                    cursor: 'pointer',
                    fontSize: '16px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
              {(toast.actionLabel && toast.onAction) && (
                <button
                  onClick={() => {
                    toast.onAction?.();
                    dismissToast(toast.id);
                  }}
                  style={{
                    marginTop: '10px',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    color: styles.color,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
