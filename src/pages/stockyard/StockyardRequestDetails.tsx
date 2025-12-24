import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
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
import { Warehouse, ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, Calendar, FileText, ListChecks, MapPin, Truck, ShoppingBag, History, Package, Plus, Battery, Circle, Wrench, ExternalLink, BarChart3, FolderOpen } from 'lucide-react';
import { addRecentlyViewed } from '../../lib/recentlyViewed';
import { RelatedItems } from '../../components/ui/RelatedItems';
import { useStockyardRequests, useDaysSinceEntry, useChecklist, useStockyardDocuments, useTransporterBids, useComponentCustodyEvents } from '../../lib/queries';
import { DaysSinceEntryWidget } from '../../components/stockyard/DaysSinceEntryWidget';
import { ComponentRecordingModal } from '../../components/stockyard/ComponentRecordingModal';
import type { ComponentCustodyEvent } from '../../lib/stockyard';
import { WideGrid, CardGrid } from '../../components/ui/ResponsiveGrid';

export const StockyardRequestDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const [request, setRequest] = useState<StockyardRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [activeActionTab, setActiveActionTab] = useState<'overview' | 'checklists' | 'documents' | 'analytics'>('overview');

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

  // Fetch components recorded for this vehicle/request
  const { data: componentsData, refetch: refetchComponents } = useComponentCustodyEvents(
    {
      vehicle_id: request?.vehicle_id,
      page: 1,
      per_page: 10,
    },
    { enabled: !!request?.vehicle_id && !!request?.scan_in_at }
  );

  const recordedComponents = componentsData?.data?.filter(
    (event: ComponentCustodyEvent) =>
      event.stockyard_request_id === id || 
      (event.event_type === 'install' && event.vehicle_id === request?.vehicle_id)
  ) || [];

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  // Check if we should open component modal from URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('recordComponents') === 'true' && request?.vehicle_id && request.scan_in_at) {
      setShowComponentModal(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [request?.vehicle_id, request?.scan_in_at]);

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

      {/* Quick Actions - Tabbed Interface */}
      <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <h3 style={{ ...typography.header, margin: 0 }}>Quick Actions</h3>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: spacing.xs, 
          borderBottom: `1px solid ${colors.neutral[200]}`,
          marginBottom: spacing.md,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: Package },
            { id: 'checklists', label: 'Checklists', icon: ListChecks },
            { id: 'documents', label: 'Documents', icon: FolderOpen },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveActionTab(tab.id as any)}
                style={{
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  border: 'none',
                  borderBottom: activeActionTab === tab.id ? `2px solid ${colors.primary}` : '2px solid transparent',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  ...typography.body,
                  color: activeActionTab === tab.id ? colors.primary : colors.neutral[600],
                  fontWeight: activeActionTab === tab.id ? 600 : 400,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '120px' }}>
          {/* Overview Tab */}
          {activeActionTab === 'overview' && (
            <WideGrid gap="md">
              {request.scan_in_at && request.vehicle_id && request.type === 'ENTRY' && (
                <Button
                  variant="primary"
                  onClick={() => setShowComponentModal(true)}
                  style={{ width: '100%' }}
                  icon={<Plus size={16} />}
                >
                  Record Components
                </Button>
              )}
              {request.scan_in_at && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActiveActionTab('checklists');
                    navigate(`/app/stockyard/requests/${id}/checklist?type=inbound`);
                  }}
                  style={{ width: '100%' }}
                  icon={<ListChecks size={16} />}
                >
                  Inbound Checklist
                </Button>
              )}
              {request.type === 'EXIT' && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActiveActionTab('checklists');
                    navigate(`/app/stockyard/requests/${id}/checklist?type=outbound`);
                  }}
                  style={{ width: '100%' }}
                  icon={<ListChecks size={16} />}
                >
                  Outbound Checklist
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveActionTab('documents');
                  navigate(`/app/stockyard/requests/${id}/documents`);
                }}
                style={{ width: '100%' }}
                icon={<FileText size={16} />}
              >
                Documents ({documents?.length || 0})
              </Button>
              {request.vehicle_id && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActiveActionTab('analytics');
                    navigate(`/app/stockyard/vehicles/${request.vehicle_id}/timeline`);
                  }}
                  style={{ width: '100%' }}
                  icon={<History size={16} />}
                >
                  View Timeline
                </Button>
              )}
            </WideGrid>
          )}

          {/* Checklists Tab */}
          {activeActionTab === 'checklists' && (
            <WideGrid gap="md">
              {request.scan_in_at && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/app/stockyard/requests/${id}/checklist?type=inbound`)}
                  style={{ width: '100%' }}
                  icon={<ListChecks size={16} />}
                >
                  View Inbound Checklist
                </Button>
              )}
              {request.type === 'EXIT' && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/app/stockyard/requests/${id}/checklist?type=outbound`)}
                  style={{ width: '100%' }}
                  icon={<ListChecks size={16} />}
                >
                  View Outbound Checklist
                </Button>
              )}
              {!request.scan_in_at && request.type !== 'EXIT' && (
                <div style={{ 
                  padding: spacing.xl, 
                  textAlign: 'center', 
                  color: colors.neutral[600],
                  gridColumn: '1 / -1'
                }}>
                  Checklists will be available after the vehicle is scanned in.
                </div>
              )}
            </WideGrid>
          )}

          {/* Documents Tab */}
          {activeActionTab === 'documents' && (
            <WideGrid gap="md">
              <Button
                variant="secondary"
                onClick={() => navigate(`/app/stockyard/requests/${id}/documents`)}
                style={{ width: '100%' }}
                icon={<FileText size={16} />}
              >
                View All Documents ({documents?.length || 0})
              </Button>
              {documents && documents.length > 0 && (
                <div style={{ 
                  gridColumn: '1 / -1',
                  padding: spacing.md,
                  backgroundColor: colors.neutral[50],
                  borderRadius: borderRadius.md,
                  marginTop: spacing.sm
                }}>
                  <div style={{ ...typography.label, marginBottom: spacing.xs }}>Recent Documents</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
                    {documents.slice(0, 3).map((doc: any) => (
                      <div
                        key={doc.id}
                        style={{
                          padding: spacing.sm,
                          backgroundColor: 'white',
                          borderRadius: borderRadius.sm,
                          border: `1px solid ${colors.neutral[200]}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                          <FileText size={16} color={colors.neutral[600]} />
                          <span style={{ ...typography.body, fontSize: '14px' }}>{doc.name || doc.filename || 'Document'}</span>
                        </div>
                        <span style={{ ...typography.caption, color: colors.neutral[500] }}>
                          {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </WideGrid>
          )}

          {/* Analytics Tab */}
          {activeActionTab === 'analytics' && (
            <WideGrid gap="md">
              {request.vehicle_id && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/app/stockyard/vehicles/${request.vehicle_id}/timeline`)}
                    style={{ width: '100%' }}
                    icon={<History size={16} />}
                  >
                    Vehicle Timeline
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/app/stockyard/vehicles/${request.vehicle_id}/profitability`)}
                    style={{ width: '100%' }}
                    icon={<ShoppingBag size={16} />}
                  >
                    Profitability Analysis
                  </Button>
                </>
              )}
              {request.yard_id && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/app/stockyard/yards/${request.yard_id}/map`)}
                  style={{ width: '100%' }}
                  icon={<MapPin size={16} />}
                >
                  Yard Map
                </Button>
              )}
              {request.type === 'EXIT' && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/app/stockyard/requests/${id}/transporter-bids`)}
                  style={{ width: '100%' }}
                  icon={<Truck size={16} />}
                >
                  Transporter Bids ({transporterBids?.length || 0})
                </Button>
              )}
            </WideGrid>
          )}
        </div>
      </div>

      {/* Component Recording Section */}
      {request.scan_in_at && request.vehicle_id && request.type === 'ENTRY' && (
        <div style={{ ...cardStyles.card, marginBottom: spacing.lg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <div>
              <h3 style={{ ...typography.subheader, margin: 0, marginBottom: spacing.xs }}>Recorded Components</h3>
              <p style={{ ...typography.caption, color: colors.neutral[600], margin: 0 }}>
                Components recorded for this vehicle entry
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowComponentModal(true)}
              icon={<Plus size={16} />}
            >
              Add Component
            </Button>
          </div>

          {recordedComponents.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {recordedComponents.slice(0, 5).map((event: ComponentCustodyEvent) => {
                const getComponentIcon = () => {
                  if (!event.component) return Package;
                  const type = event.component.type;
                  if (type === 'battery') return Battery;
                  if (type === 'tyre') return Circle;
                  return Wrench;
                };
                const ComponentIcon = getComponentIcon();
                const getComponentColor = () => {
                  if (!event.component) return colors.neutral[500];
                  const type = event.component.type;
                  if (type === 'battery') return colors.warning[500];
                  if (type === 'tyre') return colors.neutral[600];
                  return colors.success[500];
                };

                return (
                  <div
                    key={event.id}
                    style={{
                      padding: spacing.md,
                      backgroundColor: colors.neutral[50],
                      borderRadius: borderRadius.md,
                      border: `1px solid ${colors.neutral[200]}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: event.component_id ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (event.component_id && event.component?.type) {
                        navigate(`/app/stockyard/components/${event.component.type}/${event.component_id}`);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                      <div
                        style={{
                          padding: spacing.sm,
                          backgroundColor: getComponentColor() + '20',
                          borderRadius: borderRadius.sm,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ComponentIcon size={20} color={getComponentColor()} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                          {event.component?.brand} {event.component?.model || event.component?.name || 'Unknown Component'}
                        </div>
                        <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                          {event.component?.serial_number && `SN: ${event.component.serial_number}`}
                          {event.component?.part_number && `PN: ${event.component.part_number}`}
                          {event.performer && ` • Recorded by: ${event.performer.name}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[500], textAlign: 'right' }}>
                      {new Date(event.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                );
              })}
              {recordedComponents.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/app/stockyard/components?vehicle_id=${request.vehicle_id}`)}
                  style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
                  icon={<ExternalLink size={14} />}
                >
                  View All ({recordedComponents.length})
                </Button>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: spacing.xl,
                textAlign: 'center',
                backgroundColor: colors.neutral[50],
                borderRadius: borderRadius.md,
                border: `2px dashed ${colors.neutral[300]}`,
              }}
            >
              <Package size={48} color={colors.neutral[400]} style={{ marginBottom: spacing.sm, opacity: 0.5 }} />
              <p style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.md }}>
                No components recorded yet
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowComponentModal(true)}
                icon={<Plus size={16} />}
              >
                Record First Component
              </Button>
            </div>
          )}
        </div>
      )}

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
        <CardGrid gap="lg" style={{ marginTop: spacing.lg }}>
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
        </CardGrid>
      )}

      {ConfirmComponent}

      {/* Component Recording Modal */}
      {request?.vehicle_id && (
        <ComponentRecordingModal
          vehicleId={request.vehicle_id}
          stockyardRequestId={request.id}
          open={showComponentModal}
          onClose={() => setShowComponentModal(false)}
          onSuccess={() => {
            refetchComponents();
            fetchRequest(); // Refresh request data
          }}
        />
      )}
    </div>
  );
};

