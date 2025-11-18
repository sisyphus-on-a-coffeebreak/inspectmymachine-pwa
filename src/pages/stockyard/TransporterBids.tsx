/**
 * Transporter & Slot Scheduling Marketplace
 * 
 * Create and manage transporter bids for vehicle exit requests
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/EmptyState';
import { NetworkError } from '../../components/ui/NetworkError';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '../../lib/theme';
import { useTransporterBids, useStockyardRequests, useCreateTransporterBid, useAcceptTransporterBid } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import { Truck, Plus, ArrowLeft, CheckCircle2, XCircle, Clock, DollarSign, Calendar, Phone } from 'lucide-react';
import type { TransporterBid } from '../../lib/stockyard';
import { useQueryClient } from '@tanstack/react-query';

export const TransporterBids: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    transporter_name: '',
    transporter_contact: '',
    bid_amount: '',
    estimated_pickup_time: '',
    notes: '',
  });

  const { data: bids, isLoading, isError, error, refetch } = useTransporterBids(requestId || '');
  const { data: requestData } = useStockyardRequests({ page: 1, per_page: 1 });

  const createBidMutation = useCreateTransporterBid({
    onSuccess: () => {
      showToast({
        title: 'Success',
        description: 'Transporter bid created successfully',
        variant: 'success',
      });
      setShowCreateModal(false);
      setFormData({
        transporter_name: '',
        transporter_contact: '',
        bid_amount: '',
        estimated_pickup_time: '',
        notes: '',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to create bid',
        variant: 'error',
      });
    },
  });

  const acceptBidMutation = useAcceptTransporterBid({
    onSuccess: () => {
      showToast({
        title: 'Success',
        description: 'Bid accepted successfully',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to accept bid',
        variant: 'error',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId) return;

    createBidMutation.mutate({
      stockyard_request_id: requestId,
      transporter_name: formData.transporter_name,
      transporter_contact: formData.transporter_contact,
      bid_amount: parseFloat(formData.bid_amount),
      estimated_pickup_time: new Date(formData.estimated_pickup_time).toISOString(),
      notes: formData.notes || undefined,
    });
  };

  const handleAccept = async (bidId: string) => {
    acceptBidMutation.mutate(bidId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Transporter Bids" subtitle="Manage transporter bids for vehicle exit" icon={<Truck size={24} />} />
        <SkeletonLoader count={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader title="Transporter Bids" subtitle="Manage transporter bids for vehicle exit" icon={<Truck size={24} />} />
        <NetworkError error={error as Error} onRetry={() => refetch()} />
      </div>
    );
  }

  const bidsList = bids || [];
  const acceptedBid = bidsList.find((b: TransporterBid) => b.status === 'accepted');
  const pendingBids = bidsList.filter((b: TransporterBid) => b.status === 'pending');

  return (
    <div style={{ padding: spacing.xl }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} style={{ marginRight: spacing.xs }} />
          Back
        </Button>
        <PageHeader
          title="Transporter Bids"
          subtitle={`Request ID: ${requestId?.substring(0, 8)}...`}
          icon={<Truck size={24} />}
        />
      </div>

      {/* Create Bid Button */}
      <div style={{ marginBottom: spacing.lg }}>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} style={{ marginRight: spacing.xs }} />
          Create New Bid
        </Button>
      </div>

      {/* Accepted Bid (if any) */}
      {acceptedBid && (
        <div
          style={{
            ...cardStyles.card,
            marginBottom: spacing.lg,
            border: `2px solid ${colors.success[500]}`,
            backgroundColor: colors.success[50],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <CheckCircle2 size={20} color={colors.success[600]} />
            <span style={{ ...typography.header, fontSize: '18px', color: colors.success[700] }}>
              Accepted Bid
            </span>
          </div>
          <BidCard bid={acceptedBid} onAccept={handleAccept} formatCurrency={formatCurrency} formatDate={formatDate} />
        </div>
      )}

      {/* Pending Bids */}
      {pendingBids.length > 0 && (
        <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
          <div style={{ ...typography.header, fontSize: '18px', marginBottom: spacing.md }}>
            Pending Bids ({pendingBids.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {pendingBids.map((bid: TransporterBid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                onAccept={handleAccept}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Bids */}
      {bidsList.length > 0 && (
        <div style={{ ...cardStyles.card }}>
          <div style={{ ...typography.header, fontSize: '18px', marginBottom: spacing.md }}>All Bids</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {bidsList.map((bid: TransporterBid) => (
              <BidCard
                key={bid.id}
                bid={bid}
                onAccept={handleAccept}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {bidsList.length === 0 && (
        <EmptyState
          icon={<Truck size={48} />}
          title="No Transporter Bids"
          description="Create a new bid to get started"
          action={
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} style={{ marginRight: spacing.xs }} />
              Create Bid
            </Button>
          }
        />
      )}

      {/* Create Bid Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              ...cardStyles.card,
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ ...typography.header, marginBottom: spacing.md }}>Create Transporter Bid</div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                <div>
                  <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                    Transporter Name *
                  </label>
                  <input
                    type="text"
                    value={formData.transporter_name}
                    onChange={(e) => setFormData({ ...formData, transporter_name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: spacing.md,
                      border: `1px solid ${colors.neutral[300]}`,
                      borderRadius: borderRadius.md,
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.transporter_contact}
                    onChange={(e) => setFormData({ ...formData, transporter_contact: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: spacing.md,
                      border: `1px solid ${colors.neutral[300]}`,
                      borderRadius: borderRadius.md,
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                    Bid Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.bid_amount}
                    onChange={(e) => setFormData({ ...formData, bid_amount: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: spacing.md,
                      border: `1px solid ${colors.neutral[300]}`,
                      borderRadius: borderRadius.md,
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                    Estimated Pickup Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.estimated_pickup_time}
                    onChange={(e) => setFormData({ ...formData, estimated_pickup_time: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: spacing.md,
                      border: `1px solid ${colors.neutral[300]}`,
                      borderRadius: borderRadius.md,
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: spacing.md,
                      border: `1px solid ${colors.neutral[300]}`,
                      borderRadius: borderRadius.md,
                      fontSize: '14px',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end', marginTop: spacing.lg }}>
                <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={createBidMutation.isPending}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={createBidMutation.isPending}>
                  {createBidMutation.isPending ? 'Creating...' : 'Create Bid'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface BidCardProps {
  bid: TransporterBid;
  onAccept: (bidId: string) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

const BidCard: React.FC<BidCardProps> = ({ bid, onAccept, formatCurrency, formatDate }) => {
  const statusConfig = {
    pending: { color: colors.warning[600], bgColor: colors.warning[50], icon: Clock },
    accepted: { color: colors.success[600], bgColor: colors.success[50], icon: CheckCircle2 },
    rejected: { color: colors.error[600], bgColor: colors.error[50], icon: XCircle },
    completed: { color: colors.primary, bgColor: colors.primary + '15', icon: CheckCircle2 },
  };

  const config = statusConfig[bid.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div
      style={{
        ...cardStyles.card,
        borderLeft: `4px solid ${config.color}`,
        backgroundColor: bid.status === 'accepted' ? config.bgColor : 'white',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Truck size={18} color={colors.primary} />
            <span style={{ ...typography.body, fontWeight: 600 }}>{bid.transporter_name}</span>
            <span
              style={{
                padding: '4px 12px',
                backgroundColor: config.bgColor,
                color: config.color,
                borderRadius: borderRadius.md,
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <StatusIcon size={14} />
              {bid.status.toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Phone size={14} color={colors.neutral[600]} />
              <span style={{ ...typography.bodySmall, color: colors.neutral[700] }}>
                {bid.transporter_contact}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <DollarSign size={14} color={colors.success[600]} />
              <span style={{ ...typography.body, fontWeight: 600, color: colors.success[700] }}>
                {formatCurrency(bid.bid_amount)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Calendar size={14} color={colors.primary} />
              <span style={{ ...typography.bodySmall, color: colors.neutral[700] }}>
                Pickup: {formatDate(bid.estimated_pickup_time)}
              </span>
            </div>
            {bid.notes && (
              <div
                style={{
                  marginTop: spacing.xs,
                  padding: spacing.sm,
                  backgroundColor: colors.neutral[50],
                  borderRadius: borderRadius.sm,
                  ...typography.bodySmall,
                  color: colors.neutral[700],
                }}
              >
                {bid.notes}
              </div>
            )}
          </div>
        </div>
        {bid.status === 'pending' && (
          <div style={{ marginLeft: spacing.md }}>
            <Button variant="primary" size="small" onClick={() => onAccept(bid.id)}>
              <CheckCircle2 size={14} style={{ marginRight: spacing.xs }} />
              Accept
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

