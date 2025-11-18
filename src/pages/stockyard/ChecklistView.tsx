/**
 * Condition Verification & Release Checklist
 * 
 * Inbound/outbound checklist with auto-generation from scan data
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '../../lib/theme';
import { useChecklist, useStockyardRequests, useUpdateChecklistItem, useCompleteChecklist } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import { CheckCircle2, XCircle, Clock, Camera, FileText, AlertCircle, ArrowLeft } from 'lucide-react';
import type { ChecklistItem } from '../../lib/stockyard';
import { useQueryClient } from '@tanstack/react-query';
import { canCompleteChecklist, getChecklistCompletion } from '../../lib/stockyard-utils';

export const ChecklistView: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [checklistType, setChecklistType] = useState<'inbound' | 'outbound'>('inbound');
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const { data: checklist, isLoading, isError, error, refetch } = useChecklist(
    requestId || '',
    checklistType
  );
  const { data: request } = useStockyardRequests({ page: 1, per_page: 1 });

  const updateItemMutation = useUpdateChecklistItem({
    onSuccess: () => {
      showToast({
        title: 'Updated',
        description: 'Checklist item updated',
        variant: 'success',
      });
      setUpdatingItemId(null);
    },
    onError: (error: any) => {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to update item',
        variant: 'error',
      });
      setUpdatingItemId(null);
    },
  });

  const completeChecklistMutation = useCompleteChecklist({
    onSuccess: () => {
      showToast({
        title: 'Success',
        description: 'Checklist completed successfully',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['stockyard'] });
    },
    onError: (error: any) => {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to complete checklist',
        variant: 'error',
      });
    },
  });

  const handleItemUpdate = async (itemId: string, value: string | number | boolean) => {
    if (!checklist) return;
    setUpdatingItemId(itemId);
    updateItemMutation.mutate({ checklistId: checklist.id, itemId, data: { value } });
  };

  const handleComplete = async () => {
    if (!checklist) return;

    const { canComplete, missingRequired } = canCompleteChecklist(checklist);
    if (!canComplete) {
      showToast({
        title: 'Incomplete',
        description: `Please complete ${missingRequired} required item(s)`,
        variant: 'error',
      });
      return;
    }

    completeChecklistMutation.mutate({ checklistId: checklist.id });
  };

  const renderItem = (item: ChecklistItem) => {
    const isUpdating = updatingItemId === item.id;
    const isComplete = item.value !== null && item.value !== undefined && item.value !== '';

    switch (item.type) {
      case 'boolean':
        return (
          <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
            <Button
              variant={item.value === true ? 'primary' : 'secondary'}
              onClick={() => handleItemUpdate(item.id, true)}
              disabled={isUpdating}
              style={{ minWidth: '100px' }}
            >
              <CheckCircle2 size={16} style={{ marginRight: spacing.xs }} />
              Yes
            </Button>
            <Button
              variant={item.value === false ? 'primary' : 'secondary'}
              onClick={() => handleItemUpdate(item.id, false)}
              disabled={isUpdating}
              style={{ minWidth: '100px' }}
            >
              <XCircle size={16} style={{ marginRight: spacing.xs }} />
              No
            </Button>
          </div>
        );

      case 'text':
        return (
          <textarea
            value={(item.value as string) || ''}
            onChange={(e) => handleItemUpdate(item.id, e.target.value)}
            disabled={isUpdating}
            placeholder="Enter details..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: spacing.md,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(item.value as number) || ''}
            onChange={(e) => handleItemUpdate(item.id, parseFloat(e.target.value) || 0)}
            disabled={isUpdating}
            placeholder="Enter number..."
            style={{
              width: '100%',
              padding: spacing.md,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
            }}
          />
        );

      case 'photo':
        return (
          <div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // TODO: Upload photo and get URL
                // For now, just show a placeholder
                showToast({
                  title: 'Photo Upload',
                  description: 'Photo upload functionality will be implemented',
                  variant: 'info',
                });
              }}
              disabled={isUpdating}
              style={{ display: 'none' }}
              id={`photo-${item.id}`}
            />
            <label
              htmlFor={`photo-${item.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.md,
                border: `2px dashed ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                backgroundColor: colors.neutral[50],
              }}
            >
              <Camera size={20} color={colors.primary} />
              <span>Capture Photo</span>
            </label>
            {item.photos && item.photos.length > 0 && (
              <div style={{ marginTop: spacing.sm, display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
                {item.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`Photo ${idx + 1}`}
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: borderRadius.sm,
                      border: `1px solid ${colors.neutral[300]}`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Checklist" subtitle="Condition verification checklist" icon={<FileText size={24} />} />
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Checklist" subtitle="Condition verification checklist" icon={<FileText size={24} />} />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Checklist" subtitle="Condition verification checklist" icon={<FileText size={24} />} />
        <EmptyState
          icon={<FileText size={48} />}
          title="No Checklist Found"
          description="Checklist will be auto-generated when vehicle is scanned in"
        />
      </div>
    );
  }

  const completedItems = checklist.items.filter((item) => item.value !== null && item.value !== undefined && item.value !== '').length;
  const totalItems = checklist.items.length;
  const requiredItems = checklist.items.filter((item) => item.required);
  const incompleteRequired = requiredItems.filter((item) => !item.value || item.value === '').length;

  const statusColor =
    checklist.status === 'completed'
      ? colors.success[500]
      : checklist.status === 'blocked'
      ? colors.error[500]
      : checklist.status === 'in_progress'
      ? colors.warning[500]
      : colors.neutral[500];

  return (
    <div style={{ padding: spacing.xl }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: spacing.xs }} />
          Back
        </Button>
        <PageHeader
          title={`${checklistType === 'inbound' ? 'Inbound' : 'Outbound'} Checklist`}
          subtitle={`Request ID: ${requestId?.substring(0, 8)}...`}
          icon={<FileText size={24} />}
        />
      </div>

      {/* Checklist Header */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <span
                style={{
                  padding: '4px 12px',
                  backgroundColor: statusColor,
                  color: 'white',
                  borderRadius: borderRadius.md,
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {checklist.status.toUpperCase()}
              </span>
              {checklist.auto_generated && (
                <span
                  style={{
                    padding: '4px 12px',
                    backgroundColor: colors.primary + '20',
                    color: colors.primary,
                    borderRadius: borderRadius.md,
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Auto-Generated
                </span>
              )}
            </div>
            <div style={{ ...typography.body, color: colors.neutral[600] }}>
              {completedItems} of {totalItems} items completed ({getChecklistCompletion(checklist)}%)
            </div>
          </div>
          {checklist.status !== 'completed' && (
            <Button variant="primary" onClick={handleComplete} disabled={incompleteRequired > 0}>
              <CheckCircle2 size={16} style={{ marginRight: spacing.xs }} />
              Complete Checklist
            </Button>
          )}
        </div>

        {incompleteRequired > 0 && (
          <div
            style={{
              padding: spacing.md,
              backgroundColor: colors.warning[50],
              border: `1px solid ${colors.warning[300]}`,
              borderRadius: borderRadius.md,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <AlertCircle size={18} color={colors.warning[600]} />
            <span style={{ ...typography.bodySmall, color: colors.warning[700] }}>
              {incompleteRequired} required item(s) must be completed
            </span>
          </div>
        )}
      </div>

      {/* Checklist Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {checklist.items
          .sort((a, b) => a.order - b.order)
          .map((item) => {
            const isComplete = item.value !== null && item.value !== undefined && item.value !== '';
            const isUpdating = updatingItemId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  ...cardStyles.card,
                  borderLeft: `4px solid ${isComplete ? colors.success[500] : item.required ? colors.error[500] : colors.neutral[300]}`,
                }}
              >
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                    <span style={{ ...typography.body, fontWeight: 600 }}>
                      {item.label}
                    </span>
                    {item.required && (
                      <span
                        style={{
                          padding: '2px 8px',
                          backgroundColor: colors.error[50],
                          color: colors.error[600],
                          borderRadius: borderRadius.sm,
                          fontSize: '10px',
                          fontWeight: 600,
                        }}
                      >
                        REQUIRED
                      </span>
                    )}
                    {isComplete && (
                      <CheckCircle2 size={16} color={colors.success[500]} />
                    )}
                    {isUpdating && <Clock size={16} color={colors.neutral[500]} />}
                  </div>
                  {item.notes && (
                    <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                      {item.notes}
                    </div>
                  )}
                </div>

                {renderItem(item)}

                {item.verified_by && item.verified_at && (
                  <div style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTop: `1px solid ${colors.neutral[200]}` }}>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      Verified by {item.verified_by} on {new Date(item.verified_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

