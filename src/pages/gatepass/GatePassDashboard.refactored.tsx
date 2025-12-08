/**
 * Gate Pass Dashboard - Refactored
 * 
 * Uses unified API v2 with single API call
 * Includes stats in the same response
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGatePasses, useGatePassStats } from '@/hooks/useGatePasses';
import { useDebounce } from '@/hooks/useDebounce';
import type { GatePassFilters, GatePassStatus, GatePassType } from './gatePassTypes';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/ui/StatCard';
import { PassCard } from '../../components/gatepass/PassCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { PolicyLinks } from '../../components/ui/PolicyLinks';
import { useToast } from '../../providers/ToastProvider';
import { PullToRefreshWrapper } from '../../components/ui/PullToRefreshWrapper';
import { Input } from '../../components/ui/input';
import { Users, Truck, Clock, AlertTriangle } from 'lucide-react';

export const GatePassDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // State Management
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inside'>('active');
  const [typeFilter, setTypeFilter] = useState<'all' | 'visitor' | 'vehicle'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build filters with useMemo
  const filters: GatePassFilters = useMemo(() => {
    const filterObj: GatePassFilters = {
      per_page: perPage,
      page: page,
      include_stats: true,
    };

    // Map status filter
    if (statusFilter === 'all') {
      // Exclude completed/cancelled/expired by default
      filterObj.status = ['pending', 'active', 'inside'];
    } else if (statusFilter === 'active') {
      filterObj.status = ['active', 'inside'];
    } else {
      filterObj.status = [statusFilter as GatePassStatus];
    }

    // Map type filter
    if (typeFilter === 'visitor') {
      filterObj.type = 'visitor';
    } else if (typeFilter === 'vehicle') {
      filterObj.type = ['vehicle_inbound', 'vehicle_outbound'];
    }
    // 'all' means no type filter

    // Add search if present
    if (debouncedSearch.trim()) {
      filterObj.search = debouncedSearch.trim();
    }

    return filterObj;
  }, [statusFilter, typeFilter, debouncedSearch, page, perPage]);

  // Single API call with stats included
  const { data, isLoading, error, refetch } = useGatePasses(filters);

  // Extract data from response
  const passes = data?.data || [];
  const stats = data?.stats;
  const pagination = {
    total: data?.total || 0,
    page: data?.page || 1,
    per_page: data?.per_page || 20,
    last_page: data?.last_page || 1,
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, debouncedSearch]);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleStatClick = (filterType: 'visitors_inside' | 'vehicles_out' | 'expected_today' | 'expiring_soon') => {
    switch (filterType) {
      case 'visitors_inside':
        setStatusFilter('inside');
        setTypeFilter('visitor');
        break;
      case 'vehicles_out':
        setStatusFilter('inside');
        setTypeFilter('vehicle');
        break;
      case 'expected_today':
        setStatusFilter('pending');
        break;
      case 'expiring_soon':
        setStatusFilter('active');
        break;
    }
  };

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <PageHeader
          title="Gate Pass Management"
          subtitle="Manage visitor passes, vehicle movements, and gate operations"
          icon="🚪"
        />
        <NetworkError
          error={error}
          onRetry={() => refetch()}
          onGoBack={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: `${spacing.xl} ${spacing.lg}`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: colors.neutral[50],
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.xl,
      }}>
        {/* Header */}
        <PageHeader
          title="Gate Pass Management"
          subtitle="Manage visitor passes, vehicle movements, and gate operations"
          icon="🚪"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
            { label: 'Gate Pass', icon: '🚪' }
          ]}
          actions={
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button
                variant="primary"
                onClick={() => navigate('/app/gate-pass/create-visitor')}
                icon={<Users size={16} />}
              >
                Create Visitor Pass
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/app/gate-pass/create-vehicle')}
                icon={<Truck size={16} />}
              >
                Create Vehicle Pass
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <StatsGrid gap="md">
          <StatCard
            label="Visitors Inside"
            value={stats?.visitors_inside || 0}
            icon={<Users size={20} />}
            color={colors.primary}
            onClick={() => handleStatClick('visitors_inside')}
            loading={isLoading}
            description="Currently inside facility"
          />
          <StatCard
            label="Vehicles Out"
            value={stats?.vehicles_out || 0}
            icon={<Truck size={20} />}
            color={colors.brand}
            onClick={() => handleStatClick('vehicles_out')}
            loading={isLoading}
            description="Vehicles currently out"
          />
          <StatCard
            label="Expected Today"
            value={stats?.expected_today || 0}
            icon={<Clock size={20} />}
            color={colors.success}
            onClick={() => handleStatClick('expected_today')}
            loading={isLoading}
            description="Passes expected today"
          />
          <StatCard
            label="Expiring Soon"
            value={stats?.expiring_soon || 0}
            icon={<AlertTriangle size={20} />}
            color={colors.status.warning}
            onClick={() => handleStatClick('expiring_soon')}
            loading={isLoading}
            description="Expiring within 24 hours"
          />
        </StatsGrid>

        {/* Filter Bar */}
        <div style={{
          ...cardStyles.base,
          padding: spacing.md,
          display: 'flex',
          gap: spacing.md,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input
              type="text"
              placeholder="Search by name, pass number, or access code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: spacing.xs }}>
            {(['all', 'active', 'pending', 'inside'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', gap: spacing.xs }}>
            {(['all', 'visitor', 'vehicle'] as const).map((type) => (
              <Button
                key={type}
                variant={typeFilter === type ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTypeFilter(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Pass List */}
        {isLoading ? (
          <div style={{ display: 'grid', gap: spacing.md }}>
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : passes.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No Gate Passes Found"
            description={
              searchQuery
                ? `No passes match "${searchQuery}". Try adjusting your filters.`
                : "Get started by creating your first visitor pass or vehicle movement pass."
            }
            action={{
              label: "Create Visitor Pass",
              onClick: () => navigate('/app/gate-pass/create-visitor'),
              icon: "👤"
            }}
            secondaryAction={{
              label: "Create Vehicle Pass",
              onClick: () => navigate('/app/gate-pass/create-vehicle'),
              icon: "🚗"
            }}
          />
        ) : (
          <div style={{ display: 'grid', gap: spacing.md }}>
            {passes.map((pass) => (
              <PassCard
                key={pass.id}
                pass={pass}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.last_page}
            totalItems={pagination.total}
            perPage={pagination.per_page}
            onPageChange={(newPage) => {
              setPage(newPage);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPerPageChange={(newPerPage) => {
              setPage(1);
              // Note: perPage is fixed at 20 for now
            }}
          />
        )}
      </div>
    </PullToRefreshWrapper>
  );
};
