import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/ui/StatCard';
import { ActionGrid, StatsGrid, CompactGrid } from '../../components/ui/ResponsiveGrid';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../providers/ToastProvider';
import { useStockyardRequests, useStockyardStats, useStockyardAlerts, useDaysSinceEntry, useComponents, useComponentCustodyEvents } from '../../lib/queries';
import type { StockyardRequest, StockyardRequestStatus, StockyardRequestType, ComponentCustodyEvent } from '../../lib/stockyard';
import { Warehouse, Plus, CheckCircle2, XCircle, Clock, AlertCircle, Search, Filter, Package, Map, ArrowRight, Battery, Circle, Wrench, TrendingUp, Activity } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';
import { FilterBadges } from '../../components/ui/FilterBadge';
import { PullToRefreshWrapper } from '../../components/ui/PullToRefreshWrapper';
import { CollapsibleSection } from '../../components/ui/CollapsibleSection';

// 📦 Stockyard Dashboard
// Main screen for managing stockyard requests and operations

export const StockyardDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'active'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ENTRY' | 'EXIT'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  
  // Map filters to API parameters
  const statusFilter = filter === 'all' ? undefined : filter === 'active' ? undefined : filter;
  const typeFilterValue = typeFilter === 'all' ? undefined : typeFilter;
  
  // Use React Query for stockyard requests
  const { data: requestsData, isLoading: loading, error: queryError, refetch } = useStockyardRequests(
    {
      status: statusFilter as StockyardRequestStatus | 'all',
      type: typeFilterValue as StockyardRequestType | 'all',
      per_page: perPage,
      page: currentPage,
    }
  );
  
  // Use React Query for stats
  const { data: statsData } = useStockyardStats();
  
  // Fetch alerts for dashboard
  const { data: alertsData } = useStockyardAlerts(
    { acknowledged: false, severity: 'critical' },
    { enabled: true }
  );
  
  // Fetch days since entry for vehicles in yard
  const { data: daysSinceEntryData } = useDaysSinceEntry();
  
  // Fetch component statistics
  const { data: allComponents } = useComponents({ per_page: 1 }, { enabled: true }); // Just to get total count
  const { data: batteryComponents } = useComponents({ type: 'battery', per_page: 1 }, { enabled: true });
  const { data: tyreComponents } = useComponents({ type: 'tyre', per_page: 1 }, { enabled: true });
  const { data: sparePartComponents } = useComponents({ type: 'spare_part', per_page: 1 }, { enabled: true });
  const { data: inStockComponents } = useComponents({ status: 'in_stock', per_page: 1 }, { enabled: true });
  
  // Fetch recent component movements
  const { data: recentMovementsData } = useComponentCustodyEvents(
    { per_page: 5, page: 1 },
    { enabled: true }
  );
  
  // Apply client-side filtering for "active" filter and search
  const requests = useMemo(() => {
    let filtered = requestsData?.data || [];
    
    // Filter active requests (approved and not yet scanned out)
    if (filter === 'active') {
      filtered = filtered.filter(
        (req) => req.status === 'Approved' && !req.scan_out_at
      );
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.id.toLowerCase().includes(query) ||
          req.vehicle?.registration_number?.toLowerCase().includes(query) ||
          req.requester?.name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [requestsData?.data, filter, searchQuery]);
  
  const totalItems = requestsData?.total || requests.length;
  const stats = statsData || {
    total_requests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    vehicles_inside: 0,
    vehicles_outside: 0,
    requests_today: 0,
  };
  
  const error = queryError ? (queryError instanceof Error ? queryError : new Error('Failed to load stockyard requests')) : null;

  const handleRefresh = async () => {
    await refetch();
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, typeFilter, searchQuery]);

  const getStatusColor = (status: StockyardRequestStatus) => {
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

  const getStatusIcon = (status: StockyardRequestStatus) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle2 size={16} />;
      case 'Rejected':
        return <XCircle size={16} />;
      case 'Submitted':
        return <Clock size={16} />;
      case 'Cancelled':
        return <AlertCircle size={16} />;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (error && requests.length === 0) {
    return (
      <div style={{ padding: spacing.xl }}>
        <PageHeader
          title="Stockyard Management"
          subtitle="Manage components and stockyard operations"
          icon={<Warehouse size={24} />}
        />
        <NetworkError error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
    <div style={{ padding: spacing.xl }}>
      <PageHeader
        title="Stockyard Management"
        subtitle="Manage components and stockyard operations"
        icon={<Warehouse size={24} />}
      />

      {/* Stats Cards */}
      <StatsGrid>
        <StatCard
          label="Pending Requests"
          value={stats.pending}
          color={colors.warning[500]}
          href="/app/stockyard?filter=pending"
          loading={loading}
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          color={colors.success[500]}
          href="/app/stockyard?filter=approved"
          loading={loading}
        />
        <StatCard
          label="Vehicles Inside"
          value={stats.vehicles_inside}
          color={colors.primary}
          href="/app/stockyard?filter=active"
          loading={loading}
        />
        <StatCard
          label="Critical Alerts"
          value={alertsData?.length || 0}
          color={colors.error[500]}
          href="/app/stockyard/alerts?severity=critical"
          loading={loading}
        />
        {stats.slots_occupied !== undefined && (
          <StatCard
            label="Slots Occupied"
            value={`${stats.slots_occupied}/${stats.slots_total || 0}`}
            color={colors.primary}
            href="/app/stockyard/yards"
            loading={loading}
          />
        )}
        {daysSinceEntryData && daysSinceEntryData.length > 0 && (
          <StatCard
            label="Avg Days in Yard"
            value={Math.round(
              daysSinceEntryData.reduce((sum, v) => sum + v.days_since_entry, 0) / daysSinceEntryData.length
            )}
            color={colors.warning[500]}
            href="/app/stockyard?filter=active"
            loading={loading}
          />
        )}
      </StatsGrid>

      {/* Component Statistics Section */}
      <CollapsibleSection
        id="stockyard-component-stats"
        title="Component Statistics"
        defaultExpanded={false}
        badge={allComponents?.total ? `${allComponents.total} total` : undefined}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.md }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/stockyard/components')}
            icon={<ArrowRight size={16} />}
          >
            View All
          </Button>
        </div>
        <CompactGrid gap="md">
          <StatCard
            label="Total Components"
            value={allComponents?.total || 0}
            color={colors.primary}
            loading={loading}
          />
          <StatCard
            label="Batteries"
            value={batteryComponents?.total || 0}
            color={colors.warning[500]}
            icon={<Battery size={20} />}
            loading={loading}
          />
          <StatCard
            label="Tyres"
            value={tyreComponents?.total || 0}
            color={colors.neutral[600]}
            icon={<Circle size={20} />}
            loading={loading}
          />
          <StatCard
            label="Spare Parts"
            value={sparePartComponents?.total || 0}
            color={colors.success[500]}
            icon={<Wrench size={20} />}
            loading={loading}
          />
          <StatCard
            label="In Stock"
            value={inStockComponents?.total || 0}
            color={colors.success[600]}
            loading={loading}
          />
        </CompactGrid>
      </CollapsibleSection>

      {/* Recent Movements & Yard Occupancy Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg, marginTop: spacing.lg }}>
        {/* Recent Component Movements */}
        <CollapsibleSection
          id="stockyard-recent-movements"
          title="Recent Movements"
          defaultExpanded={true}
          badge={recentMovementsData?.data?.length ? `${recentMovementsData.data.length} events` : undefined}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.md }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/stockyard/components')}
              icon={<ArrowRight size={16} />}
            >
              View All
            </Button>
          </div>
          {recentMovementsData?.data && recentMovementsData.data.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {recentMovementsData.data.slice(0, 5).map((event: ComponentCustodyEvent) => (
                <div
                  key={event.id}
                  style={{
                    padding: spacing.sm,
                    backgroundColor: colors.neutral[50],
                    borderRadius: '8px',
                    border: `1px solid ${colors.neutral[200]}`,
                    cursor: event.component_id ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (event.component_id && event.component_type) {
                      navigate(`/app/stockyard/components/${event.component_type}/${event.component_id}`);
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            backgroundColor: 
                              event.event_type === 'install' ? colors.success[100] :
                              event.event_type === 'remove' ? colors.error[100] :
                              event.event_type === 'transfer' ? colors.warning[100] :
                              colors.neutral[100],
                            color:
                              event.event_type === 'install' ? colors.success[700] :
                              event.event_type === 'remove' ? colors.error[700] :
                              event.event_type === 'transfer' ? colors.warning[700] :
                              colors.neutral[700],
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        >
                          {event.event_type}
                        </span>
                        {event.component && (
                          <span style={{ ...typography.body, fontSize: '13px', fontWeight: 600 }}>
                            {event.component.brand} {event.component.model}
                          </span>
                        )}
                      </div>
                      {event.vehicle && (
                        <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>
                          Vehicle: {event.vehicle.registration_number}
                        </div>
                      )}
                      {event.performer && (
                        <div style={{ ...typography.caption, color: colors.neutral[500] }}>
                          By: {event.performer.name}
                        </div>
                      )}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[500], textAlign: 'right' }}>
                      {new Date(event.created_at).toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.neutral[500] }}>
              <Activity size={32} style={{ marginBottom: spacing.sm, opacity: 0.5 }} />
              <p style={{ ...typography.body, margin: 0 }}>No recent movements</p>
            </div>
          )}
        </CollapsibleSection>

        {/* Yard Occupancy Visualization */}
        <CollapsibleSection
          id="stockyard-yard-occupancy"
          title="Yard Occupancy"
          defaultExpanded={true}
          badge={stats.slots_total !== undefined ? `${stats.slots_occupied || 0}/${stats.slots_total} occupied` : undefined}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.md }}>
            {stats.slots_total !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app/stockyard/yards')}
                icon={<Map size={16} />}
              >
                View Map
              </Button>
            )}
          </div>
          {stats.slots_total !== undefined ? (
            <div>
              <div style={{ marginBottom: spacing.md }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <span style={{ ...typography.body, fontSize: '14px' }}>Occupancy</span>
                  <span style={{ ...typography.body, fontSize: '14px', fontWeight: 600 }}>
                    {stats.slots_occupied || 0} / {stats.slots_total}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '24px',
                    backgroundColor: colors.neutral[200],
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${((stats.slots_occupied || 0) / stats.slots_total) * 100}%`,
                      height: '100%',
                      backgroundColor: 
                        ((stats.slots_occupied || 0) / stats.slots_total) > 0.9 ? colors.error[500] :
                        ((stats.slots_occupied || 0) / stats.slots_total) > 0.7 ? colors.warning[500] :
                        colors.success[500],
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                  {stats.slots_available || 0} slots available
                </div>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: spacing.sm,
                marginTop: spacing.md,
                paddingTop: spacing.md,
                borderTop: `1px solid ${colors.neutral[200]}`,
              }}>
                <div>
                  <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Vehicles Inside
                  </div>
                  <div style={{ ...typography.header, fontSize: '24px', color: colors.primary, margin: 0 }}>
                    {stats.vehicles_inside || 0}
                  </div>
                </div>
                <div>
                  <div style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Requests Today
                  </div>
                  <div style={{ ...typography.header, fontSize: '24px', color: colors.warning[500], margin: 0 }}>
                    {stats.requests_today || 0}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.neutral[500] }}>
              <Map size={32} style={{ marginBottom: spacing.sm, opacity: 0.5 }} />
              <p style={{ ...typography.body, margin: 0 }}>Yard map not configured</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/app/stockyard/yards')}
                style={{ marginTop: spacing.sm }}
              >
                Configure Yards
              </Button>
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* Quick Actions */}
      <ActionGrid style={{ marginTop: spacing.lg }}>
        <Button
          variant="primary"
          onClick={() => navigate('/app/stockyard/create')}
          style={{ width: '100%' }}
        >
          <Plus size={20} style={{ marginRight: spacing.sm }} />
          Record Movement
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/app/stockyard/scan')}
          style={{ width: '100%' }}
        >
          <Search size={20} style={{ marginRight: spacing.sm }} />
          Scan Vehicle
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/app/stockyard/components')}
          style={{ width: '100%' }}
        >
          <Package size={20} style={{ marginRight: spacing.sm }} />
          Components
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/app/stockyard?tab=readiness')}
          style={{ width: '100%' }}
        >
          <CheckCircle2 size={20} style={{ marginRight: spacing.sm }} />
          Buyer Readiness
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/app/stockyard/alerts')}
          style={{ width: '100%' }}
        >
          <AlertCircle size={20} style={{ marginRight: spacing.sm }} />
          Alerts
        </Button>
        {stats.slots_total !== undefined && (
          <Button
            variant="secondary"
            onClick={() => navigate('/app/stockyard/yards')}
            style={{ width: '100%' }}
          >
            <Map size={20} style={{ marginRight: spacing.sm }} />
            Yard Map
          </Button>
        )}
      </ActionGrid>

      {/* Filters */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <div style={{ display: 'flex', gap: spacing.md, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search by ID, vehicle, or requester..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              style={{
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active (Inside)</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              style={{
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="all">All Types</option>
              <option value="ENTRY">Entry</option>
              <option value="EXIT">Exit</option>
            </select>
          </div>
        </div>
        
        {/* Active Filter Badges */}
        {(filter !== 'all' || typeFilter !== 'all' || searchQuery.trim()) && (
          <FilterBadges
            filters={[
              ...(filter !== 'all' ? [{
                label: 'Status',
                value: filter.charAt(0).toUpperCase() + filter.slice(1),
                onRemove: () => setFilter('all'),
              }] : []),
              ...(typeFilter !== 'all' ? [{
                label: 'Type',
                value: typeFilter,
                onRemove: () => setTypeFilter('all'),
              }] : []),
              ...(searchQuery.trim() ? [{
                label: 'Search',
                value: `"${searchQuery}"`,
                onRemove: () => setSearchQuery(''),
              }] : []),
            ]}
            onClearAll={() => {
              setFilter('all');
              setTypeFilter('all');
              setSearchQuery('');
            }}
          />
        )}
      </div>

      {/* Requests List */}
      {loading && requests.length === 0 ? (
        <div style={{ ...cardStyles.card, textAlign: 'center', padding: spacing.xxl }}>
          <div style={{ fontSize: '2rem', marginBottom: spacing.md }}>📦</div>
          <div style={{ color: colors.neutral[600] }}>Loading stockyard requests...</div>
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Warehouse size={48} />}
          title="No Stockyard Requests"
          description="Create a new request to get started"
          action={
            <Button variant="primary" onClick={() => navigate('/app/stockyard/create')}>
              Record Movement
            </Button>
          }
        />
      ) : (
        <div style={{ marginTop: spacing.lg }}>
          {requests.map((request) => (
            <div
              key={request.id}
              style={{
                ...cardStyles.card,
                marginBottom: spacing.md,
                cursor: 'pointer',
                borderLeft: `4px solid ${getStatusColor(request.status)}`,
              }}
              onClick={() => navigate(`/app/stockyard/${request.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        backgroundColor: getStatusColor(request.status),
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                      }}
                    >
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                    <span
                      style={{
                        padding: '4px 12px',
                        backgroundColor: request.type === 'ENTRY' ? colors.primary + '20' : colors.warning[100],
                        color: request.type === 'ENTRY' ? colors.primary : colors.warning[700],
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {request.type}
                    </span>
                  </div>
                  <div style={{ ...typography.header, margin: 0, marginBottom: spacing.xs }}>
                    {request.vehicle?.registration_number || 'Unknown Vehicle'}
                  </div>
                  <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Request ID: {request.id.substring(0, 8)}...
                  </div>
                  {request.requester && (
                    <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Requested by: {request.requester.name} ({request.requester.employee_id})
                    </div>
                  )}
                  {request.valid_from && request.valid_to && (
                    <div style={{ ...typography.caption, color: colors.neutral[500] }}>
                      Valid: {formatDate(request.valid_from)} - {formatDate(request.valid_to)}
                    </div>
                  )}
                  {request.scan_in_at && (
                    <div style={{ ...typography.caption, color: colors.success[600], marginTop: spacing.xs }}>
                      ✓ Scanned in: {formatDate(request.scan_in_at)}
                    </div>
                  )}
                  {request.scan_out_at && (
                    <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                      ✓ Scanned out: {formatDate(request.scan_out_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / perPage)}
          totalItems={totalItems}
          perPage={perPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setCurrentPage(1); // Reset to first page when changing per-page
          }}
        />
      )}
    </div>
    </PullToRefreshWrapper>
  );
};

