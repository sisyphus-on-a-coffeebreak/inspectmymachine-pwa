import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/ui/StatCard';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../providers/ToastProvider';
import { useStockyardRequests, useStockyardStats } from '../../lib/queries';
import type { StockyardRequest, StockyardRequestStatus, StockyardRequestType } from '../../lib/stockyard';
import { Warehouse, Plus, CheckCircle2, XCircle, Clock, AlertCircle, Search, Filter } from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';

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
          subtitle="Manage vehicle entry and exit requests"
          icon={<Warehouse size={24} />}
        />
        <NetworkError error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl }}>
      <PageHeader
        title="Stockyard Management"
        subtitle="Manage vehicle entry and exit requests"
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
          label="Total Requests"
          value={stats.total_requests}
          color={colors.neutral[500]}
          href="/app/stockyard"
          loading={loading}
        />
      </StatsGrid>

      {/* Quick Actions */}
      <ActionGrid>
        <Button
          variant="primary"
          onClick={() => navigate('/app/stockyard/create')}
          style={{ width: '100%' }}
        >
          <Plus size={20} style={{ marginRight: spacing.sm }} />
          Create Request
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
          onClick={() => navigate('/app/stockyard/reports')}
          style={{ width: '100%' }}
        >
          <Filter size={20} style={{ marginRight: spacing.sm }} />
          Reports
        </Button>
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
              Create Request
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
  );
};

