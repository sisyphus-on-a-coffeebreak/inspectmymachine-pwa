/**
 * Approval Panel Component
 * Handles pass approval and rejection
 */

import React, { useState } from 'react';
import { colors, typography, spacing, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/providers/ToastProvider';

interface ApprovalPanelProps {
  passId: string | number;
  onSuccess: () => void;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({
  passId,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [showPanel, setShowPanel] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await apiClient.post(`/gate-pass-approval/approve/${passId}`, {
        notes: approvalNotes || 'Approved'
      });

      showToast({
        title: 'Success',
        description: 'Pass approved successfully',
        variant: 'success',
      });

      setShowPanel(false);
      setApprovalNotes('');
      onSuccess();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to approve pass',
        variant: 'error',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please provide a rejection reason',
        variant: 'error',
      });
      return;
    }

    try {
      setIsApproving(true);
      await apiClient.post(`/gate-pass-approval/reject/${passId}`, {
        reason: rejectionReason
      });

      showToast({
        title: 'Pass Rejected',
        description: 'Pass has been rejected',
        variant: 'success',
      });

      setShowPanel(false);
      setRejectionReason('');
      onSuccess();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to reject pass',
        variant: 'error',
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div style={{
      padding: spacing.lg,
      backgroundColor: colors.warning[50],
      border: `2px solid ${colors.warning[200]}`,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    }}>
      <h3 style={{
        ...typography.subheader,
        color: colors.warning[700],
        marginBottom: spacing.md,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
      }}>
        ⚠️ Approval Required
      </h3>

      {!showPanel ? (
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="primary"
            onClick={() => setShowPanel(true)}
            size="lg"
            style={{ flex: 1 }}
          >
            Review & Approve
          </Button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: spacing.md }}>
            <label style={{
              ...typography.label,
              display: 'block',
              marginBottom: spacing.xs,
              color: colors.neutral[700],
            }}>
              Approval Notes (Optional)
            </label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any notes or comments..."
              style={{
                width: '100%',
                minHeight: '60px',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: spacing.md }}>
            <label style={{
              ...typography.label,
              display: 'block',
              marginBottom: spacing.xs,
              color: colors.error[700],
            }}>
              Rejection Reason (Required if rejecting)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              style={{
                width: '100%',
                minHeight: '60px',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              onClick={() => {
                setShowPanel(false);
                setApprovalNotes('');
                setRejectionReason('');
              }}
              disabled={isApproving}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={handleReject}
              disabled={isApproving || !rejectionReason.trim()}
              style={{ flex: 1, backgroundColor: colors.error[500], color: 'white' }}
            >
              {isApproving ? 'Processing...' : 'Reject'}
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              disabled={isApproving}
              style={{ flex: 1 }}
            >
              {isApproving ? 'Processing...' : 'Approve'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

