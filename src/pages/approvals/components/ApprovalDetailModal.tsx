import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UnifiedApproval } from '../../../hooks/useUnifiedApprovals';
import { useToast } from '../../../providers/ToastProvider';
import { apiClient } from '../../../lib/apiClient';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/button';
import { colors, spacing, typography } from '../../../lib/theme';
import { formatDistanceToNow } from 'date-fns';
import { ReceiptPreview } from '../../../components/ui/ReceiptPreview';

interface ApprovalDetailModalProps {
  approval: UnifiedApproval;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

const typeConfig: Record<
  UnifiedApproval['type'],
  { icon: string; color: string; label: string }
> = {
  gate_pass: { icon: '🎫', color: colors.primary, label: 'Gate Pass' },
  expense: { icon: '💰', color: colors.success[500], label: 'Expense' },
  transfer: { icon: '📦', color: colors.warning[500], label: 'Transfer' },
};

export function ApprovalDetailModal({
  approval,
  isOpen,
  onClose,
  onApprove: onApproveSuccess,
  onReject: onRejectSuccess,
}: ApprovalDetailModalProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [comment, setComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const config = typeConfig[approval.type];

  const handleApprove = async () => {
    if (!approval.actions.canApprove) return;

    setProcessing(true);
    setAction('approve');

    try {
      const id = approval.id.replace(`${approval.type}_`, '');

      if (approval.type === 'gate_pass') {
        await apiClient.post(`/gate-pass-approval/approve/${id}`, {
          notes: comment,
        });
      } else if (approval.type === 'expense') {
        await apiClient.post(`/expense-approval/approve/${id}`, {
          notes: comment,
        });
      } else if (approval.type === 'transfer') {
        await apiClient.post(`/v1/components/transfers/${id}/approve`, {
          notes: comment,
        });
      }

      showToast({
        title: 'Success',
        description: 'Approval processed successfully',
        variant: 'success',
      });
      onApproveSuccess();
      onClose();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to approve',
        variant: 'error',
      });
    } finally {
      setProcessing(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    if (!approval.actions.canReject || !rejectionReason.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please provide a rejection reason',
        variant: 'error',
      });
      return;
    }

    setProcessing(true);
    setAction('reject');

    try {
      const id = approval.id.replace(`${approval.type}_`, '');

      if (approval.type === 'gate_pass') {
        await apiClient.post(`/gate-pass-approval/reject/${id}`, {
          reason: rejectionReason,
        });
      } else if (approval.type === 'expense') {
        await apiClient.post(`/expense-approval/reject/${id}`, {
          reason: rejectionReason,
        });
      } else if (approval.type === 'transfer') {
        await apiClient.post(`/v1/components/transfers/${id}/reject`, {
          reason: rejectionReason,
        });
      }

      showToast({
        title: 'Success',
        description: 'Rejection processed successfully',
        variant: 'success',
      });
      onRejectSuccess();
      onClose();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to reject',
        variant: 'error',
      });
    } finally {
      setProcessing(false);
      setAction(null);
    }
  };

  const handleViewDetails = () => {
    onClose();
    if (approval.type === 'gate_pass') {
      navigate(`/app/gate-pass/${approval.metadata.pass_id}`);
    } else if (approval.type === 'expense') {
      navigate(`/app/expenses/${approval.metadata.expense_id}`);
    } else if (approval.type === 'transfer') {
      navigate(`/app/stockyard/components/${approval.metadata.component_type}/${approval.metadata.component_id}`);
    }
  };

  const renderContent = () => {
    switch (approval.type) {
      case 'gate_pass':
        return (
          <div>
            <div style={{ marginBottom: spacing.md }}>
              <div style={{ display: 'grid', gap: spacing.sm }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Pass Type:</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {approval.metadata.pass_type}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Purpose:</span>
                  <span style={{ fontWeight: 600 }}>{approval.title}</span>
                </div>
                {approval.metadata.valid_from && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Valid From:</span>
                    <span style={{ fontWeight: 600 }}>
                      {new Date(approval.metadata.valid_from as string).toLocaleString()}
                    </span>
                  </div>
                )}
                {approval.metadata.valid_to && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Valid To:</span>
                    <span style={{ fontWeight: 600 }}>
                      {new Date(approval.metadata.valid_to as string).toLocaleString()}
                    </span>
                  </div>
                )}
                {approval.metadata.urgency && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Urgency:</span>
                    <span
                      style={{
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        color:
                          approval.metadata.urgency === 'urgent'
                            ? colors.error[500]
                            : approval.metadata.urgency === 'high'
                            ? colors.warning[500]
                            : colors.neutral[600],
                      }}
                    >
                      {approval.metadata.urgency as string}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'expense':
        return (
          <div>
            <div style={{ marginBottom: spacing.md }}>
              <div style={{ display: 'grid', gap: spacing.sm }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Amount:</span>
                  <span style={{ fontWeight: 600, fontSize: '18px' }}>
                    ₹{Number(approval.metadata.amount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Category:</span>
                  <span style={{ fontWeight: 600 }}>{approval.metadata.category as string}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Payment Method:</span>
                  <span style={{ fontWeight: 600 }}>
                    {approval.metadata.payment_method as string}
                  </span>
                </div>
                {approval.metadata.project_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Project:</span>
                    <span style={{ fontWeight: 600 }}>
                      {approval.metadata.project_name as string}
                    </span>
                  </div>
                )}
                {approval.metadata.asset_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>Asset:</span>
                    <span style={{ fontWeight: 600 }}>
                      {approval.metadata.asset_name as string}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {approval.metadata.receipt_key && (
              <div style={{ marginTop: spacing.md }}>
                <ReceiptPreview
                  receipts={[
                    {
                      id: approval.id,
                      url: `/storage/${approval.metadata.receipt_key}`,
                      name: `Receipt for ${approval.metadata.category || 'expense'}`,
                    },
                  ]}
                  maxThumbnails={1}
                />
              </div>
            )}
          </div>
        );

      case 'transfer':
        return (
          <div>
            <div style={{ marginBottom: spacing.md }}>
              <div style={{ display: 'grid', gap: spacing.sm }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.neutral[600] }}>Component Type:</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {approval.metadata.component_type as string}
                  </span>
                </div>
                {approval.metadata.from_vehicle && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>From Vehicle:</span>
                    <span style={{ fontWeight: 600 }}>
                      {(approval.metadata.from_vehicle as any)?.registration_number || 'N/A'}
                    </span>
                  </div>
                )}
                {approval.metadata.to_vehicle && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: colors.neutral[600] }}>To Vehicle:</span>
                    <span style={{ fontWeight: 600 }}>
                      {(approval.metadata.to_vehicle as any)?.registration_number || 'N/A'}
                    </span>
                  </div>
                )}
                {approval.metadata.reason && (
                  <div style={{ marginTop: spacing.sm }}>
                    <div style={{ color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Reason:
                    </div>
                    <div style={{ padding: spacing.sm, backgroundColor: colors.neutral[50], borderRadius: '8px' }}>
                      {approval.metadata.reason as string}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ fontSize: '24px' }}>{config.icon}</span>
          <span>{approval.referenceNumber}</span>
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: config.color + '20',
              color: config.color,
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {config.label}
          </span>
        </div>
      }
      size="large"
    >
      <div>
        <div style={{ marginBottom: spacing.lg }}>
          <div
            style={{
              ...typography.header,
              fontSize: '18px',
              marginBottom: spacing.sm,
            }}
          >
            {approval.title}
          </div>
          <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.sm }}>
            {approval.subtitle}
          </div>
          <div style={{ ...typography.caption, color: colors.neutral[500] }}>
            Requested by {approval.requestedBy.name} •{' '}
            {formatDistanceToNow(approval.requestedAt, { addSuffix: true })}
          </div>
        </div>

        {renderContent()}

        {approval.actions.canApprove && (
          <div style={{ marginTop: spacing.xl }}>
            <div style={{ marginBottom: spacing.md }}>
              <label
                style={{
                  ...typography.label,
                  display: 'block',
                  marginBottom: spacing.xs,
                }}
              >
                Approval Notes (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add notes about your decision..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label
                style={{
                  ...typography.label,
                  display: 'block',
                  marginBottom: spacing.xs,
                }}
              >
                Rejection Reason (Required for rejection)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide reason for rejection..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: spacing.sm,
                justifyContent: 'flex-end',
                paddingTop: spacing.md,
                borderTop: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <Button variant="secondary" onClick={onClose} disabled={processing}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleViewDetails}>
                View Details
              </Button>
              <Button
                variant="secondary"
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim() || action === 'approve'}
              >
                {processing && action === 'reject' ? 'Rejecting...' : 'Reject'}
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={processing || action === 'reject'}
              >
                {processing && action === 'approve' ? 'Approving...' : 'Approve'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}










