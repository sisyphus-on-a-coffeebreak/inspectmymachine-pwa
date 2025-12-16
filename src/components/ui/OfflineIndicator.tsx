import React, { useState, useEffect } from 'react';
import { offlineQueue, type QueueStats } from '../../lib/offlineQueue';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { WifiOff, Wifi, AlertCircle, X, RefreshCw } from 'lucide-react';
import { Button } from './button';
import { zIndex } from '../../lib/z-index';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'bottom',
  showDetails = false,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueStats, setQueueStats] = useState<QueueStats>({ total: 0, pending: 0, failed: 0 });
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [queuedRequests, setQueuedRequests] = useState<any[]>([]);

  useEffect(() => {
    // Listen to online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to queue updates
    const unsubscribe = offlineQueue.subscribe((stats) => {
      setQueueStats(stats);
    });

    // Load queued requests with error handling
    const loadQueuedRequests = async () => {
      try {
        const requests = await offlineQueue.getAll();
        setQueuedRequests(requests);
      } catch (error) {
        // Silently handle errors - IndexedDB might be unavailable
        // The queue stats subscription will still work
      }
    };

    loadQueuedRequests();
    // Use longer interval to reduce IndexedDB load
    const interval = setInterval(loadQueuedRequests, 10000); // Update every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleRetry = async () => {
    if (isOnline) {
      await offlineQueue.processQueue();
    }
  };

  const handleClearFailed = async () => {
    await offlineQueue.clearFailed();
    const requests = await offlineQueue.getAll();
    setQueuedRequests(requests);
  };

  const handleClearAll = async () => {
    await offlineQueue.clear();
    setQueuedRequests([]);
  };

  // Don't show if online and no queued requests
  if (isOnline && queueStats.total === 0) {
    return null;
  }

  return (
    <>
      {/* Main Indicator */}
      <div
        style={{
          position: 'fixed',
          [position]: spacing.md,
          right: spacing.md,
          zIndex: zIndex.offlineIndicator, // 9600 - Above modals
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
        }}
      >
        {/* Offline/Queue Status Banner */}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: isOnline ? colors.warning[50] : colors.error[50],
            border: `2px solid ${isOnline ? colors.warning[300] : colors.error[300]}`,
            borderRadius: borderRadius.lg,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            minWidth: '280px',
            cursor: showDetails ? 'pointer' : 'default',
          }}
          onClick={() => showDetails && setShowDetailsPanel(!showDetailsPanel)}
        >
          {isOnline ? (
            <Wifi size={20} color={colors.warning[700]} />
          ) : (
            <WifiOff size={20} color={colors.error[700]} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
              {isOnline ? 'Queued Requests' : 'You\'re Offline'}
            </div>
            {queueStats.total > 0 && (
              <div style={{ ...typography.caption, color: colors.neutral[700] }}>
                {queueStats.pending} pending, {queueStats.failed} failed
              </div>
            )}
          </div>
          {queueStats.total > 0 && isOnline && (
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              icon={<RefreshCw size={14} />}
              style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
            >
              Retry
            </Button>
          )}
        </div>

        {/* Details Panel */}
        {showDetailsPanel && queueStats.total > 0 && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: 'white',
              border: `1px solid ${colors.neutral[200]}`,
              borderRadius: borderRadius.lg,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: '400px',
              overflowY: 'auto',
              minWidth: '400px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <div style={{ ...typography.subheader }}>Queued Requests</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailsPanel(false)}
                icon={<X size={16} />}
                style={{ padding: spacing.xs }}
              />
            </div>

            {queuedRequests.length === 0 ? (
              <div style={{ ...typography.body, color: colors.neutral[600], textAlign: 'center', padding: spacing.lg }}>
                No queued requests
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  {queuedRequests.map((request) => (
                    <div
                      key={request.id}
                      style={{
                        padding: spacing.sm,
                        backgroundColor: colors.neutral[50],
                        borderRadius: borderRadius.md,
                        border: `1px solid ${colors.neutral[200]}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.xs }}>
                        <div style={{ ...typography.body, fontWeight: 600 }}>
                          {request.method} {request.path}
                        </div>
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                          {request.retryCount}/5 retries
                        </div>
                      </div>
                      {request.lastError && (
                        <div style={{ ...typography.caption, color: colors.error[600], marginTop: spacing.xs }}>
                          <AlertCircle size={12} style={{ display: 'inline', marginRight: spacing.xs }} />
                          {request.lastError}
                        </div>
                      )}
                      <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                        Queued: {new Date(request.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTop: `1px solid ${colors.neutral[200]}` }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRetry}
                    disabled={!isOnline}
                    icon={<RefreshCw size={14} />}
                  >
                    Retry All
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClearFailed}
                    icon={<X size={14} />}
                  >
                    Clear Failed
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleClearAll}
                    icon={<X size={14} />}
                  >
                    Clear All
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};





