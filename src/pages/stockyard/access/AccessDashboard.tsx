import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGatePasses } from '@/hooks/useGatePasses';
import { useQueryClient } from '@tanstack/react-query';
import type { GatePassFilters, GatePassStatus, GatePass } from './gatePassTypes';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/StatCard';
import { AnomalyAlert } from '@/components/ui/AnomalyAlert';
import { ActionGrid, StatsGrid } from '@/components/ui/ResponsiveGrid';
import PassDisplay from '@/components/ui/PassDisplay';
import { PassCard } from './components/PassCard';
import { PassCardSkeleton } from './components/PassCardSkeleton';
import { GatePassEmptyState } from './components/GatePassEmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { NetworkError } from '@/components/ui/NetworkError';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { PolicyLinks } from '@/components/ui/PolicyLinks';
import { postWithCsrf } from '@/lib/csrf';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/components/ui/Modal';
import { PullToRefreshWrapper } from '@/components/ui/PullToRefreshWrapper';
import { FilterBadges } from '@/components/ui/FilterBadge';
import { useGatePassFilters } from './hooks/useGatePassFilters';
import { useUserRole } from './hooks/useUserRole';
import { GuardDashboardContent } from './components/dashboard/GuardDashboardContent';
import { StaffDashboardContent } from './components/dashboard/StaffDashboardContent';
import { SupervisorDashboardContent } from './components/dashboard/SupervisorDashboardContent';
import { ActionCards } from './components/dashboard/ActionCards';
import { StatsCards } from './components/dashboard/StatsCards';
import { AnomalyAlerts } from './components/dashboard/AnomalyAlerts';
import { FiltersSection } from './components/dashboard/FiltersSection';
import { DEFAULT_PAGE_SIZE, GATE_PASS_TYPE, GATE_PASS_STATUS } from './constants';

// 🏭 Stockyard Access Dashboard (formerly Gate Pass Dashboard)
// Main screen for office staff to manage all access passes
// Shows active passes, allows creating new ones, and quick actions

export const AccessDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const queryClient = useQueryClient();
  const { role, isGuard, isClerk, isSupervisor, isAdmin, permissions } = useUserRole();
  
  // URL-based filter management
  const { filters, setFilter, clearFilters, hasActiveFilters, activeFilterCount } = useGatePassFilters();
  const perPage = 20;

  // Build API filters from URL-based filters
  const apiFilters: GatePassFilters = useMemo(() => {
    const filterObj: GatePassFilters = {
      per_page: perPage,
      page: filters.page,
      include_stats: true, // Request stats in same call
    };

    // Map status filter
    if (filters.status === 'all') {
      // Exclude completed/cancelled/expired by default
      filterObj.status = [GATE_PASS_STATUS.PENDING, GATE_PASS_STATUS.ACTIVE, GATE_PASS_STATUS.INSIDE];
    } else if (filters.status === 'active') {
      filterObj.status = [GATE_PASS_STATUS.ACTIVE, GATE_PASS_STATUS.INSIDE];
    } else {
      filterObj.status = [filters.status as GatePassStatus];
    }

    // Map type filter
    if (filters.type === 'visitor') {
      filterObj.type = GATE_PASS_TYPE.VISITOR;
    } else if (filters.type === 'vehicle') {
      filterObj.type = [GATE_PASS_TYPE.VEHICLE_INBOUND, GATE_PASS_TYPE.VEHICLE_OUTBOUND];
    }
    // 'all' means no type filter

    // Add search if present
    if (filters.search.trim()) {
      filterObj.search = filters.search.trim();
    }

    return filterObj;
  }, [filters, perPage]);

  // Single API call with stats included
  const { data: passesData, isLoading: loading, error: queryError, refetch } = useGatePasses(apiFilters);

  // Extract data from unified response
  const allPasses = passesData?.data || [];
  const stats = passesData?.stats;
  
  // Separate by type for backward compatibility with existing UI
  const visitorPasses = allPasses.filter((p: GatePass) => p.pass_type === GATE_PASS_TYPE.VISITOR);
  const vehicleMovements = allPasses.filter((p: GatePass) => 
    p.pass_type === GATE_PASS_TYPE.VEHICLE_INBOUND || p.pass_type === GATE_PASS_TYPE.VEHICLE_OUTBOUND
  );
  
  // Pagination info
  const pagination = {
    total: passesData?.total || 0,
    page: passesData?.page || 1,
    per_page: passesData?.per_page || DEFAULT_PAGE_SIZE,
    last_page: passesData?.last_page || 1,
  };
  
  // Always use stats from backend - no client-side calculation
  // Backend stats are authoritative and more efficient
  const statsData = stats || {
    visitors_inside: 0,
    vehicles_out: 0,
    expected_today: 0,
    expiring_soon: 0,
    pending_approval: 0,
  };
  
  const error = queryError ? (queryError instanceof Error ? queryError : new Error('Failed to load gate passes')) : null;
  const [selectedPass, setSelectedPass] = useState<{
    id: number | string;
    passType: 'visitor' | 'vehicle';
    visitorName?: string;
    vehicleDetails?: {
      registration: string;
      make: string;
      model: string;
    };
    purpose: string;
    entryTime: string;
    expectedReturn?: string;
    companyName?: string;
    companyLogo?: string;
  } | null>(null);

  // Reset to page 1 when filters change (handled in useGatePassFilters hook)

  const handleMarkExit = async (passId: number, type: 'visitor' | 'vehicle') => {
    const confirmed = await confirm({
      title: 'Mark Exit',
      message: 'Mark this pass as exited?',
      confirmLabel: 'Mark Exit',
      cancelLabel: 'Cancel',
    });
    
    if (!confirmed) return;

    try {
      // Use unified v2 API
      await postWithCsrf(`/v2/gate-passes/${passId}/exit`, {});
      showToast({
        title: 'Success',
        description: 'Exit marked successfully!',
        variant: 'success',
      });
      // Invalidate and refetch gate passes
      queryClient.invalidateQueries({ queryKey: ['access-passes'] });
      refetch();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to mark exit. Please try again.',
        variant: 'error',
      });
    }
  };

  const buildRecordMetadata = async (
    pass: GatePass,
    type: 'visitor' | 'vehicle',
    passNumber: string
  ) => {
    const vehicle = pass.vehicle;
    
    // Get company branding (logo and name)
    let companyName = 'VOMS';
    let companyLogo: string | undefined;
    try {
      const { getReportBranding, getSafeLogoUrl } = await import('@/lib/report-branding');
      const branding = await getReportBranding();
      companyName = branding.companyName || companyName;
      // Fetch logo as safe URL (blob URL) to avoid CORS issues
      if (branding.logoUrl) {
        const safeUrl = await getSafeLogoUrl(branding.logoUrl);
        companyLogo = safeUrl || undefined;
      }
    } catch (error) {
      // If branding fetch fails, use defaults
      console.warn('Failed to fetch company branding for gate pass:', error);
    }
    
    return {
      passNumber,
      passType: type,
      visitorName:
        type === GATE_PASS_TYPE.VISITOR
          ? pass.visitor_name || 'Visitor'
          : pass.driver_name || vehicle?.registration_number || 'Vehicle Movement',
      vehicleDetails: type === 'vehicle'
        ? {
            registration: vehicle?.registration_number || '',
            make: vehicle?.make || '',
            model: vehicle?.model || '',
          }
        : undefined,
      purpose: pass.purpose,
      entryTime:
        type === 'visitor'
          ? (pass.valid_from || new Date().toISOString())
          : (pass.entry_time || new Date().toISOString()),
      expectedReturn:
        pass.expected_return_date || pass.expected_return_time || undefined,
      companyName,
      companyLogo,
    };
  };

  const handleDownloadPDF = async (passId: number | string, type: 'visitor' | 'vehicle') => {
    try {
      // Find the pass data from unified list
      const pass = allPasses.find((p: GatePass) => String(p.id) === String(passId));

      if (!pass) {
        showToast({
          title: 'Error',
          description: 'Pass not found',
          variant: 'error',
        });
        return;
      }

      const [pdfUtils, recordUtils] = await Promise.all([
        import('@/lib/pdf-generator-simple'),
        import('@/lib/gate-pass-records'),
      ]);

      const passNumber = pdfUtils.formatPassNumber(type, passId);
      const metadata = await buildRecordMetadata(pass, type, passNumber);

      // Sync with backend - backend MUST provide qrPayload for verifiable QR codes
      const record = await recordUtils.syncGatePassRecord({
        passId: (pass as any).id ?? passId,
        passType: type,
        metadata,
      });

      // Generate QR code from backend's verifiable qrPayload
      let qrCode = record.qrCode;
      if (!qrCode) {
        if (!record.qrPayload || record.qrPayload.trim() === '') {
          throw new Error('Backend did not provide verifiable QR payload. Cannot generate PDF without valid QR code.');
        }
        try {
          qrCode = await pdfUtils.generateQRCode(record.qrPayload);
        } catch (qrError) {
          const errorMessage = qrError instanceof Error ? qrError.message : 'Unknown error';
          throw new Error(`Failed to generate QR code: ${errorMessage}`);
        }
      }

      const pdfBlob = await pdfUtils.generatePDFPass({
        passNumber,
        passType: type,
        visitorName: metadata.visitorName,
        vehicleDetails: metadata.vehicleDetails,
        purpose: metadata.purpose,
        entryTime: metadata.entryTime,
        expectedReturn: metadata.expectedReturn,
        accessCode: record.accessCode,
        qrCode,
        companyName: metadata.companyName,
        companyLogo: metadata.companyLogo,
      });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gate-pass-${passNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to download PDF. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleSharePass = async (passId: number | string, type: 'visitor' | 'vehicle') => {
    try {
      // Find the pass data from unified list
      const pass = allPasses.find((p: GatePass) => String(p.id) === String(passId));

      if (!pass) {
        showToast({
          title: 'Error',
          description: 'Pass not found',
          variant: 'error',
        });
        return;
      }

      const [pdfUtils, recordUtils] = await Promise.all([
        import('@/lib/pdf-generator-simple'),
        import('@/lib/gate-pass-records'),
      ]);

      const passNumber = pdfUtils.formatPassNumber(type, passId);
      const metadata = await buildRecordMetadata(pass, type, passNumber);

      const record = await recordUtils.syncGatePassRecord({
        passId: (pass as any).id ?? passId,
        passType: type,
        metadata,
      });

      let qrCode = record.qrCode;
      if (!qrCode) {
        const payload = record.qrPayload || record.accessCode;
        try {
          qrCode = await pdfUtils.generateQRCode(payload);
        } catch (qrError) {
          // Failed to generate QR code while preparing share payload
          qrCode = '';
        }
      }

      await pdfUtils.sharePass({
        passNumber,
        passType: type,
        visitorName: metadata.visitorName,
        vehicleDetails: metadata.vehicleDetails,
        purpose: metadata.purpose,
        entryTime: metadata.entryTime,
        expectedReturn: metadata.expectedReturn,
        accessCode: record.accessCode,
        qrCode,
        companyName: metadata.companyName,
        companyLogo: metadata.companyLogo,
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to share pass. Please try again.',
        variant: 'error',
      });
    }
  };


  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      inside: { backgroundColor: '#10B981', color: 'white' },
      out: { backgroundColor: '#F59E0B', color: 'white' },
      pending: { backgroundColor: '#6B7280', color: 'white' },
      completed: { backgroundColor: '#3B82F6', color: 'white' },
      cancelled: { backgroundColor: '#EF4444', color: 'white' }
    };

    const labels: Record<string, string> = {
      inside: '🟢 Inside Now',
      out: '🟡 Out for RTO',
      pending: '⏳ Pending Entry',
      completed: '✅ Completed',
      cancelled: '❌ Cancelled'
    };

    return (
      <span style={{
        ...styles[status],
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 500
      }}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <PageHeader
          title="Gate Pass Management"
          subtitle="Manage visitor passes, vehicle movements, and gate operations"
          icon="🚪"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
            { label: 'Gate Pass', icon: '🚪' }
          ]}
        />
        <StatsGrid gap="md" style={{ marginTop: spacing.lg, marginBottom: spacing.lg }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`stats-skeleton-${i}`} />
          ))}
        </StatsGrid>
        <div style={{ marginTop: spacing.lg }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={`list-skeleton-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <PageHeader
          title="Gate Pass Management"
          subtitle="Manage visitor passes, vehicle movements, and gate operations"
          icon="🚪"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
            { label: 'Gate Pass', icon: '🚪' }
          ]}
        />
        <NetworkError
          error={error}
          onRetry={() => refetch()}
          onGoBack={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <>
        {ConfirmComponent}
        <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
      padding: `${spacing.xl} ${spacing.lg}`,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: colors.neutral[50],
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.xl
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
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            {isAdmin && (
              <Button
                variant="warning"
                size="sm"
                onClick={() => navigate('/app/stockyard/access/bulk')}
                icon={<span>📊</span>}
              >
                Bulk Create
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              icon={<span>🔄</span>}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Policy Links - Only show for roles with create capability */}
      {permissions.canCreatePasses && (
        <PolicyLinks
          title="Gate Pass Policy & Compliance"
          links={[
            {
              label: 'Gate Pass Policy',
              url: '/policies/gate-pass-policy',
              external: false,
              icon: '📋'
            },
            {
              label: 'Escalation Rules',
              url: '/policies/escalation-rules',
              external: false,
              icon: '⚡'
            },
            {
              label: 'Compliance Checklist',
              url: '/policies/compliance-checklist',
              external: false,
              icon: '✅'
            }
          ]}
          variant="compact"
        />
      )}

      {/* Capability-Based Dashboard Content */}
      {permissions.canValidatePasses && !permissions.canCreatePasses ? (
        // Guard: validate only
        <GuardDashboardContent />
      ) : permissions.canCreatePasses && !permissions.canApprovePasses ? (
        // Executive/Clerk: create + validate (submit for approval)
        <StaffDashboardContent
          onCreateVisitor={() => navigate('/app/stockyard/access/create?type=visitor')}
          onCreateOutbound={() => navigate('/app/stockyard/access/create?type=outbound')}
          onCreateInbound={() => navigate('/app/stockyard/access/create?type=inbound')}
          stats={statsData}
          loading={loading}
        />
      ) : permissions.canApprovePasses ? (
        // Supervisor/Yard In-charge/Admin: approve + validate (and maybe create)
        <SupervisorDashboardContent
          onCreateVisitor={() => navigate('/app/stockyard/access/create?type=visitor')}
          onCreateOutbound={() => navigate('/app/stockyard/access/create?type=outbound')}
          onCreateInbound={() => navigate('/app/stockyard/access/create?type=inbound')}
          stats={statsData}
          loading={loading}
        />
      ) : (
        <>
          {/* Admin/Super Admin - Full Dashboard */}
          {/* Action Cards */}
          <ActionCards />

          {/* Stats Row */}
          <StatsCards
            stats={statsData}
            loading={loading}
            onStatClick={(filter) => {
              if (filter.status) setFilter('status', filter.status as any);
              if (filter.type) setFilter('type', filter.type as any);
            }}
          />

          {/* Anomaly Alerts */}
          <AnomalyAlerts
            passes={allPasses}
            onFilterChange={(filter) => {
              if (filter.status) setFilter('status', filter.status as any);
              if (filter.type) setFilter('type', filter.type as any);
            }}
          />

          {/* Filters */}
          <FiltersSection />

          {/* Active Passes Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: spacing.xl,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              marginBottom: spacing.lg,
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              📋 Active Gate Passes
            </h2>

            {/* Pass List - Using PassCard Component */}
            {loading ? (
              <div role="list" aria-label="Gate passes loading">
                <PassCardSkeleton count={5} />
              </div>
            ) : allPasses.length === 0 ? (
              <GatePassEmptyState
                type={pagination.total === 0 ? 'no-data' : 'no-results'}
                onClearFilters={hasActiveFilters ? clearFilters : undefined}
                onCreatePass={() => navigate('/app/stockyard/access/create')}
                hasActiveFilters={hasActiveFilters}
              />
            ) : (
              <div role="list" aria-label="Gate passes" style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                {allPasses.map((pass: GatePass) => (
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
                onPageChange={(page) => {
                  setFilter('page', page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onPerPageChange={() => {
                  // Note: perPage is fixed at 20 for now
                  // Reset to page 1 if perPage changes in the future
                  setFilter('page', 1);
                }}
              />
            )}
          </div>
        </>
      )}
      </div>

      {/* Pass Display Modal */}
      {selectedPass && (
        <PassDisplay
          passData={selectedPass}
          onClose={() => setSelectedPass(null)}
        />
      )}
      </>
    </PullToRefreshWrapper>
  );
};
