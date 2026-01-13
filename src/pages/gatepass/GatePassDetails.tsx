/**
 * Gate Pass Details Page
 * 
 * Comprehensive pass information with QR code, timeline, and actions
 * Works with unified gate_passes model
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Maximize2, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { useGatePass, useRecordEntry, useRecordExit, useCancelGatePass } from '@/hooks/useGatePasses';
import { generateQRCode, generatePDFPass } from '@/lib/pdf-generator-simple';
import { useToast } from '@/providers/ToastProvider';
import { addRecentlyViewed } from '@/lib/recentlyViewed';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { NetworkError } from '@/components/ui/NetworkError';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useConfirm } from '@/components/ui/Modal';
import { ShareButton } from '@/components/ui/ShareButton';
import { useUserRole } from './hooks/useUserRole';
import { apiClient } from '@/lib/apiClient';
import {
  isVisitorPass,
  isOutboundVehicle,
  getPassDisplayName,
  getStatusLabel,
  getStatusColor,
  isExpired,
} from './gatePassTypes';

export const GatePassDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm, ConfirmComponent } = useConfirm();
  const { showToast } = useToast();
  const { permissions } = useUserRole();
  
  // Fetch pass using unified hook
  const { data: pass, isLoading, error, refetch } = useGatePass(id);
  const recordEntry = useRecordEntry();
  const recordExit = useRecordExit();
  const cancelPass = useCancelGatePass();
  
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Approval panel state
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);

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

  // Generate QR code
  useEffect(() => {
    if (!pass) return;

    const generateQR = async () => {
      try {
        setQrLoading(true);
        
        // Get QR payload from pass
        let qrPayload: string | null = null;
        
        console.log('[GatePassDetails] Pass qr_payload:', {
          type: typeof pass.qr_payload,
          value: pass.qr_payload,
          isArray: Array.isArray(pass.qr_payload),
        });
        
        if (typeof pass.qr_payload === 'string' && pass.qr_payload.trim() !== '') {
          qrPayload = pass.qr_payload;
        } else if (pass.qr_payload && typeof pass.qr_payload === 'object') {
          qrPayload = JSON.stringify(pass.qr_payload);
        } else if (pass.access_code) {
          // Fallback to access code if no QR payload
          console.warn('[GatePassDetails] Using access_code as fallback for QR payload');
          qrPayload = pass.access_code;
        }

        console.log('[GatePassDetails] Final qrPayload:', qrPayload);

        if (qrPayload && qrPayload.trim() !== '') {
          try {
            const qrDataUrl = await generateQRCode(qrPayload);
            console.log('[GatePassDetails] QR code generated successfully');
            setQrCodeDataUrl(qrDataUrl);
          } catch (qrError) {
            console.error('[GatePassDetails] generateQRCode failed:', qrError);
            throw qrError; // Re-throw to be caught by outer catch
          }
        } else {
          console.warn('[GatePassDetails] No QR payload available for pass:', pass.id);
        }
    } catch (error) {
      // Log the error for debugging
      console.error('[GatePassDetails] QR code generation failed:', error);
      console.error('[GatePassDetails] Pass data:', { 
        id: pass.id, 
        qr_payload: pass.qr_payload, 
        access_code: pass.access_code 
      });
      // Don't show error to user, just don't display QR
      } finally {
        setQrLoading(false);
      }
    };

    generateQR();
  }, [pass]);

  // Format date/time
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle PDF Download
  const handleDownloadPDF = async () => {
    if (!pass) return;

    setIsDownloading(true);
    try {
      // Get QR code
      let qrCode: string;
      if (qrCodeDataUrl) {
        qrCode = qrCodeDataUrl;
      } else {
        // Generate QR code from payload
        let qrPayload: string;
        if (typeof pass.qr_payload === 'string' && pass.qr_payload.trim() !== '') {
          qrPayload = pass.qr_payload;
        } else if (pass.qr_payload && typeof pass.qr_payload === 'object') {
          qrPayload = JSON.stringify(pass.qr_payload);
        } else {
          qrPayload = pass.access_code;
        }
        qrCode = await generateQRCode(qrPayload);
      }

      // Determine pass type for PDF
      const passType: 'visitor' | 'vehicle' = isVisitorPass(pass) ? 'visitor' : 'vehicle';
      
      // Build pass data
      const passData = {
        passNumber: pass.pass_number,
        passType,
        visitorName: pass.visitor_name || undefined,
        vehicleDetails: pass.vehicle ? {
          registration: pass.vehicle.registration_number || '',
          make: pass.vehicle.make || '',
          model: pass.vehicle.model || '',
        } : undefined,
        purpose: pass.purpose.replace('_', ' '),
        entryTime: pass.entry_time || pass.valid_from || new Date().toISOString(),
        expectedReturn: pass.expected_return_date ? 
          `${pass.expected_return_date}${pass.expected_return_time ? ' ' + pass.expected_return_time : ''}` : 
          pass.valid_to || undefined,
        accessCode: pass.access_code,
        qrCode,
      };

      // Generate PDF
      const pdfBlob = await generatePDFPass(passData);
      
      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gate-pass-${pass.pass_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast({
        title: 'Success',
        description: 'Gate pass PDF downloaded successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('[GatePassDetails] PDF download failed:', error);
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download PDF. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle PNG Download (screenshot of QR code)
  const handleDownloadPNG = async () => {
    if (!pass || !qrCodeDataUrl) {
      showToast({
        title: 'Error',
        description: 'QR code not available. Please wait for it to load.',
        variant: 'error',
      });
      return;
    }

    try {
      // Create a canvas with the QR code and pass details
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create canvas context');
      }

      // Set canvas size (A4 ratio for printable format)
      canvas.width = 1200;
      canvas.height = 1600;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Gate Pass', canvas.width / 2, 80);

      // Pass Number
      ctx.font = 'bold 36px Arial';
      ctx.fillText(pass.pass_number, canvas.width / 2, 140);

      // Load QR code image
      const qrImage = new Image();
      qrImage.src = qrCodeDataUrl;
      
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
      });

      // Draw QR code (centered, 600x600)
      const qrSize = 600;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 200;
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      // Pass details
      let yPos = qrY + qrSize + 60;
      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#475569';

      if (isVisitorPass(pass) && pass.visitor_name) {
        ctx.fillText(`Visitor: ${pass.visitor_name}`, 100, yPos);
        yPos += 40;
      }

      if (pass.vehicle) {
        ctx.fillText(`Vehicle: ${pass.vehicle.registration_number}`, 100, yPos);
        yPos += 40;
      }

      ctx.fillText(`Purpose: ${pass.purpose.replace('_', ' ')}`, 100, yPos);
      yPos += 40;
      ctx.fillText(`Valid From: ${formatDateTime(pass.valid_from)}`, 100, yPos);
      yPos += 40;
      ctx.fillText(`Valid To: ${formatDateTime(pass.valid_to)}`, 100, yPos);
      yPos += 40;

      // Access Code
      ctx.font = 'bold 32px monospace';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.fillText(`Access Code: ${pass.access_code}`, canvas.width / 2, yPos + 40);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create PNG blob');
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gate-pass-${pass.pass_number}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast({
          title: 'Success',
          description: 'Gate pass PNG downloaded successfully',
          variant: 'success',
        });
      }, 'image/png');
    } catch (error) {
      console.error('[GatePassDetails] PNG download failed:', error);
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to download PNG. Please try again.',
        variant: 'error',
      });
    }
  };

  // Calculate time inside
  const getTimeInside = (): string | null => {
    if (!pass || pass.status !== 'inside' || !pass.entry_time) {
      return null;
    }
    
    const entryTime = new Date(pass.entry_time);
    const now = new Date();
    const diffMs = now.getTime() - entryTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

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

  const handleApprove = async () => {
    if (!pass || !id) return;

    try {
      setIsApproving(true);
      await apiClient.post(`/gate-pass-approval/approve/${id}`, {
        notes: approvalNotes || 'Approved'
      });

      showToast({
        title: 'Success',
        description: 'Pass approved successfully',
        variant: 'success',
      });

      setShowApprovalPanel(false);
      setApprovalNotes('');
      refetch();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to approve pass',
        variant: 'error',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!pass || !id) return;

    if (!rejectionReason.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please provide a rejection reason',
        variant: 'error',
      });
      return;
    }

    try {
      setIsApproving(true);
      await apiClient.post(`/gate-pass-approval/reject/${id}`, {
        reason: rejectionReason
      });

      showToast({
        title: 'Pass Rejected',
        description: 'Pass has been rejected',
        variant: 'success',
      });

      setShowApprovalPanel(false);
      setRejectionReason('');
      refetch();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error?.message || 'Failed to reject pass',
        variant: 'error',
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Get status theme color
  const getStatusTheme = (): string => {
    if (!pass) return colors.neutral[500];
    
    if (pass.status === 'active' || pass.status === 'pending') {
      return colors.primary;
    }
    if (pass.status === 'inside') {
      return colors.success[500] as string;
    }
    if (pass.status === 'completed') {
      return colors.neutral[500] as string;
    }
    if (pass.status === 'expired' || pass.status === 'cancelled' || pass.status === 'rejected') {
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
        subtitle={getPassDisplayName(pass)}
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
      <div style={{
        ...cardStyles.base,
        padding: spacing.xl,
        marginTop: spacing.lg,
        textAlign: 'center',
        borderTop: `4px solid ${statusTheme}`,
      }}>
        <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
          QR Code
        </h2>
        
        {qrLoading ? (
          <div style={{ padding: spacing.xl }}>
            <div style={{ fontSize: '2rem', marginBottom: spacing.md }}>⏳</div>
            <div style={{ color: colors.neutral[600] }}>Generating QR code...</div>
          </div>
        ) : qrCodeDataUrl ? (
          <div>
            <div
              onClick={() => setShowQrModal(true)}
              style={{
                display: 'inline-block',
                cursor: 'pointer',
                padding: spacing.md,
                backgroundColor: 'white',
                borderRadius: borderRadius.md,
                border: `2px solid ${colors.neutral[200]}`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = statusTheme;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = colors.neutral[200];
              }}
            >
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                style={{
                  width: '200px',
                  height: '200px',
                  display: 'block',
                }}
              />
              <div style={{
                marginTop: spacing.sm,
                fontSize: '0.75rem',
                color: colors.neutral[600],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
              }}>
                <Maximize2 size={12} />
                Tap to enlarge
              </div>
            </div>
            
            <div style={{
              marginTop: spacing.md,
              padding: spacing.md,
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.md,
              display: 'inline-block',
            }}>
              <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.xs }}>
                Access Code
              </div>
              <div style={{ ...typography.subheader, fontFamily: 'monospace', letterSpacing: '2px' }}>
                {pass.access_code}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: spacing.xl, color: colors.neutral[600] }}>
            QR code not available
          </div>
        )}
      </div>

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
      <div style={{
        ...cardStyles.base,
        padding: spacing.xl,
        marginTop: spacing.lg,
        borderTop: `4px solid ${statusTheme}`,
      }}>
        <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
          Pass Details
        </h2>

        <div style={{ display: 'grid', gap: spacing.lg }}>
          {/* Visitor Details */}
          {isVisitorPass(pass) && (
            <>
              <div>
                <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                  Visitor Name
                </div>
                <div style={{ ...typography.body, fontWeight: 600 }}>
                  {pass.visitor_name || 'N/A'}
                </div>
              </div>
              
              {pass.visitor_phone && (
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Phone
                  </div>
                  <div style={{ ...typography.body }}>
                    {pass.visitor_phone}
                  </div>
                </div>
              )}
              
              {pass.visitor_company && (
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Company
                  </div>
                  <div style={{ ...typography.body }}>
                    {pass.visitor_company}
                  </div>
                </div>
              )}
              
              {pass.referred_by && (
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Referred By
                  </div>
                  <div style={{ ...typography.body }}>
                    {pass.referred_by}
                  </div>
                </div>
              )}
              
              {pass.additional_visitors && (
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Additional Visitors
                  </div>
                  <div style={{ ...typography.body }}>
                    {pass.additional_visitors}
                    {pass.additional_head_count && pass.additional_head_count > 0 && (
                      <span style={{ color: colors.neutral[600], marginLeft: spacing.xs }}>
                        ({pass.additional_head_count} {pass.additional_head_count === 1 ? 'person' : 'people'})
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {pass.vehicles_to_view && pass.vehicles_to_view.length > 0 && (
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Vehicles to View
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                    {pass.vehicles_to_view.map((vehicleId, idx) => (
                      <Badge key={idx} variant="neutral" size="sm">
                        {vehicleId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Vehicle Details */}
          {!isVisitorPass(pass) && (
            <>
              {pass.vehicle && (
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Vehicle
                  </div>
                  <div style={{ ...typography.body, fontWeight: 600 }}>
                    {pass.vehicle.registration_number}
                  </div>
                  <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
                    {pass.vehicle.make} {pass.vehicle.model} {pass.vehicle.year && `(${pass.vehicle.year})`}
                  </div>
                </div>
              )}
              
              {isOutboundVehicle(pass) && (
                <>
                  {pass.driver_name && (
                    <div>
                      <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                        Driver Name
                      </div>
                      <div style={{ ...typography.body }}>
                        {pass.driver_name}
                      </div>
                    </div>
                  )}
                  
                  {pass.driver_contact && (
                    <div>
                      <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                        Driver Contact
                      </div>
                      <div style={{ ...typography.body }}>
                        {pass.driver_contact}
                      </div>
                    </div>
                  )}
                  
                  {pass.destination && (
                    <div>
                      <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                        Destination
                      </div>
                      <div style={{ ...typography.body }}>
                        {pass.destination}
                      </div>
                    </div>
                  )}
                  
                  {pass.expected_return_date && (
                    <div>
                      <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                        Expected Return
                      </div>
                      <div style={{ ...typography.body }}>
                        {formatDateTime(pass.expected_return_date)}
                        {pass.expected_return_time && ` at ${pass.expected_return_time}`}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Common Details */}
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Purpose
            </div>
            <div style={{ ...typography.body, textTransform: 'capitalize' }}>
              {pass.purpose.replace('_', ' ')}
            </div>
          </div>

          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Valid From
            </div>
            <div style={{ ...typography.body }}>
              {formatDateTime(pass.valid_from)}
            </div>
          </div>

          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Valid To
            </div>
            <div style={{ ...typography.body }}>
              {formatDateTime(pass.valid_to)}
            </div>
          </div>

          {pass.entry_time && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                Entry Time
              </div>
              <div style={{ ...typography.body, color: colors.success[500] }}>
                {formatDateTime(pass.entry_time)}
                {timeInside && (
                  <span style={{ marginLeft: spacing.sm, color: colors.neutral[600] }}>
                    ({timeInside} ago)
                  </span>
                )}
              </div>
            </div>
          )}

          {pass.exit_time && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                Exit Time
              </div>
              <div style={{ ...typography.body, color: colors.neutral[700] }}>
                {formatDateTime(pass.exit_time)}
              </div>
            </div>
          )}

          {pass.creator && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                Created By
              </div>
              <div style={{ ...typography.body }}>
                {pass.creator.name}
              </div>
            </div>
          )}

          {pass.yard && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                Yard
              </div>
              <div style={{ ...typography.body }}>
                {pass.yard.name}
              </div>
            </div>
          )}

          {pass.notes && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                Notes
              </div>
              <div style={{ ...typography.body, whiteSpace: 'pre-wrap' }}>
                {pass.notes}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      {pass.validations && pass.validations.length > 0 && (
        <div style={{
          ...cardStyles.base,
          padding: spacing.xl,
          marginTop: spacing.lg,
        }}>
          <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
            Timeline & History
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {pass.validations.map((validation) => (
              <div
                key={validation.id}
                style={{
                  display: 'flex',
                  gap: spacing.md,
                  padding: spacing.md,
                  borderLeft: `3px solid ${
                    validation.action === 'entry' ? colors.success[500] :
                    validation.action === 'exit' ? colors.brand :
                    colors.neutral[300]
                  }`,
                  backgroundColor: colors.neutral[50],
                  borderRadius: borderRadius.md,
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  {validation.action === 'entry' ? (
                    <CheckCircle size={20} color={colors.success[500]} />
                  ) : validation.action === 'exit' ? (
                    <XCircle size={20} color={colors.brand} />
                  ) : (
                    <Clock size={20} color={colors.neutral[500]} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                    {validation.action === 'entry' ? 'Entry Recorded' :
                     validation.action === 'exit' ? 'Exit Recorded' :
                     'Validation'}
                  </div>
                  <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    {formatDateTime(validation.created_at)}
                  </div>
                  {validation.validator && (
                    <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                      By: {validation.validator.name}
                    </div>
                  )}
                  {validation.notes && (
                    <div style={{
                      marginTop: spacing.xs,
                      padding: spacing.xs,
                      backgroundColor: 'white',
                      borderRadius: borderRadius.sm,
                      ...typography.bodySmall,
                    }}>
                      {validation.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div style={{
        ...cardStyles.base,
        padding: spacing.xl,
        marginTop: spacing.lg,
      }}>
        <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
          Actions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {/* Download Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: spacing.md,
            marginBottom: spacing.md,
            paddingBottom: spacing.md,
            borderBottom: `1px solid ${colors.neutral[200]}`,
          }}>
            <Button
              variant="primary"
              onClick={handleDownloadPDF}
              disabled={isDownloading || !pass}
              icon={<Download size={20} />}
              size="lg"
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownloadPNG}
              disabled={!qrCodeDataUrl || !pass}
              icon={<Download size={20} />}
              size="lg"
            >
              Download PNG
            </Button>
          </div>

          {/* Inline Approval Panel */}
          {permissions.canApprovePasses && pass.status === 'pending_approval' && (
            <div style={{
              padding: spacing.lg,
              backgroundColor: colors.warning[50],
              border: `2px solid ${colors.warning[200]}`,
              borderRadius: borderRadius.md,
              marginBottom: spacing.md,
            }}>
              <h3 style={{
                ...typography.subheader,
                color: colors.warning[700],
                marginBottom: spacing.md,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}>
                ⚠️ Approval Required
              </h3>

              {!showApprovalPanel ? (
                <div style={{ display: 'flex', gap: spacing.sm }}>
                  <Button
                    variant="primary"
                    onClick={() => setShowApprovalPanel(true)}
                    size="lg"
                    style={{ flex: 1 }}
                  >
                    Review & Approve
                  </Button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: spacing.md }}>
                    <label style={{
                      ...typography.label,
                      display: 'block',
                      marginBottom: spacing.xs,
                      color: colors.neutral[700],
                    }}>
                      Approval Notes (Optional)
                    </label>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add any notes or comments..."
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: spacing.sm,
                        border: `1px solid ${colors.neutral[300]}`,
                        borderRadius: borderRadius.sm,
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: spacing.md }}>
                    <label style={{
                      ...typography.label,
                      display: 'block',
                      marginBottom: spacing.xs,
                      color: colors.error[700],
                    }}>
                      Rejection Reason (Required if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: spacing.sm,
                        border: `1px solid ${colors.neutral[300]}`,
                        borderRadius: borderRadius.sm,
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: spacing.sm }}>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowApprovalPanel(false);
                        setApprovalNotes('');
                        setRejectionReason('');
                      }}
                      disabled={isApproving}
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleReject}
                      disabled={isApproving || !rejectionReason.trim()}
                      style={{ flex: 1, backgroundColor: colors.error[500], color: 'white' }}
                    >
                      {isApproving ? 'Processing...' : 'Reject'}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleApprove}
                      disabled={isApproving}
                      style={{ flex: 1 }}
                    >
                      {isApproving ? 'Processing...' : 'Approve'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Record Entry */}
          {(pass.status === 'active' || pass.status === 'pending') && !isExpired(pass) && (
            <Button
              variant="primary"
              onClick={handleRecordEntry}
              disabled={recordEntry.isPending}
              icon={<CheckCircle size={20} />}
              size="lg"
            >
              {recordEntry.isPending ? 'Recording...' : 'Record Entry'}
            </Button>
          )}

          {/* Record Exit */}
          {pass.status === 'inside' && (
            <Button
              variant="primary"
              onClick={handleRecordExit}
              disabled={recordExit.isPending}
              icon={<XCircle size={20} />}
              size="lg"
            >
              {recordExit.isPending ? 'Recording...' : 'Record Exit'}
            </Button>
          )}

          {/* Cancel Pass */}
          {(pass.status === 'pending' || pass.status === 'active') && (
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={cancelPass.isPending}
              icon={<X size={20} />}
              size="lg"
            >
              {cancelPass.isPending ? 'Cancelling...' : 'Cancel Pass'}
            </Button>
          )}

          {/* No Actions Available */}
          {pass.status !== 'active' && pass.status !== 'pending' && pass.status !== 'inside' && (
            <div style={{
              padding: spacing.md,
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.md,
              textAlign: 'center',
              color: colors.neutral[600],
            }}>
              No actions available for this pass status
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && qrCodeDataUrl && (
        <div
          onClick={() => setShowQrModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            cursor: 'pointer',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: spacing.xl,
              borderRadius: borderRadius.xl,
              textAlign: 'center',
              maxWidth: '90%',
            }}
          >
            <img
              src={qrCodeDataUrl}
              alt="QR Code"
              style={{
                width: '300px',
                height: '300px',
                maxWidth: '100%',
              }}
            />
            <div style={{ marginTop: spacing.md, ...typography.body, fontWeight: 600 }}>
              Pass #{pass.pass_number}
            </div>
            <div style={{ marginTop: spacing.xs, ...typography.bodySmall, color: colors.neutral[600], fontFamily: 'monospace', letterSpacing: '2px' }}>
              {pass.access_code}
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowQrModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
