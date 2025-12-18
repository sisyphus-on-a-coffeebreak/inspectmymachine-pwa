import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGatePasses } from '@/hooks/useGatePasses';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { GatePassFilters, GatePassStatus, GatePass } from './gatePassTypes';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/ui/StatCard';
import { AnomalyAlert } from '../../components/ui/AnomalyAlert';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';
import PassDisplay from '../../components/ui/PassDisplay';
import { PassCard } from '../../components/gatepass/PassCard';
import { PassCardSkeleton } from '../../components/gatepass/PassCardSkeleton';
import { GatePassEmptyState } from './components/GatePassEmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { Pagination } from '../../components/ui/Pagination';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { PolicyLinks } from '../../components/ui/PolicyLinks';
import { postWithCsrf } from '../../lib/csrf';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';
import { PullToRefreshWrapper } from '../../components/ui/PullToRefreshWrapper';
import { FilterBadges } from '../../components/ui/FilterBadge';
import { useGatePassFilters } from './hooks/useGatePassFilters';
import { useUserRole } from './hooks/useUserRole';
import { GuardDashboardContent } from './components/dashboard/GuardDashboardContent';
import { StaffDashboardContent } from './components/dashboard/StaffDashboardContent';
import { SupervisorDashboardContent } from './components/dashboard/SupervisorDashboardContent';
import { X } from 'lucide-react';

// 🚪 Gate Pass Dashboard
// Main screen for office staff to manage all gate passes
// Shows active passes, allows creating new ones, and quick actions

export const GatePassDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { role, isGuard, isClerk, isSupervisor, isAdmin } = useUserRole();
  
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
      filterObj.status = ['pending', 'active', 'inside'];
    } else if (filters.status === 'active') {
      filterObj.status = ['active', 'inside'];
    } else {
      filterObj.status = [filters.status as GatePassStatus];
    }

    // Map type filter
    if (filters.type === 'visitor') {
      filterObj.type = 'visitor';
    } else if (filters.type === 'vehicle') {
      filterObj.type = ['vehicle_inbound', 'vehicle_outbound'];
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
  const visitorPasses = allPasses.filter((p: GatePass) => p.pass_type === 'visitor');
  const vehicleMovements = allPasses.filter((p: GatePass) => 
    p.pass_type === 'vehicle_inbound' || p.pass_type === 'vehicle_outbound'
  );
  
  // Pagination info
  const pagination = {
    total: passesData?.total || 0,
    page: passesData?.page || 1,
    per_page: passesData?.per_page || 20,
    last_page: passesData?.last_page || 1,
  };
  
  // Calculate expiring passes (within 24 hours) - client-side for now
  const expiringPasses = allPasses.filter((p: GatePass) => {
    if (p.status !== 'active') return false;
    if (!p.valid_to) return false;
    const validTo = new Date(p.valid_to);
    const hoursUntilExpiry = (validTo.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
  });
  
  const expiredPasses = allPasses.filter((p: GatePass) => {
    if (!p.valid_to) return false;
    return new Date(p.valid_to) < new Date();
  });
  
  // Use stats from API if available, otherwise calculate client-side
  const statsData = stats || {
    visitors_inside: visitorPasses.filter((p: GatePass) => p.status === 'inside').length,
    vehicles_out: vehicleMovements.filter((p: GatePass) => p.status === 'inside').length, // inside = out for vehicles
    expected_today: visitorPasses.filter((p: GatePass) => {
      const today = new Date().toISOString().split('T')[0];
      const validFromDate = p.valid_from ? p.valid_from.split('T')[0] : null;
      if (validFromDate !== today) return false;
      return p.status === 'pending' || p.status === 'active';
    }).length,
    expiring_soon: expiringPasses.length,
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
      queryClient.invalidateQueries({ queryKey: ['gate-passes'] });
      refetch();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to mark exit. Please try again.',
        variant: 'error',
      });
    }
  };

  const buildRecordMetadata = (
    pass: GatePass,
    type: 'visitor' | 'vehicle',
    passNumber: string
  ) => {
    const vehicle = pass.vehicle;
    return {
      passNumber,
      passType: type,
      visitorName:
        type === 'visitor'
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
      companyName: 'VOMS',
      companyLogo: undefined,
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
        import('../../lib/pdf-generator-simple'),
        import('../../lib/gate-pass-records'),
      ]);

      const passNumber = pdfUtils.formatPassNumber(type, passId);
      const metadata = buildRecordMetadata(pass, type, passNumber);

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
        import('../../lib/pdf-generator-simple'),
        import('../../lib/gate-pass-records'),
      ]);

      const passNumber = pdfUtils.formatPassNumber(type, passId);
      const metadata = buildRecordMetadata(pass, type, passNumber);

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
        <div style={{
          display: 'grid',
          // INVARIANT 2: mobile-safe stats grid
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: spacing.md,
          marginTop: spacing.lg,
          marginBottom: spacing.lg,
          width: '100%',
          maxWidth: '100%'
        }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={`stats-skeleton-${i}`} />
          ))}
        </div>
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

      {/* Policy Links - Only show for non-guard roles */}
      {!isGuard && (
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

      {/* Role-Based Dashboard Content */}
      {isGuard ? (
        <GuardDashboardContent />
      ) : isClerk ? (
        <StaffDashboardContent
          onCreateVisitor={() => navigate('/app/gate-pass/create?type=visitor')}
          onCreateOutbound={() => navigate('/app/gate-pass/create?type=outbound')}
          onCreateInbound={() => navigate('/app/gate-pass/create?type=inbound')}
          stats={statsData}
          loading={loading}
        />
      ) : isSupervisor ? (
        <SupervisorDashboardContent
          onCreateVisitor={() => navigate('/app/gate-pass/create?type=visitor')}
          onCreateOutbound={() => navigate('/app/gate-pass/create?type=outbound')}
          onCreateInbound={() => navigate('/app/gate-pass/create?type=inbound')}
          stats={statsData}
          loading={loading}
        />
      ) : (
        <>
          {/* Admin/Super Admin - Full Dashboard */}
          {/* Action Cards */}
      <ActionGrid gap="lg">
        {/* Create Visitor Pass */}
        <div
          onClick={() => navigate('/app/gate-pass/create?type=visitor')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.primary}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.15)';
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.primary;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            👥
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Create Visitor Pass
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            For clients & inspections
          </div>
        </div>

        {/* Create Vehicle Outbound */}
        <div
          onClick={() => navigate('/app/gate-pass/create?type=outbound')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.brand}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(235, 139, 0, 0.15)';
            e.currentTarget.style.borderColor = colors.brand;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.brand;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            🚛
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Vehicle Going Out
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            RTO, sale, test drive
          </div>
        </div>

        {/* Create Vehicle Inbound */}
        <div
          onClick={() => navigate('/app/gate-pass/create?type=inbound')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.success}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.borderColor = colors.success;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.success;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            🚗
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Vehicle Coming In
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            New vehicle arriving
          </div>
        </div>

        {/* Guard Register */}
        <div
          onClick={() => navigate('/app/gate-pass/guard-register')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.success}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.borderColor = colors.success;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.success;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            📊
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            View Guard Register
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Today's activity log
          </div>
        </div>

        {/* Reports & Analytics */}
        <div
          onClick={() => navigate('/app/gate-pass/reports')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.primary}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)';
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.primary;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            📈
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Reports & Analytics
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Comprehensive reporting and analytics
          </div>
        </div>

        {/* Pass Templates */}
        <div
          onClick={() => navigate('/app/gate-pass/templates')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.status.warning}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.15)';
            e.currentTarget.style.borderColor = colors.status.warning;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.status.warning;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            📋
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Pass Templates
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Saved templates for common passes
          </div>
        </div>

        {/* Visitor Management */}
        <div
          onClick={() => navigate('/app/gate-pass/visitors')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.status.normal}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.borderColor = colors.status.normal;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.status.normal;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            👥
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Visitor Management
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Manage visitor database and history
          </div>
        </div>

        {/* Calendar View */}
        <div
          onClick={() => navigate('/app/gate-pass/calendar')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.status.error}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.15)';
            e.currentTarget.style.borderColor = colors.status.error;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.status.error;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            📅
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Calendar View
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Calendar view of all gate passes
          </div>
        </div>

        {/* Quick Validation */}
        <div
          onClick={() => navigate('/app/gate-pass/quick-validation')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.brand}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(235, 139, 0, 0.15)';
            e.currentTarget.style.borderColor = colors.brand;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.brand;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            🚀
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Quick Validation
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Fast QR scanning for guards
          </div>
        </div>

        {/* Pass Validation (Full Mode) */}
        <div
          onClick={() => navigate('/app/gate-pass/validation')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.primary}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.15)';
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.primary;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            🛡️
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Full Validation
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Detailed validation with notes
          </div>
        </div>

        {/* Pass Approval */}
        <div
          onClick={() => navigate('/app/gate-pass/approval')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.status.success}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.borderColor = colors.status.success;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.status.success;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            ✅
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Pass Approval
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Multi-level approval workflow
          </div>
        </div>

        {/* Bulk Operations */}
        <div
          onClick={() => navigate('/app/gate-pass/bulk')}
          style={{
            ...cardStyles.base,
            padding: spacing.xl,
            cursor: 'pointer',
            minHeight: '120px',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const,
            border: `2px solid ${colors.status.normal}`,
            position: 'relative' as const
          }}
          className="card-hover touch-feedback"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.15)';
            e.currentTarget.style.borderColor = colors.status.normal;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = colors.status.normal;
          }}
        >
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: spacing.md,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}>
            🔄
          </div>
          <div style={{ 
            ...typography.subheader,
            fontSize: '20px',
            color: colors.neutral[900],
            marginBottom: spacing.sm
          }}>
            Bulk Operations
          </div>
          <div style={{ 
            ...typography.bodySmall,
            color: colors.neutral[600],
            lineHeight: 1.4
          }}>
            Bulk create, update, and export
          </div>
        </div>
      </ActionGrid>

      {/* Stats Row */}
      <StatsGrid gap="lg">
        <StatCard
          label="Visitors Inside"
          value={statsData.visitors_inside}
          icon={<span>👥</span>}
          color={colors.success || '#10B981'}
          onClick={() => {
            setFilter('status', 'inside');
            setFilter('type', 'visitor');
          }}
          loading={loading}
        />
        <StatCard
          label="Vehicles Out"
          value={statsData.vehicles_out}
          icon={<span>🚗</span>}
          color={colors.brand || '#EB8B00'}
          onClick={() => {
            setFilter('status', 'inside');
            setFilter('type', 'vehicle');
          }}
          loading={loading}
        />
        <StatCard
          label="Expected Today"
          value={statsData.expected_today}
          icon={<span>⏳</span>}
          color={colors.primary}
          onClick={() => setFilter('status', 'pending')}
          loading={loading}
        />
        <StatCard
          label="Expiring Soon"
          value={statsData.expiring_soon || expiringPasses.length}
          icon={<span>⏰</span>}
          color={colors.status?.warning || '#F59E0B'}
          onClick={() => setFilter('status', 'active')}
          loading={loading}
        />
      </StatsGrid>

      {/* Anomaly Alerts */}
      {(() => {
        const now = new Date();
        const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
        
        // Check for visitors inside > 8 hours
        const longStayVisitors = allPasses.filter((pass: GatePass) => {
          if (pass.pass_type !== 'visitor') return false;
          if (pass.status !== 'inside' || !pass.entry_time) return false;
          const entryTime = new Date(pass.entry_time);
          return entryTime < eightHoursAgo;
        });

        // Check for expired but still active passes
        const expiredActive = allPasses.filter((pass: GatePass) => {
          if (pass.status !== 'active' && pass.status !== 'inside') return false;
          if (!pass.valid_to) return false;
          return new Date(pass.valid_to) < now;
        });

        // Check for vehicles out without return scan
        const vehiclesOutLong = allPasses.filter((pass: GatePass) => {
          if (pass.pass_type === 'visitor') return false;
          if (pass.status !== 'inside' || !pass.entry_time) return false; // inside = out for vehicles
          const exitTime = new Date(pass.entry_time);
          const hoursOut = (now.getTime() - exitTime.getTime()) / (1000 * 60 * 60);
          return hoursOut > 24; // Out for more than 24 hours
        });

        return (
          <>
            {longStayVisitors.length > 0 && (
              <AnomalyAlert
                title={`${longStayVisitors.length} Visitor${longStayVisitors.length > 1 ? 's' : ''} Inside > 8 Hours`}
                description="Some visitors have been inside for more than 8 hours. Please verify their status."
                severity="warning"
                actions={[
                  {
                    label: 'View Long Stay Visitors',
                    onClick: () => {
                      setFilter('status', 'inside');
                      setFilter('type', 'visitor');
                    },
                    variant: 'primary',
                  },
                ]}
              />
            )}
            {expiredActive.length > 0 && (
              <AnomalyAlert
                title={`${expiredActive.length} Expired Pass${expiredActive.length > 1 ? 'es' : ''} Still Active`}
                description="Some passes have expired but are still marked as active. Please review and update their status."
                severity="error"
                actions={[
                  {
                    label: 'Review Expired Passes',
                    onClick: () => setFilter('status', 'all'),
                    variant: 'primary',
                  },
                ]}
              />
            )}
            {vehiclesOutLong.length > 0 && (
              <AnomalyAlert
                title={`${vehiclesOutLong.length} Vehicle${vehiclesOutLong.length > 1 ? 's' : ''} Out > 24 Hours`}
                description="Some vehicles have been out for more than 24 hours without a return scan."
                severity="warning"
                actions={[
                  {
                    label: 'View Vehicles Out',
                    onClick: () => {
                      setFilter('status', 'inside');
                      setFilter('type', 'vehicle');
                    },
                    variant: 'primary',
                  },
                ]}
              />
            )}
          </>
        );
      })()}

      {/* Filters */}
      <div style={{ 
        marginBottom: spacing.lg,
        backgroundColor: 'white',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.neutral[200]}`,
      }}>
        <div style={{ 
          display: 'flex',
          gap: spacing.sm,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: hasActiveFilters ? spacing.sm : 0,
        }}>
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by name, pass number, or access code..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            style={{
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: typography.bodySmall.fontSize,
              flex: 1,
              minWidth: '200px',
              fontFamily: typography.body.fontFamily,
            }}
          />
          
          {/* Status Filter */}
          {(['all', 'active', 'pending', 'inside'] as const).map(filterOption => (
            <button
              key={filterOption}
              onClick={() => setFilter('status', filterOption)}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                border: filters.status === filterOption ? `2px solid ${colors.primary[500]}` : `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                backgroundColor: filters.status === filterOption ? colors.primary[50] : 'white',
                color: filters.status === filterOption ? colors.primary[600] : colors.neutral[700],
                cursor: 'pointer',
                fontSize: typography.bodySmall.fontSize,
                fontWeight: filters.status === filterOption ? 600 : 500,
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (filters.status !== filterOption) {
                  e.currentTarget.style.borderColor = colors.primary[300];
                  e.currentTarget.style.backgroundColor = colors.neutral[50];
                }
              }}
              onMouseLeave={(e) => {
                if (filters.status !== filterOption) {
                  e.currentTarget.style.borderColor = colors.neutral[300];
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {filterOption}
            </button>
          ))}
          
          {/* Type Filter */}
          {(['all', 'visitor', 'vehicle'] as const).map(typeOption => (
            <button
              key={typeOption}
              onClick={() => setFilter('type', typeOption)}
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                border: filters.type === typeOption ? `2px solid ${colors.primary[500]}` : `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                backgroundColor: filters.type === typeOption ? colors.primary[50] : 'white',
                color: filters.type === typeOption ? colors.primary[600] : colors.neutral[700],
                cursor: 'pointer',
                fontSize: typography.bodySmall.fontSize,
                fontWeight: filters.type === typeOption ? 600 : 500,
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (filters.type !== typeOption) {
                  e.currentTarget.style.borderColor = colors.primary[300];
                  e.currentTarget.style.backgroundColor = colors.neutral[50];
                }
              }}
              onMouseLeave={(e) => {
                if (filters.type !== typeOption) {
                  e.currentTarget.style.borderColor = colors.neutral[300];
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {typeOption}
            </button>
          ))}
        </div>
        
        {/* Filter Summary and Clear Button */}
        {hasActiveFilters && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: spacing.sm,
            paddingTop: spacing.sm,
            borderTop: `1px solid ${colors.neutral[200]}`,
          }}>
            <div style={{
              ...typography.bodySmall,
              color: colors.neutral[600],
            }}>
              Showing {pagination.total} result{pagination.total !== 1 ? 's' : ''}
              {activeFilterCount > 0 && ` • ${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active`}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={clearFilters}
              icon={<X size={16} />}
            >
              Clear Filters
            </Button>
          </div>
        )}
        
        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div style={{ marginTop: spacing.sm }}>
            <FilterBadges
              filters={[
                ...(filters.status !== 'all' ? [{
                  label: 'Status',
                  value: filters.status.charAt(0).toUpperCase() + filters.status.slice(1),
                  onRemove: () => setFilter('status', 'all'),
                }] : []),
                ...(filters.type !== 'all' ? [{
                  label: 'Type',
                  value: filters.type.charAt(0).toUpperCase() + filters.type.slice(1),
                  onRemove: () => setFilter('type', 'all'),
                }] : []),
                ...(filters.search.trim() ? [{
                  label: 'Search',
                  value: filters.search,
                  onRemove: () => setFilter('search', ''),
                }] : []),
              ]}
              onClearAll={clearFilters}
            />
          </div>
        )}
      </div>

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
          onCreatePass={() => navigate('/app/gate-pass/create')}
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