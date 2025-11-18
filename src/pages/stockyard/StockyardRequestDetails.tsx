import React, { useEffect, useState, useMemo } from 'react';
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
import { Warehouse, ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, Calendar, FileText, ListChecks, MapPin, Truck, ShoppingBag, History, Package } from 'lucide-react';
import { addRecentlyViewed } from '../../lib/recentlyViewed';
import { RelatedItems } from '../../components/ui/RelatedItems';
import { useStockyardRequests, useDaysSinceEntry, useChecklist, useStockyardDocuments, useTransporterBids } from '../../lib/queries';
import { DaysSinceEntryWidget } from '../../components/stockyard/DaysSinceEntryWidget';

export const StockyardRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const [request, setRequest] = useState<StockyardRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch related stockyard requests for the same vehicle
  const { data: relatedRequestsData } = useStockyardRequests(
    undefined, // No filters - we'll filter client-side
    { enabled: !!request?.vehicle_id }
  );
  
  // Filter related requests for the same vehicle, excluding current request
  const relatedRequests = useMemo(() => {
    if (!request?.vehicle_id || !relatedRequestsData?.data) return [];
    
    return relatedRequestsData.data
      .filter((r: any) => {
        // Same vehicle, exclude current request
        return r.vehicle_id === request.vehicle_id && r.id !== id;
      })
      .slice(0, 5); // Limit to 5 most recent
  }, [request?.vehicle_id, relatedRequestsData, id]);

  // Fetch days since entry
  const { data: daysSinceEntryData } = useDaysSinceEntry(request?.vehicle_id || undefined);
  const daysSinceEntry = daysSinceEntryData?.find((d) => d.vehicle_id === request?.vehicle_id)?.days_since_entry || 0;

  // Fetch checklist
  const { data: inboundChecklist } = useChecklist(id || '', 'inbound', { enabled: !!id && request?.scan_in_at });
  const { data: outboundChecklist } = useChecklist(id || '', 'outbound', { enabled: !!id && request?.type === 'EXIT' });

  // Fetch documents
  const { data: documents } = useStockyardDocuments(id || '', { enabled: !!id });

  // Fetch transporter bids
  const { data: transporterBids } = useTransporterBids(id || '', { enabled: !!id && request?.type === 'EXIT' });

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
      
      // Track in recently viewed
      if (data && id) {
        addRecentlyViewed({
          id: String(id),
          type: 'stockyard-request',
          title: `Stockyard Request #${id.substring(0, 8)}`,
          subtitle: data.vehicle?.registration_number || data.type || 'Stockyard Request',
          path: `/app/stockyard/${id}`,
        });
      }
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
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Stockyard', path: '/app/stockyard' },
          { label: 'Request Details' }
        ]}
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

      {/* Days Since Entry Widget */}
      {request.scan_in_at && !request.scan_out_at && daysSinceEntry > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <DaysSinceEntryWidget
            daysSinceEntry={daysSinceEntry}
            vehicleRegistration={request.vehicle?.registration_number}
            showAlert={true}
            alertThreshold={30}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <h3 style={{ ...typography.header, marginBottom: spacing.md }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md }}>
          {request.scan_in_at && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/stockyard/requests/${id}/checklist?type=inbound`)}
              style={{ width: '100%' }}
            >
              <ListChecks size={16} style={{ marginRight: spacing.xs }} />
              View Inbound Checklist
            </Button>
          )}
          {request.type === 'EXIT' && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/stockyard/requests/${id}/checklist?type=outbound`)}
              style={{ width: '100%' }}
            >
              <ListChecks size={16} style={{ marginRight: spacing.xs }} />
              View Outbound Checklist
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => navigate(`/app/stockyard/requests/${id}/documents`)}
            style={{ width: '100%' }}
          >
            <FileText size={16} style={{ marginRight: spacing.xs }} />
            View Documents ({documents?.length || 0})
          </Button>
          {request.vehicle_id && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/stockyard/vehicles/${request.vehicle_id}/timeline`)}
              style={{ width: '100%' }}
            >
              <History size={16} style={{ marginRight: spacing.xs }} />
              View Timeline
            </Button>
          )}
          {request.yard_id && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/stockyard/yards/${request.yard_id}/map`)}
              style={{ width: '100%' }}
            >
              <MapPin size={16} style={{ marginRight: spacing.xs }} />
              View Yard Map
            </Button>
          )}
          {request.type === 'EXIT' && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/stockyard/requests/${id}/transporter-bids`)}
              style={{ width: '100%' }}
            >
              <Truck size={16} style={{ marginRight: spacing.xs }} />
              Transporter Bids ({transporterBids?.length || 0})
            </Button>
          )}
          {request.vehicle_id && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/stockyard/vehicles/${request.vehicle_id}/profitability`)}
              style={{ width: '100%' }}
            >
              <ShoppingBag size={16} style={{ marginRight: spacing.xs }} />
              Profitability Analysis
            </Button>
          )}
          {request.scan_in_at && request.vehicle_id && request.type === 'ENTRY' && (
            <Button
              variant="primary"
              onClick={() => navigate(`/app/stockyard/components/create?vehicle_id=${request.vehicle_id}&source=vehicle_entry&stockyard_request_id=${request.id}`)}
              style={{ width: '100%' }}
            >
              <Package size={16} style={{ marginRight: spacing.xs }} />
              Record Components
            </Button>
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

      {/* Transporter Bids (for EXIT requests) */}
      {request.type === 'EXIT' && transporterBids && transporterBids.length > 0 && (
        <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
          <h3 style={{ ...typography.header, marginBottom: spacing.md }}>Transporter Bids</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {transporterBids.map((bid: any) => (
              <div
                key={bid.id}
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.neutral[50],
                  borderRadius: borderRadius.md,
                  border: `1px solid ${bid.status === 'accepted' ? colors.success[300] : colors.neutral[200]}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                      {bid.transporter_name}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      Contact: {bid.transporter_contact}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      Bid: ₹{bid.bid_amount.toLocaleString('en-IN')}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      Estimated Pickup: {formatDate(bid.estimated_pickup_time)}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      backgroundColor:
                        bid.status === 'accepted'
                          ? colors.success[50]
                          : bid.status === 'rejected'
                          ? colors.error[50]
                          : colors.warning[50],
                      color:
                        bid.status === 'accepted'
                          ? colors.success[600]
                          : bid.status === 'rejected'
                          ? colors.error[600]
                          : colors.warning[600],
                      borderRadius: borderRadius.md,
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {bid.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
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

      {/* Related Items */}
      {request && request.vehicle_id && (
        <div style={{ marginTop: spacing.lg, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing.lg }}>
          {/* Related Stockyard Requests Panel */}
          {relatedRequests.length > 0 && (
            <RelatedItems
              title="Related Stockyard Requests"
              items={relatedRequests.map((r: any) => ({
                id: r.id,
                title: `Request #${r.id.substring(0, 8)}`,
                subtitle: `${r.type || 'Request'} - ${r.status || 'Unknown'}`,
                path: `/app/stockyard/${r.id}`,
                icon: '📦',
              }))}
              variant="compact"
            />
          )}
          
          <RelatedItems
            title="Vehicle History"
            items={[
              {
                id: 'all-requests',
                title: 'All Stockyard Requests',
                subtitle: `View all stockyard requests for this vehicle`,
                path: `/app/stockyard?vehicle=${request.vehicle_id}`,
                icon: '📦',
              },
              {
                id: 'inspections',
                title: 'Vehicle Inspections',
                subtitle: 'View inspection history for this vehicle',
                path: `/app/inspections?vehicle=${request.vehicle_id}`,
                icon: '🔍',
              },
              {
                id: 'gate-passes',
                title: 'Gate Passes',
                subtitle: 'View gate passes for this vehicle',
                path: `/app/gate-pass?vehicle=${request.vehicle_id}`,
                icon: '🚪',
              },
            ]}
            variant="compact"
          />
        </div>
      )}

      {ConfirmComponent}
    </div>
  );
};

