import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { NetworkError } from '@/components/ui/NetworkError';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';
import { CheckCircle2, XCircle, Clock, Package, Car, ArrowRight, User, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/providers/ToastProvider';
import { formatDistanceToNow } from 'date-fns';

interface ComponentTransfer {
  id: string;
  component_type: 'battery' | 'tyre' | 'spare_part';
  component_id: string;
  component: {
    id: string;
    brand: string;
    model: string;
    name?: string;
    serial_number?: string;
    part_number?: string;
    purchase_cost: number;
  } | null;
  from_vehicle: {
    id: string;
    registration_number: string;
  } | null;
  to_vehicle: {
    id: string;
    registration_number: string;
  };
  requested_by: {
    id: string;
    name: string;
  };
  reason?: string;
  requested_at: string;
  created_at: string;
}

export const ComponentTransferApproval: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [transfers, setTransfers] = useState<ComponentTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<ComponentTransfer | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingTransfers();
  }, []);

  const fetchPendingTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/v1/components/transfers/pending');
      if (response.data.success) {
        setTransfers(response.data.data || []);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transfer: ComponentTransfer) => {
    try {
      setProcessing(transfer.id);
      await apiClient.post(`/v1/components/transfers/${transfer.id}/approve`, {});
      showToast({
        title: 'Success',
        description: 'Transfer approved successfully',
        variant: 'success',
      });
      fetchPendingTransfers();
    } catch (err: any) {
      showToast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to approve transfer',
        variant: 'error',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedTransfer || !rejectionReason.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please provide a rejection reason',
        variant: 'error',
      });
      return;
    }

    try {
      setProcessing(selectedTransfer.id);
      await apiClient.post(`/v1/components/transfers/${selectedTransfer.id}/reject`, {
        rejection_reason: rejectionReason,
      });
      showToast({
        title: 'Success',
        description: 'Transfer rejected successfully',
        variant: 'success',
      });
      setShowRejectModal(false);
      setSelectedTransfer(null);
      setRejectionReason('');
      fetchPendingTransfers();
    } catch (err: any) {
      showToast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to reject transfer',
        variant: 'error',
      });
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getComponentName = (transfer: ComponentTransfer) => {
    if (!transfer.component) return 'Unknown Component';
    if (transfer.component_type === 'spare_part') {
      return transfer.component.name || 'Spare Part';
    }
    return `${transfer.component.brand} ${transfer.component.model}`.trim() || 
           transfer.component.serial_number || 
           transfer.component.part_number || 
           'Component';
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Component Transfer Approvals"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Stockyard', path: '/app/stockyard' },
            { label: 'Transfer Approvals' },
          ]}
        />
        <SkeletonLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Component Transfer Approvals"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Stockyard', path: '/app/stockyard' },
            { label: 'Transfer Approvals' },
          ]}
        />
        <NetworkError error={error} onRetry={fetchPendingTransfers} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl }}>
      <PageHeader
        title="Component Transfer Approvals"
        subtitle={`${transfers.length} pending transfer${transfers.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/app/dashboard' },
          { label: 'Stockyard', path: '/app/stockyard' },
          { label: 'Transfer Approvals' },
        ]}
      />

      {transfers.length === 0 ? (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <EmptyState
            icon={<CheckCircle2 size={48} />}
            title="No Pending Transfers"
            description="All component transfer requests have been processed."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, marginTop: spacing.lg }}>
          {transfers.map((transfer) => (
            <div key={transfer.id} style={{ ...cardStyles.card }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                      <Package size={20} color={colors.primary} />
                      <h3 style={{ ...typography.subheader, margin: 0 }}>
                        {getComponentName(transfer)}
                      </h3>
                      {transfer.component && (
                        <span
                          style={{
                            padding: `${spacing.xs}px ${spacing.sm}px`,
                            backgroundColor: colors.warning[50],
                            color: colors.warning[700],
                            borderRadius: borderRadius.sm,
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {formatCurrency(transfer.component.purchase_cost)}
                        </span>
                      )}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      {transfer.component_type.charAt(0).toUpperCase() + transfer.component_type.slice(1).replace('_', ' ')}
                      {transfer.component?.serial_number && ` • Serial: ${transfer.component.serial_number}`}
                      {transfer.component?.part_number && ` • Part: ${transfer.component.part_number}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <Clock size={16} color={colors.warning[500]} />
                    <span style={{ ...typography.caption, color: colors.warning[600], fontWeight: 600 }}>
                      Pending
                    </span>
                  </div>
                </div>

                {/* Transfer Details */}
                <WideGrid gap="md">
                  {transfer.from_vehicle && (
                    <div>
                      <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                        From Vehicle
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                        <Car size={16} color={colors.neutral[500]} />
                        <span style={{ ...typography.body }}>
                          {transfer.from_vehicle.registration_number}
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      To Vehicle
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <Car size={16} color={colors.primary} />
                      <span style={{ ...typography.body, fontWeight: 600 }}>
                        {transfer.to_vehicle.registration_number}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Requested By
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <User size={16} color={colors.neutral[500]} />
                      <span style={{ ...typography.body }}>
                        {transfer.requested_by.name}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Requested
                    </div>
                    <div style={{ ...typography.body }}>
                      {formatDate(transfer.requested_at)}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[500], marginTop: spacing.xs }}>
                      {formatDistanceToNow(new Date(transfer.requested_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {transfer.reason && (
                  <div
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.neutral[50],
                      borderRadius: borderRadius.md,
                      border: `1px solid ${colors.neutral[200]}`,
                    }}
                  >
                    <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Transfer Reason
                    </div>
                    <div style={{ ...typography.body, color: colors.neutral[700] }}>
                      {transfer.reason}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end', paddingTop: spacing.md, borderTop: `1px solid ${colors.neutral[200]}` }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      navigate(`/app/stockyard/components/${transfer.component_type}/${transfer.component_id}`);
                    }}
                  >
                    View Component
                  </Button>
                  <Button
                    variant="critical"
                    onClick={() => {
                      setSelectedTransfer(transfer);
                      setShowRejectModal(true);
                    }}
                    icon={<XCircle size={18} />}
                    disabled={processing === transfer.id}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleApprove(transfer)}
                    icon={<CheckCircle2 size={18} />}
                    loading={processing === transfer.id}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <Modal
          title="Reject Transfer Request"
          onClose={() => {
            setShowRejectModal(false);
            setSelectedTransfer(null);
            setRejectionReason('');
          }}
          size="md"
          footer={
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedTransfer(null);
                setRejectionReason('');
              }}
              disabled={processing === selectedTransfer?.id}
            >
              Cancel
            </Button>
            <Button
              variant="critical"
              onClick={handleReject}
              loading={processing === selectedTransfer?.id}
              icon={<XCircle size={18} />}
            >
              Reject Transfer
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <div>
            <Label>
              Rejection Reason <span style={{ color: colors.error[500] }}>*</span>
            </Label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this transfer request..."
              rows={4}
              style={{
                width: '100%',
                padding: spacing.md,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[300]}`,
                fontSize: typography.body.fontSize,
                fontFamily: typography.body.fontFamily,
                resize: 'vertical',
                marginTop: spacing.xs,
              }}
            />
          </div>
        </div>
        </Modal>
      )}
    </div>
  );
};

