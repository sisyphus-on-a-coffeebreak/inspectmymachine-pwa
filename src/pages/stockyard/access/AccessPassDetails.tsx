/**
 * Access Pass Details Page (formerly Gate Pass Details)
 * 
 * Comprehensive pass information with QR code, timeline, and actions
 * Works with unified gate_passes model
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGatePass, useRecordEntry, useRecordExit, useCancelGatePass } from '@/hooks/useGatePasses';
import { useToast } from '@/providers/ToastProvider';
import { addRecentlyViewed } from '@/lib/recentlyViewed';
import { colors, spacing } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { NetworkError } from '@/components/ui/NetworkError';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useConfirm } from '@/components/ui/Modal';
import { ShareButton } from '@/components/ui/ShareButton';
import { useUserRole } from './hooks/useUserRole';
import { useGatePassDetails } from './hooks/useGatePassDetails';
import { QRCodeSection } from './components/details/QRCodeSection';
import { PassDetailsSection } from './components/details/PassDetailsSection';
import { TimelineSection } from './components/details/TimelineSection';
import { ActionsSection } from './components/details/ActionsSection';
import { QRCodeModal } from './components/details/QRCodeModal';
import {
  getPassDisplayName,
  getStatusLabel,
  getStatusColor,
  getPassTypeLabel,
  isVisitorPass,
  isOutboundVehicle,
} from './gatePassTypes';
import { GATE_PASS_STATUS } from './constants';

export const AccessPassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm, ConfirmComponent } = useConfirm();
  const { showToast } = useToast();
  const { permissions } = useUserRole();
  
  // Validate and sanitize id - ensure it's not undefined, empty, or the literal ':id'
  const validId = id && id !== ':id' && id.trim() !== '' ? id.trim() : undefined;
  
  // Redirect to dashboard if no valid ID
  useEffect(() => {
    if (!validId) {
      showToast({
        title: 'Invalid Pass ID',
        description: 'The gate pass ID is missing or invalid.',
        variant: 'error',
      });
      navigate('/app/stockyard/access');
    }
  }, [validId, navigate, showToast]);
  
  // Fetch pass using unified hook
  const { data: pass, isLoading, error, refetch } = useGatePass(validId);
  const recordEntry = useRecordEntry();
  const recordExit = useRecordExit();
  const cancelPass = useCancelGatePass();
  
  const [showQrModal, setShowQrModal] = useState(false);
  
  // Use custom hook for QR code and downloads
  const {
    qrCodeDataUrl,
    qrLoading,
    isDownloading,
    formatDateTime,
    getTimeInside,
    handleDownloadPDF,
    handleDownloadPNG,
  } = useGatePassDetails(pass);

  // Track in recently viewed
  useEffect(() => {
    if (pass && id) {
      addRecentlyViewed({
        id: String(id),
        type: 'gate-pass',
        title: `Pass #${pass.pass_number}`,
        subtitle: getPassDisplayName(pass),
        path: `/app/gate-pass/${id}`,
      });
    }
  }, [pass, id]);


  // Handle record entry
  const handleRecordEntry = async () => {
    if (!pass || !id) return;

    const confirmed = await confirm({
      title: 'Record Entry',
      message: `Record entry for ${getPassDisplayName(pass)}?`,
      confirmLabel: 'Record Entry',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await recordEntry.mutateAsync({ id, notes: undefined });
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  // Handle record exit
  const handleRecordExit = async () => {
    if (!pass || !id) return;

    const confirmed = await confirm({
      title: 'Record Exit',
      message: `Record exit for ${getPassDisplayName(pass)}?`,
      confirmLabel: 'Record Exit',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await recordExit.mutateAsync({ id, notes: undefined });
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  // Handle cancel pass
  const handleCancel = async () => {
    if (!pass || !id) return;

    const confirmed = await confirm({
      title: 'Cancel Pass',
      message: `Are you sure you want to cancel this pass? This action cannot be undone.`,
      confirmLabel: 'Cancel Pass',
      cancelLabel: 'Keep Pass',
      variant: 'critical',
    });

    if (!confirmed) return;

    try {
      await cancelPass.mutateAsync(id);
      refetch();
    } catch {
      // Error handled by hook
    }
  };


  // Get status theme color
  const getStatusTheme = (): string => {
    if (!pass) return colors.neutral[500];
    
    if (pass.status === GATE_PASS_STATUS.ACTIVE || pass.status === GATE_PASS_STATUS.PENDING) {
      return colors.primary;
    }
    if (pass.status === GATE_PASS_STATUS.INSIDE) {
      return colors.success[500] as string;
    }
    if (pass.status === GATE_PASS_STATUS.COMPLETED) {
      return colors.neutral[500] as string;
    }
    if (pass.status === GATE_PASS_STATUS.EXPIRED || pass.status === GATE_PASS_STATUS.CANCELLED || pass.status === GATE_PASS_STATUS.REJECTED) {
      return colors.error[500] as string;
    }
    return colors.neutral[500];
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <PageHeader
          title="Gate Pass Details"
          subtitle="Loading..."
          icon="🚪"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="card" />
        </div>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <PageHeader
          title="Gate Pass Details"
          subtitle="Error loading pass"
          icon="🚪"
        />
        <NetworkError
          error={error || new Error('Gate pass not found')}
          onRetry={() => refetch()}
          onGoBack={() => navigate('/app/gate-pass')}
        />
      </div>
    );
  }

  const statusTheme = getStatusTheme();
  const timeInside = getTimeInside();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
      {ConfirmComponent}
      
      <PageHeader
        title={`Pass #${pass.pass_number}`}
        subtitle={
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
            <span>{getPassDisplayName(pass)}</span>
            <Badge
              variant={isVisitorPass(pass) ? 'info' : isOutboundVehicle(pass) ? 'warning' : 'success'}
              size="md"
              style={{ 
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '11px',
                letterSpacing: '0.5px',
              }}
            >
              {getPassTypeLabel(pass.pass_type)}
            </Badge>
          </div>
        }
        icon="🚪"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
          { label: 'Gate Passes', path: '/app/gate-pass', icon: '🚪' },
          { label: 'Details' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/app/gate-pass')}
              icon={<ArrowLeft size={16} />}
            >
              Back
            </Button>
            <ShareButton
              title={`Gate Pass: ${getPassDisplayName(pass)}`}
              text={`Gate Pass #${pass.pass_number} - ${getPassDisplayName(pass)}`}
              url={`${window.location.origin}/app/gate-pass/${id}`}
              variant="secondary"
            />
          </div>
        }
      />

      {/* QR Code Section */}
      <QRCodeSection
        pass={pass}
        qrCodeDataUrl={qrCodeDataUrl}
        qrLoading={qrLoading}
        statusTheme={statusTheme}
        onEnlarge={() => setShowQrModal(true)}
      />

      {/* Status Badge */}
      <div style={{ marginTop: spacing.lg, display: 'flex', justifyContent: 'center' }}>
        <Badge
          variant={(() => {
            const color = getStatusColor(pass.status);
            if (color === 'green') return 'success';
            if (color === 'red') return 'error';
            if (color === 'yellow') return 'warning';
            if (color === 'blue') return 'info';
            return 'neutral';
          })()}
          size="lg"
        >
          {getStatusLabel(pass.status)}
        </Badge>
      </div>

      {/* Pass Details Section */}
      <PassDetailsSection
        pass={pass}
        statusTheme={statusTheme}
        timeInside={timeInside}
        formatDateTime={formatDateTime}
      />

      {/* Timeline Section */}
      <TimelineSection
        pass={pass}
        formatDateTime={formatDateTime}
      />

      {/* Actions Section */}
      <ActionsSection
        pass={pass}
        permissions={permissions}
        isDownloading={isDownloading}
        qrCodeDataUrl={qrCodeDataUrl}
        recordEntry={recordEntry}
        recordExit={recordExit}
        cancelPass={cancelPass}
        onDownloadPDF={handleDownloadPDF}
        onDownloadPNG={handleDownloadPNG}
        onRecordEntry={handleRecordEntry}
        onRecordExit={handleRecordExit}
        onCancel={handleCancel}
        onApprovalSuccess={() => refetch()}
      />

      {/* QR Code Modal */}
      {showQrModal && qrCodeDataUrl && (
        <QRCodeModal
          pass={pass}
          qrCodeDataUrl={qrCodeDataUrl}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
};
