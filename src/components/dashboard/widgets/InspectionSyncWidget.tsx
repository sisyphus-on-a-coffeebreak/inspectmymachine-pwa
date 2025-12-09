/**
 * Inspection Sync Widget
 * 
 * Displays inspection sync status, queued inspections, and conflicts
 * Provides quick actions to sync and navigate to sync center
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WidgetProps } from '../../../types/widgets';
import { Button } from '../../ui/button';
import { StatusCard } from '../../ui/StatusCard';
import { colors, spacing, typography, borderRadius } from '../../../lib/theme';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Upload, 
  ArrowRight,
  Clock,
  FileText
} from 'lucide-react';
import { 
  listQueuedInspections, 
  subscribeQueuedInspectionCount 
} from '../../../lib/inspection-queue';
import { del } from 'idb-keyval';
import { syncQueuedInspections } from '../../../lib/inspection-submit';
import { useToast } from '../../../providers/ToastProvider';
import { get, keys } from 'idb-keyval';
import type { InspectionDraftRecord } from '../../../lib/inspection-queue';
import { fetchInspectionTemplate } from '../../../lib/inspection-templates';

export const InspectionSyncWidget: React.FC<WidgetProps> = ({ config }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [queuedCount, setQueuedCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Subscribe to queue count changes
  useEffect(() => {
    const unsubscribe = subscribeQueuedInspectionCount((count) => {
      setQueuedCount(count);
      loadConflictCount();
    });

    return unsubscribe;
  }, []);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const queued = await listQueuedInspections();
      setQueuedCount(queued.length);
      await loadConflictCount();
    } catch (error) {
      console.error('Failed to load sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConflictCount = async () => {
    try {
      const allKeys = await keys();
      const draftKeys = allKeys
        .filter((key): key is string => typeof key === 'string' && key.startsWith('inspection-draft:'))
        .sort();
      
      let conflicts = 0;
      
      // Limit to first 10 drafts to avoid performance issues
      const draftsToCheck = draftKeys.slice(0, 10);
      
      for (const key of draftsToCheck) {
        try {
          const draft = await get<InspectionDraftRecord>(key);
          if (!draft || !draft.templateId) continue;
          
          // Skip mock templates
          if (draft.templateId.toLowerCase().includes('mock')) {
            // Clean up mock draft
            await del(key);
            continue;
          }

          // Quick version check without full template fetch
          const draftTemplateVersion = draft.metadata?.templateVersion || 1;
          
          // Only fetch template if we suspect a conflict (draft version is old)
          // For now, we'll do a lightweight check - if metadata doesn't have version, assume potential conflict
          if (!draft.metadata?.templateVersion) {
            // Check if template exists and get version
            try {
              const templateResult = await fetchInspectionTemplate(draft.templateId, { forceRefresh: false });
              if (templateResult.template) {
                const currentVersion = templateResult.template.version || 1;
                if (currentVersion > draftTemplateVersion) {
                  conflicts++;
                }
              }
            } catch (error: any) {
              // If template doesn't exist (404), it's not a conflict - template was deleted
              // Only log non-404 errors
              if (error?.response?.status !== 404) {
                // Failed to check for other reasons, skip silently
              }
              // For 404s, template doesn't exist anymore - not a conflict, just skip
            }
          }
        } catch {
          // Error loading draft, skip
        }
      }
      
      setConflictCount(conflicts);
    } catch (error) {
      console.error('Failed to load conflict count:', error);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const result = await syncQueuedInspections({
        onItem: (event) => {
          if (event.phase === 'error') {
            showToast({
              title: 'Sync Error',
              description: `Failed to sync inspection: ${event.error instanceof Error ? event.error.message : 'Unknown error'}`,
              variant: 'error',
            });
          } else if (event.phase === 'completed') {
            showToast({
              title: 'Success',
              description: 'Inspection synced successfully',
              variant: 'success',
            });
          }
        },
      });

      if (result.total > 0) {
        showToast({
          title: 'Sync Complete',
          description: `Synced ${result.success} of ${result.total} inspection(s)`,
          variant: result.failed > 0 ? 'warning' : 'success',
        });
      } else {
        showToast({
          title: 'No Items',
          description: 'No inspections to sync',
          variant: 'info',
        });
      }

      // Reload data
      await loadData();
    } catch (error) {
      showToast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to sync inspections',
        variant: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleViewSyncCenter = () => {
    navigate('/app/inspections/sync');
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.md, textAlign: 'center', color: colors.neutral[600] }}>
        Loading sync status...
      </div>
    );
  }

  const hasItems = queuedCount > 0 || conflictCount > 0;
  const statusVariant = conflictCount > 0 ? 'warning' : queuedCount > 0 ? 'info' : 'success';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {/* Status Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: spacing.sm 
      }}>
        <StatusCard
          title="Queued"
          message={`${queuedCount} inspection${queuedCount !== 1 ? 's' : ''} waiting`}
          status={queuedCount > 0 ? 'warning' : 'healthy'}
        />
        <StatusCard
          title="Conflicts"
          message={`${conflictCount} template conflict${conflictCount !== 1 ? 's' : ''}`}
          status={conflictCount > 0 ? 'warning' : 'healthy'}
        />
      </div>

      {/* Status Message */}
      {!hasItems ? (
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.success[50],
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.success[200]}`,
          textAlign: 'center',
        }}>
          <CheckCircle size={24} color={colors.success[600]} style={{ marginBottom: spacing.xs }} />
          <p style={{ ...typography.body, color: colors.success[700], margin: 0, fontSize: '14px' }}>
            All inspections synced
          </p>
        </div>
      ) : (
        <div style={{
          padding: spacing.md,
          backgroundColor: statusVariant === 'warning' ? colors.warning[50] : colors.neutral[50],
          borderRadius: borderRadius.md,
          border: `1px solid ${statusVariant === 'warning' ? colors.warning[200] : colors.neutral[200]}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            {statusVariant === 'warning' ? (
              <AlertTriangle size={18} color={colors.warning[600]} />
            ) : (
              <Clock size={18} color={colors.neutral[600]} />
            )}
            <p style={{ ...typography.body, margin: 0, fontSize: '13px', color: colors.neutral[700] }}>
              {conflictCount > 0 
                ? `${conflictCount} template conflict${conflictCount !== 1 ? 's' : ''} need${conflictCount === 1 ? 's' : ''} resolution`
                : `${queuedCount} inspection${queuedCount !== 1 ? 's' : ''} pending sync`
              }
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {hasItems && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleSyncNow}
            disabled={syncing || queuedCount === 0}
            icon={<RefreshCw size={16} className={syncing ? 'spin' : ''} />}
            style={{ width: '100%' }}
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleViewSyncCenter}
          icon={<FileText size={16} />}
          style={{ width: '100%' }}
        >
          View Sync Center
          <ArrowRight size={14} style={{ marginLeft: 'auto' }} />
        </Button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};


