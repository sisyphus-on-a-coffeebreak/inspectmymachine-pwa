import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { NetworkError } from '@/components/ui/NetworkError';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';
import { Battery, Package, Wrench, ArrowLeft, Edit, Trash2, Car, AlertTriangle, Calendar, DollarSign, ArrowRight, Plus, Clock, FileText } from 'lucide-react';
import { useComponent, useDeleteComponent, useAlerts } from '@/lib/queries';
import { useToast } from '@/providers/ToastProvider';
import { formatDistanceToNow } from 'date-fns';
import { AnomalyAlert } from '@/components/ui/AnomalyAlert';
import { ComponentCustodyTimeline } from '../../components/ui/ComponentCustodyTimeline';
import { ComponentTransferModal } from '../../components/stockyard/ComponentTransferModal';
import { ComponentMaintenanceModal } from '../../components/stockyard/ComponentMaintenanceModal';
import { PolicyLinks } from '../../components/ui/PolicyLinks';
import { useQueryClient } from '@tanstack/react-query';

const typeConfig = {
  battery: { icon: Battery, label: 'Battery', color: colors.primary },
  tyre: { icon: Package, label: 'Tyre', color: colors.warning[500] },
  spare_part: { icon: Wrench, label: 'Spare Part', color: colors.success[500] },
};

export const ComponentDetails: React.FC = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const deleteMutation = useDeleteComponent();
  const queryClient = useQueryClient();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  const { data: component, isLoading, isError, error } = useComponent(type || '', id || '');
  
  // Fetch alerts for this component
  const { data: alertsData } = useAlerts(
    {
      module: 'stockyard',
      item_type: 'component',
      item_id: id,
      status: 'new,acknowledged',
    },
    { enabled: !!id }
  );
  
  const componentAlerts = alertsData?.data || [];

  const handleDelete = async () => {
    if (!type || !id) return;
    
    if (!window.confirm(`Are you sure you want to delete this ${typeConfig[type as keyof typeof typeConfig]?.label || 'component'}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ type, id });
      showToast({
        title: 'Success',
        description: 'Component deleted successfully',
        variant: 'success',
      });
      navigate('/app/stockyard/components');
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to delete component',
        variant: 'error',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isWarrantyExpiring = (warrantyDate?: string) => {
    if (!warrantyDate) return false;
    const expiry = new Date(warrantyDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const isWarrantyExpired = (warrantyDate?: string) => {
    if (!warrantyDate) return false;
    return new Date(warrantyDate) < new Date();
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Component Details"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Stockyard', path: '/app/stockyard' },
            { label: 'Component Ledger', path: '/app/stockyard/components' },
            { label: 'Details' },
          ]}
        />
        <SkeletonLoader />
      </div>
    );
  }

  if (isError || !component) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Component Details"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Stockyard', path: '/app/stockyard' },
            { label: 'Component Ledger', path: '/app/stockyard/components' },
            { label: 'Details' },
          ]}
        />
        <NetworkError error={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const componentType = type as 'battery' | 'tyre' | 'spare_part';
  const TypeIcon = typeConfig[componentType]?.icon || Battery;
  const typeColor = typeConfig[componentType]?.color || colors.primary;

  return (
    <div style={{ padding: spacing.xl }}>
      <PageHeader
        title={`${typeConfig[componentType]?.label || 'Component'} Details`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/app/dashboard' },
          { label: 'Stockyard', path: '/app/stockyard' },
          { label: 'Component Ledger', path: '/app/stockyard/components' },
          { label: 'Details' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            {component && component.current_vehicle_id && (
              <Button
                onClick={() => setShowTransferModal(true)}
                variant="primary"
                icon={<ArrowRight size={18} />}
              >
                Transfer
              </Button>
            )}
            <Button
              onClick={() => navigate(`/app/stockyard/components/${type}/${id}/edit`)}
              variant="secondary"
              icon={<Edit size={18} />}
            >
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="critical"
              icon={<Trash2 size={18} />}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
            <Button
              onClick={() => navigate('/app/stockyard/components')}
              variant="secondary"
              icon={<ArrowLeft size={18} />}
            >
              Back
            </Button>
          </div>
        }
      />

      {/* Policy Links */}
      <PolicyLinks
        title="Component Management Policy"
        links={[
          {
            label: 'Component Tracking Policy',
            url: '/policies/component-tracking',
            external: false,
            icon: '📦'
          },
          {
            label: 'Maintenance Standards',
            url: '/policies/maintenance-standards',
            external: false,
            icon: '🔧'
          },
          {
            label: 'Transfer Approval Process',
            url: '/policies/transfer-approval',
            external: false,
            icon: '🔄'
          }
        ]}
        variant="compact"
      />

      {/* Component Anomaly Alerts */}
      {componentAlerts.length > 0 && (
        <div style={{ marginTop: spacing.lg }}>
          {componentAlerts.map((alert: any) => (
            <AnomalyAlert
              key={alert.id}
              title={alert.title}
              description={alert.description}
              severity={alert.severity}
              actions={[
                {
                  label: 'View Alert',
                  onClick: () => navigate(`/app/alerts`),
                  variant: 'primary' as const,
                },
              ]}
              style={{ marginBottom: spacing.md }}
            />
          ))}
        </div>
      )}

      {/* Warranty Alerts */}
      {(isWarrantyExpired(component.warranty_expires_at) || isWarrantyExpiring(component.warranty_expires_at)) && (
        <div
          style={{
            ...cardStyles.card,
            marginTop: spacing.lg,
            borderLeft: `4px solid ${isWarrantyExpired(component.warranty_expires_at) ? colors.error[500] : colors.warning[500]}`,
            background: isWarrantyExpired(component.warranty_expires_at) ? colors.error[50] : colors.warning[50],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <AlertTriangle size={20} color={isWarrantyExpired(component.warranty_expires_at) ? colors.error[600] : colors.warning[600]} />
            <div>
              <div style={{ ...typography.subheader, fontWeight: 700, marginBottom: spacing.xs }}>
                {isWarrantyExpired(component.warranty_expires_at) ? 'Warranty Expired' : 'Warranty Expiring Soon'}
              </div>
              <div style={{ ...typography.body, color: colors.neutral[700] }}>
                {isWarrantyExpired(component.warranty_expires_at)
                  ? `Warranty expired on ${formatDate(component.warranty_expires_at)}`
                  : `Warranty expires on ${formatDate(component.warranty_expires_at)} (${formatDistanceToNow(new Date(component.warranty_expires_at))})`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component Information */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: borderRadius.lg,
              background: typeColor + '20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TypeIcon size={24} color={typeColor} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ ...typography.header, margin: 0, marginBottom: spacing.xs }}>
              {componentType === 'spare_part' ? component.name : `${component.brand} ${component.model}`}
            </h2>
            <div style={{ ...typography.body, color: colors.neutral[600] }}>
              {componentType === 'spare_part' ? component.part_number : component.serial_number}
            </div>
          </div>
          <span
            style={{
              padding: `${spacing.sm}px ${spacing.md}px`,
              backgroundColor: component.status === 'active' || component.status === 'in_stock' || component.status === 'installed'
                ? colors.success[500]
                : component.status === 'maintenance'
                ? colors.warning[500]
                : colors.neutral[500],
              color: 'white',
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {component.status.replace('_', ' ')}
          </span>
        </div>

        <CardGrid gap="lg">
          {/* Common Fields */}
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Brand</div>
            <div style={{ ...typography.body }}>{component.brand}</div>
          </div>
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Model</div>
            <div style={{ ...typography.body }}>{component.model}</div>
          </div>

          {/* Type-Specific Fields */}
          {componentType === 'battery' && (
            <>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Capacity</div>
                <div style={{ ...typography.body }}>{component.capacity}</div>
              </div>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Voltage</div>
                <div style={{ ...typography.body }}>{component.voltage}</div>
              </div>
            </>
          )}

          {componentType === 'tyre' && (
            <>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Size</div>
                <div style={{ ...typography.body }}>{component.size}</div>
              </div>
              {component.position && (
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Position</div>
                  <div style={{ ...typography.body }}>{component.position.replace('_', ' ')}</div>
                </div>
              )}
              {component.tread_depth_mm !== null && component.tread_depth_mm !== undefined && (
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Tread Depth</div>
                  <div style={{ ...typography.body }}>{component.tread_depth_mm}mm</div>
                </div>
              )}
            </>
          )}

          {componentType === 'spare_part' && component.category && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Category</div>
              <div style={{ ...typography.body }}>{component.category.charAt(0).toUpperCase() + component.category.slice(1)}</div>
            </div>
          )}

          {/* Purchase & Warranty */}
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Calendar size={16} />
              Purchase Date
            </div>
            <div style={{ ...typography.body }}>{formatDate(component.purchase_date)}</div>
          </div>
          {component.warranty_expires_at && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Warranty Expires</div>
              <div style={{ ...typography.body }}>{formatDate(component.warranty_expires_at)}</div>
            </div>
          )}
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <DollarSign size={16} />
              Purchase Cost
            </div>
            <div style={{ ...typography.body, fontWeight: 600, color: colors.primary }}>
              {formatCurrency(component.purchase_cost)}
            </div>
          </div>

          {/* Vehicle Assignment */}
          {component.current_vehicle && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs, display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <Car size={16} />
                Current Vehicle
              </div>
              <div style={{ ...typography.body }}>
                {component.current_vehicle.registration_number}
                {component.current_vehicle.make && component.current_vehicle.model && (
                  <> ({component.current_vehicle.make} {component.current_vehicle.model})</>
                )}
              </div>
            </div>
          )}
        </CardGrid>

          {/* Notes */}
          {component.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Notes</div>
              <div style={{ ...typography.body, whiteSpace: 'pre-wrap' }}>{component.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance History */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <h3 style={{ ...typography.subheader, margin: 0 }}>Maintenance History</h3>
          <Button
            onClick={() => setShowMaintenanceModal(true)}
            variant="primary"
            icon={<Plus size={18} />}
          >
            Record Maintenance
          </Button>
        </div>
        {component.maintenance && component.maintenance.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {component.maintenance.map((record: any) => {
              const isDueSoon = record.next_due_date && (() => {
                const dueDate = new Date(record.next_due_date);
                const today = new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilDue > 0 && daysUntilDue <= 30;
              })();
              const isOverdue = record.next_due_date && new Date(record.next_due_date) < new Date();

              return (
                <div
                  key={record.id}
                  style={{
                    padding: spacing.md,
                    borderLeft: `3px solid ${typeColor}`,
                    background: colors.neutral[50],
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.neutral[200]}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                        <span style={{ ...typography.body, fontWeight: 600 }}>
                          {record.title}
                        </span>
                        <span
                          style={{
                            padding: `${spacing.xs}px ${spacing.sm}px`,
                            backgroundColor: colors.primary + '20',
                            color: colors.primary,
                            borderRadius: borderRadius.sm,
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {record.maintenance_type}
                        </span>
                        {isOverdue && (
                          <span
                            style={{
                              padding: `${spacing.xs}px ${spacing.sm}px`,
                              backgroundColor: colors.error[50],
                              color: colors.error[600],
                              borderRadius: borderRadius.sm,
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            Overdue
                          </span>
                        )}
                        {isDueSoon && !isOverdue && (
                          <span
                            style={{
                              padding: `${spacing.xs}px ${spacing.sm}px`,
                              backgroundColor: colors.warning[50],
                              color: colors.warning[600],
                              borderRadius: borderRadius.sm,
                              fontSize: '12px',
                              fontWeight: 600,
                            }}
                          >
                            Due Soon
                          </span>
                        )}
                      </div>
                      {record.description && (
                        <div style={{ ...typography.body, color: colors.neutral[700], marginBottom: spacing.xs }}>
                          {record.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xs }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          <Calendar size={14} color={colors.neutral[500]} />
                          <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                            Performed: {formatDate(record.performed_at)}
                          </span>
                        </div>
                        {record.next_due_date && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <Clock size={14} color={isOverdue ? colors.error[500] : isDueSoon ? colors.warning[500] : colors.neutral[500]} />
                            <span style={{ ...typography.caption, color: isOverdue ? colors.error[600] : isDueSoon ? colors.warning[600] : colors.neutral[600] }}>
                              Next Due: {formatDate(record.next_due_date)}
                            </span>
                          </div>
                        )}
                        {record.cost && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <DollarSign size={14} color={colors.neutral[500]} />
                            <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                              {formatCurrency(record.cost)}
                            </span>
                          </div>
                        )}
                        {record.vendor_name && (
                          <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                            Vendor: {record.vendor_name}
                          </div>
                        )}
                        {record.performed_by && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <User size={14} color={colors.neutral[500]} />
                            <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                              by {record.performed_by.name}
                            </span>
                          </div>
                        )}
                      </div>
                      {record.notes && (
                        <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs, fontStyle: 'italic' }}>
                          {record.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Wrench size={48} />}
            title="No Maintenance Records"
            description="No maintenance has been recorded for this component yet."
          />
        )}
      </div>

      {/* Related Inspections */}
      {component.related_inspections && component.related_inspections.length > 0 && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.lg }}>Related Inspections</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {component.related_inspections.map((inspection: any) => (
              <div
                key={inspection.id}
                style={{
                  padding: spacing.md,
                  borderLeft: `3px solid ${colors.primary}`,
                  background: colors.neutral[50],
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.neutral[200]}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                      <FileText size={16} color={colors.primary} />
                      <span style={{ ...typography.body, fontWeight: 600 }}>
                        Inspection #{inspection.id.substring(0, 8)}
                      </span>
                      {inspection.vehicle_registration && (
                        <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                          • {inspection.vehicle_registration}
                        </span>
                      )}
                      <span
                        style={{
                          padding: `${spacing.xs}px ${spacing.sm}px`,
                          backgroundColor: inspection.status === 'approved' 
                            ? colors.success[50] 
                            : inspection.status === 'completed'
                            ? colors.primary + '20'
                            : colors.neutral[100],
                          color: inspection.status === 'approved'
                            ? colors.success[600]
                            : inspection.status === 'completed'
                            ? colors.primary
                            : colors.neutral[600],
                          borderRadius: borderRadius.sm,
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {inspection.status}
                      </span>
                    </div>
                    {inspection.measurements && inspection.measurements.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
                        {inspection.measurements.map((measurement: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              padding: `${spacing.xs}px ${spacing.sm}px`,
                              backgroundColor: 'white',
                              borderRadius: borderRadius.sm,
                              border: `1px solid ${colors.neutral[200]}`,
                              fontSize: '12px',
                            }}
                          >
                            <span style={{ color: colors.neutral[600] }}>{measurement.answer_value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {inspection.completed_at && (
                      <div style={{ ...typography.caption, color: colors.neutral[500], marginTop: spacing.xs }}>
                        Completed: {formatDate(inspection.completed_at)}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/app/inspections/${inspection.id}`)}
                    style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custody History */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.lg }}>Custody History</h3>
        {component.custody_history && component.custody_history.length > 0 ? (
          <ComponentCustodyTimeline events={component.custody_history} />
        ) : (
          <EmptyState
            icon={<Package size={48} />}
            title="No Custody History"
            description="This component hasn't been transferred between vehicles yet."
          />
        )}
      </div>

      {/* Transfer Modal */}
      {component && (
        <ComponentTransferModal
          component={component}
          open={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            // Invalidate and refetch component data
            queryClient.invalidateQueries({ queryKey: ['components', type, id] });
          }}
        />
      )}

      {/* Maintenance Modal */}
      {component && (
        <ComponentMaintenanceModal
          component={component}
          open={showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(false)}
          onSuccess={() => {
            // Invalidate and refetch component data
            queryClient.invalidateQueries({ queryKey: ['components', type, id] });
          }}
        />
      )}
    </div>
  );
};

