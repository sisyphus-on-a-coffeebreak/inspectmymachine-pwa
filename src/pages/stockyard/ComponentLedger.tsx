import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { NetworkError } from '@/components/ui/NetworkError';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';
import { Battery, Wrench, Package, Search, Filter, Plus, Car, AlertTriangle } from 'lucide-react';
import { useComponents } from '@/lib/queries';
import { useToast } from '@/providers/ToastProvider';

interface Component {
  id: string;
  type: 'battery' | 'tyre' | 'spare_part';
  serial_number?: string;
  part_number?: string;
  brand: string;
  model: string;
  status: string;
  purchase_date?: string;
  warranty_expires_at?: string;
  purchase_cost: number;
  current_vehicle_id?: string;
  current_vehicle?: {
    id: string;
    registration_number: string;
    make: string;
    model: string;
  };
  capacity?: string;
  voltage?: string;
  size?: string;
  tread_depth_mm?: number;
  position?: string;
  name?: string;
  category?: string;
  created_at: string;
}

const typeConfig = {
  battery: { icon: Battery, label: 'Battery', color: colors.primary },
  tyre: { icon: Package, label: 'Tyre', color: colors.warning[500] },
  spare_part: { icon: Wrench, label: 'Spare Part', color: colors.success[500] },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: colors.success[500], label: 'Active' },
  maintenance: { color: colors.warning[500], label: 'Maintenance' },
  retired: { color: colors.neutral[500], label: 'Retired' },
  needs_replacement: { color: colors.error[500], label: 'Needs Replacement' },
  in_stock: { color: colors.primary, label: 'In Stock' },
  installed: { color: colors.success[500], label: 'Installed' },
};

export const ComponentLedger: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [typeFilter, setTypeFilter] = useState<'all' | 'battery' | 'tyre' | 'spare_part'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(20);

  const { data: componentsData, isLoading, isError, error, refetch } = useComponents({
    type: typeFilter === 'all' ? undefined : typeFilter,
    status: statusFilter || undefined,
    search: searchQuery || undefined,
    page: currentPage,
    per_page: perPage,
  });

  const components = componentsData?.data || [];
  const totalItems = componentsData?.total || 0;
  const lastPage = componentsData?.last_page || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, searchQuery]);

  const handleComponentClick = (component: Component) => {
    navigate(`/app/stockyard/components/${component.type}/${component.id}`);
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
    return new Date(dateString).toLocaleDateString('en-IN');
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

  if (isError) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Component Ledger"
          breadcrumbs={[
            { label: 'Dashboard', path: '/app/dashboard' },
            { label: 'Stockyard', path: '/app/stockyard' },
            { label: 'Component Ledger' },
          ]}
        />
        <NetworkError error={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl }}>
      <PageHeader
        title="Component Ledger"
        breadcrumbs={[
          { label: 'Dashboard', path: '/app/dashboard' },
          { label: 'Stockyard', path: '/app/stockyard' },
          { label: 'Component Ledger' },
        ]}
        actions={
          <Button
            onClick={() => navigate('/app/stockyard/components/create')}
            variant="primary"
            icon={<Plus size={18} />}
          >
            Add Component
          </Button>
        }
      />

      {/* Filters */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg, marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Type Filter */}
          <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
            <Filter size={18} color={colors.neutral[600]} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              style={{
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[300]}`,
                fontSize: typography.body.fontSize,
                fontFamily: typography.body.fontFamily,
                cursor: 'pointer',
              }}
            >
              <option value="all">All Types</option>
              <option value="battery">Batteries</option>
              <option value="tyre">Tyres</option>
              <option value="spare_part">Spare Parts</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.neutral[300]}`,
              fontSize: typography.body.fontSize,
              fontFamily: typography.body.fontFamily,
              cursor: 'pointer',
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
            <option value="needs_replacement">Needs Replacement</option>
            <option value="in_stock">In Stock</option>
            <option value="installed">Installed</option>
          </select>

          {/* Search */}
          <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: spacing.md,
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.neutral[500],
              }}
            />
            <input
              type="text"
              placeholder="Search by serial number, brand, model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: `${spacing.sm}px ${spacing.md}px ${spacing.sm}px ${spacing.xl * 2}px`,
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[300]}`,
                fontSize: typography.body.fontSize,
                fontFamily: typography.body.fontFamily,
              }}
            />
          </div>
        </div>
      </div>

      {/* Component List */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : components.length === 0 ? (
        <EmptyState
          icon={<Package size={48} />}
          title="No Components Found"
          description="Get started by adding your first component to the ledger."
          action={
            <Button
              onClick={() => navigate('/app/stockyard/components/create')}
              variant="primary"
              icon={<Plus size={18} />}
            >
              Add Component
            </Button>
          }
        />
      ) : (
        <>
          <div style={{ display: 'grid', gap: spacing.md }}>
            {components.map((component: Component) => {
              const TypeIcon = typeConfig[component.type].icon;
              const statusInfo = statusConfig[component.status] || { color: colors.neutral[500], label: component.status };
              
              return (
                <div
                  key={component.id}
                  onClick={() => handleComponentClick(component)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleComponentClick(component);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  style={{
                    ...cardStyles.card,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft: `4px solid ${typeConfig[component.type].color}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = cardStyles.card.boxShadow;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                        <TypeIcon size={20} color={typeConfig[component.type].color} />
                        <h3 style={{ ...typography.subheader, margin: 0 }}>
                          {component.type === 'spare_part' ? component.name : `${component.brand} ${component.model}`}
                        </h3>
                        <span
                          style={{
                            padding: `${spacing.xs}px ${spacing.sm}px`,
                            backgroundColor: statusInfo.color,
                            color: 'white',
                            borderRadius: borderRadius.sm,
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {statusInfo.label}
                        </span>
                        {isWarrantyExpired(component.warranty_expires_at) && (
                          <span
                            style={{
                              padding: `${spacing.xs}px ${spacing.sm}px`,
                              backgroundColor: colors.error[500],
                              color: 'white',
                              borderRadius: borderRadius.sm,
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing.xs,
                            }}
                          >
                            <AlertTriangle size={12} /> Warranty Expired
                          </span>
                        )}
                        {isWarrantyExpiring(component.warranty_expires_at) && (
                          <span
                            style={{
                              padding: `${spacing.xs}px ${spacing.sm}px`,
                              backgroundColor: colors.warning[500],
                              color: 'white',
                              borderRadius: borderRadius.sm,
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing.xs,
                            }}
                          >
                            <AlertTriangle size={12} /> Warranty Expiring
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.md, marginTop: spacing.md }}>
                        <div>
                          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                            {component.type === 'spare_part' ? 'Part Number' : 'Serial Number'}
                          </div>
                          <div style={{ ...typography.body }}>
                            {component.type === 'spare_part' ? component.part_number : component.serial_number}
                          </div>
                        </div>

                        {component.type === 'battery' && (
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

                        {component.type === 'tyre' && (
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

                        {component.type === 'spare_part' && component.category && (
                          <div>
                            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Category</div>
                            <div style={{ ...typography.body }}>{component.category}</div>
                          </div>
                        )}

                        <div>
                          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Purchase Cost</div>
                          <div style={{ ...typography.body, fontWeight: 600 }}>{formatCurrency(component.purchase_cost)}</div>
                        </div>

                        <div>
                          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Purchase Date</div>
                          <div style={{ ...typography.body }}>{formatDate(component.purchase_date)}</div>
                        </div>

                        {component.warranty_expires_at && (
                          <div>
                            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Warranty Expires</div>
                            <div style={{ ...typography.body }}>{formatDate(component.warranty_expires_at)}</div>
                          </div>
                        )}

                        {component.current_vehicle && (
                          <div>
                            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Current Vehicle</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                              <Car size={16} color={colors.neutral[600]} />
                              <div style={{ ...typography.body }}>
                                {component.current_vehicle.registration_number}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl }}>
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="secondary"
              >
                Previous
              </Button>
              <span style={{ ...typography.body, color: colors.neutral[600] }}>
                Page {currentPage} of {lastPage} ({totalItems} total)
              </span>
              <Button
                onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage === lastPage}
                variant="secondary"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

