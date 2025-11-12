import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../providers/ToastProvider';
import {
  getStockyardRequests,
  getStockyardStats,
  type StockyardRequest,
  type StockyardRequestStatus,
  type StockyardRequestType,
} from '../../lib/stockyard';
import { Warehouse, Plus, CheckCircle2, XCircle, Clock, AlertCircle, Search, Filter } from 'lucide-react';

// 📦 Stockyard Dashboard
// Main screen for managing stockyard requests and operations

export const StockyardDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<StockyardRequest[]>([]);
  const [stats, setStats] = useState({
    total_requests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    vehicles_inside: 0,
    vehicles_outside: 0,
    requests_today: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'active'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ENTRY' | 'EXIT'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const statusFilter = filter === 'all' ? undefined : filter === 'active' ? undefined : filter;
      const typeFilterValue = typeFilter === 'all' ? undefined : typeFilter;

      const response = await getStockyardRequests({
        status: statusFilter as StockyardRequestStatus | 'all',
        type: typeFilterValue as StockyardRequestType | 'all',
        per_page: 20,
      });

      let filteredRequests = response.data;

      // Filter active requests (approved and not yet scanned out)
      if (filter === 'active') {
        filteredRequests = filteredRequests.filter(
          (req) => req.status === 'Approved' && !req.scan_out_at
        );
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredRequests = filteredRequests.filter(
          (req) =>
            req.id.toLowerCase().includes(query) ||
            req.vehicle?.registration_number?.toLowerCase().includes(query) ||
            req.requester?.name?.toLowerCase().includes(query)
        );
      }

      setRequests(filteredRequests);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch stockyard requests');
      setError(error);
      console.error('Failed to fetch stockyard requests:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter, searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getStockyardStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stockyard stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [fetchRequests, fetchStats]);

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
        <NetworkError error={error} onRetry={fetchRequests} />
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
        <div style={{ ...cardStyles.card, borderLeft: `4px solid ${colors.warning[500]}` }}>
          <div style={{ ...typography.label, color: colors.neutral[600] }}>Pending Requests</div>
          <div style={{ ...typography.header, color: colors.warning[500], margin: 0 }}>
            {stats.pending}
          </div>
        </div>
        <div style={{ ...cardStyles.card, borderLeft: `4px solid ${colors.success[500]}` }}>
          <div style={{ ...typography.label, color: colors.neutral[600] }}>Approved</div>
          <div style={{ ...typography.header, color: colors.success[500], margin: 0 }}>
            {stats.approved}
          </div>
        </div>
        <div style={{ ...cardStyles.card, borderLeft: `4px solid ${colors.primary}` }}>
          <div style={{ ...typography.label, color: colors.neutral[600] }}>Vehicles Inside</div>
          <div style={{ ...typography.header, color: colors.primary, margin: 0 }}>
            {stats.vehicles_inside}
          </div>
        </div>
        <div style={{ ...cardStyles.card, borderLeft: `4px solid ${colors.neutral[500]}` }}>
          <div style={{ ...typography.label, color: colors.neutral[600] }}>Total Requests</div>
          <div style={{ ...typography.header, color: colors.neutral[900], margin: 0 }}>
            {stats.total_requests}
          </div>
        </div>
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
    </div>
  );
};

