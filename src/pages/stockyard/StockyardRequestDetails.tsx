import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';
import {
  getStockyardRequest,
  approveStockyardRequest,
  rejectStockyardRequest,
  cancelStockyardRequest,
  type StockyardRequest,
} from '../../lib/stockyard';
import { Warehouse, ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, Calendar } from 'lucide-react';

export const StockyardRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const [request, setRequest] = useState<StockyardRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getStockyardRequest(id);
      setRequest(data);
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch request',
        variant: 'error',
      });
      navigate('/app/stockyard');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id || !request) return;
    const confirmed = await confirm({
      title: 'Approve Request',
      message: 'Are you sure you want to approve this stockyard request?',
      confirmText: 'Approve',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await approveStockyardRequest(id, {
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      });
      showToast({
        title: 'Success',
        description: 'Request approved successfully',
        variant: 'success',
      });
      fetchRequest();
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve request',
        variant: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !request) return;
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading(true);
      await rejectStockyardRequest(id, reason);
      showToast({
        title: 'Success',
        description: 'Request rejected successfully',
        variant: 'success',
      });
      fetchRequest();
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject request',
        variant: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !request) return;
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      setActionLoading(true);
      await cancelStockyardRequest(id, reason);
      showToast({
        title: 'Success',
        description: 'Request cancelled successfully',
        variant: 'success',
      });
      fetchRequest();
    } catch (err) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to cancel request',
        variant: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.md }}>📦</div>
        <div style={{ color: colors.neutral[600] }}>Loading request details...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Request Not Found" icon={<Warehouse size={24} />} />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return colors.success[500];
      case 'Rejected':
        return colors.error[500];
      case 'Submitted':
        return colors.warning[500];
      case 'Cancelled':
        return colors.neutral[500];
      default:
        return colors.neutral[400];
    }
  };

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1000px', margin: '0 auto' }}>
      <PageHeader
        title="Stockyard Request Details"
        subtitle={`Request ID: ${request.id.substring(0, 8)}...`}
        icon={<Warehouse size={24} />}
      />

      <div style={{ marginBottom: spacing.md }}>
        <Button variant="secondary" onClick={() => navigate('/app/stockyard')}>
          <ArrowLeft size={16} style={{ marginRight: spacing.xs }} />
          Back to Dashboard
        </Button>
      </div>

      {/* Status Card */}
      <div
        style={{
          ...cardStyles.card,
          borderLeft: `4px solid ${getStatusColor(request.status)}`,
          marginBottom: spacing.lg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <div
            style={{
              padding: spacing.md,
              backgroundColor: getStatusColor(request.status) + '20',
              borderRadius: '8px',
            }}
          >
            {request.status === 'Approved' && <CheckCircle2 size={24} color={getStatusColor(request.status)} />}
            {request.status === 'Rejected' && <XCircle size={24} color={getStatusColor(request.status)} />}
            {request.status === 'Submitted' && <Clock size={24} color={getStatusColor(request.status)} />}
            {request.status === 'Cancelled' && <AlertCircle size={24} color={getStatusColor(request.status)} />}
          </div>
          <div>
            <div style={{ ...typography.header, margin: 0 }}>Status: {request.status}</div>
            <div style={{ ...typography.caption, color: colors.neutral[600] }}>
              Type: {request.type}
            </div>
          </div>
        </div>
      </div>

      {/* Request Information */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <h3 style={{ ...typography.header, marginBottom: spacing.md }}>Request Information</h3>
        <div style={{ display: 'grid', gap: spacing.md }}>
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600] }}>Vehicle</div>
            <div style={{ ...typography.body }}>
              {request.vehicle?.registration_number || 'Unknown'} {request.vehicle?.make && request.vehicle?.model ? `(${request.vehicle.make} ${request.vehicle.model})` : ''}
            </div>
          </div>
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600] }}>Stockyard</div>
            <div style={{ ...typography.body }}>{request.yard?.name || 'Unknown'}</div>
          </div>
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600] }}>Requested By</div>
            <div style={{ ...typography.body }}>
              {request.requester?.name || 'Unknown'} ({request.requester?.employee_id || 'N/A'})
            </div>
          </div>
          {request.valid_from && request.valid_to && (
            <>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600] }}>Valid From</div>
                <div style={{ ...typography.body }}>{formatDate(request.valid_from)}</div>
              </div>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600] }}>Valid To</div>
                <div style={{ ...typography.body }}>{formatDate(request.valid_to)}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scan Information */}
      {(request.scan_in_at || request.scan_out_at) && (
        <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
          <h3 style={{ ...typography.header, marginBottom: spacing.md }}>Scan Information</h3>
          {request.scan_in_at && (
            <div style={{ marginBottom: spacing.md }}>
              <div style={{ ...typography.label, color: colors.success[600] }}>Scanned In</div>
              <div style={{ ...typography.body }}>{formatDate(request.scan_in_at)}</div>
              {request.scan_in_gatekeeper && (
                <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                  Gatekeeper: {request.scan_in_gatekeeper}
                </div>
              )}
              {request.scan_in_odometer_km && (
                <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                  Odometer: {request.scan_in_odometer_km} km
                </div>
              )}
            </div>
          )}
          {request.scan_out_at && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Scanned Out</div>
              <div style={{ ...typography.body }}>{formatDate(request.scan_out_at)}</div>
              {request.scan_out_gatekeeper && (
                <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                  Gatekeeper: {request.scan_out_gatekeeper}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {request.status === 'Submitted' && (
        <div style={{ ...cardStyles.card }}>
          <h3 style={{ ...typography.header, marginBottom: spacing.md }}>Actions</h3>
          <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={handleApprove} disabled={actionLoading}>
              <CheckCircle2 size={16} style={{ marginRight: spacing.xs }} />
              Approve
            </Button>
            <Button variant="secondary" onClick={handleReject} disabled={actionLoading}>
              <XCircle size={16} style={{ marginRight: spacing.xs }} />
              Reject
            </Button>
            <Button variant="secondary" onClick={handleCancel} disabled={actionLoading}>
              <AlertCircle size={16} style={{ marginRight: spacing.xs }} />
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ConfirmComponent />
    </div>
  );
};

