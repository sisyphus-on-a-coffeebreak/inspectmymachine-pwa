import React, { useState, useEffect, useCallback } from 'react';
import PDFPass from './PDFPass';
import { generatePDFPass, generateQRCode, formatPassNumber, sharePass } from '../../lib/pdf-generator-simple';
import { Button } from './button';
import { colors, spacing, typography } from '../../lib/theme';
import { syncGatePassRecord } from '../../lib/gate-pass-records';
import type { GatePassRecord } from '../../lib/gate-pass-records';
import { useToast } from '../../providers/ToastProvider';

interface PassDisplayProps {
  passData: {
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
  };
  onClose?: () => void;
  showActions?: boolean;
}

export const PassDisplay: React.FC<PassDisplayProps> = ({
  passData,
  onClose,
  showActions = true
}) => {
  const { showToast } = useToast();
  const [passRecord, setPassRecord] = useState<GatePassRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState<boolean>(true);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const buildMetadata = () => ({
    passNumber: formatPassNumber(passData.passType, passData.id),
    passType: passData.passType,
    visitorName: passData.visitorName,
    vehicleDetails: passData.vehicleDetails,
    purpose: passData.purpose,
    entryTime: passData.entryTime,
    expectedReturn: passData.expectedReturn,
    companyName: passData.companyName,
    companyLogo: passData.companyLogo,
  });

  const ensureQrCode = useCallback(async (): Promise<string> => {
    if (!passRecord) {
      throw new Error('Cannot generate QR code: Pass record not available');
    }

    // Use pre-generated QR code if available
    if (passRecord.qrCode && passRecord.qrCode.trim() !== '') {
      return passRecord.qrCode;
    }

    // MUST use qrPayload from backend - no fallback to accessCode
    if (!passRecord.qrPayload || passRecord.qrPayload.trim() === '') {
      throw new Error('Cannot generate QR code: Backend did not provide verifiable QR payload. Pass must be synced with backend first.');
    }

    try {
      const generated = await generateQRCode(passRecord.qrPayload);
      setPassRecord(prev => prev ? { ...prev, qrCode: generated } : prev);
      return generated;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate QR code';
      throw new Error(`QR code generation failed: ${errorMessage}`);
    }
  }, [passRecord]);

  useEffect(() => {
    let cancelled = false;

    const prepareRecord = async () => {
      setLoadingRecord(true);
      setRecordError(null);

      const metadata = buildMetadata();

      try {
        // Sync with backend - backend MUST provide qrPayload
        const record = await syncGatePassRecord({
          passId: passData.id,
          passType: passData.passType,
          metadata,
        });

        // Generate QR code from backend's verifiable qrPayload
        let qrCode = record.qrCode;
        if (!qrCode) {
          if (!record.qrPayload || record.qrPayload.trim() === '') {
            throw new Error('Backend did not provide verifiable QR payload');
          }
          try {
            qrCode = await generateQRCode(record.qrPayload);
          } catch (qrError) {
            const errorMessage = qrError instanceof Error ? qrError.message : 'Unknown error';
            throw new Error(`Failed to generate QR code from backend payload: ${errorMessage}`);
          }
        }

        if (!cancelled) {
          setPassRecord({
            ...record,
            qrCode,
            passNumber: record.passNumber || metadata.passNumber,
            metadata: { ...metadata, ...(record.metadata || {}) },
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (!cancelled) {
          setRecordError(
            `Unable to generate verifiable QR code: ${errorMessage}. ` +
            `Please ensure the backend API /api/gate-pass-records/sync is working and returns qr_payload.`
          );
          // Don't create a record without verifiable QR code
          setPassRecord(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingRecord(false);
        }
      }
    };

    prepareRecord();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passData.id, passData.passType]);

  const handleDownloadPDF = async () => {
    if (!passRecord) {
      showToast({
        title: 'Loading',
        description: 'Pass record is still loading. Please wait a moment.',
        variant: 'warning',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const qrCode = await ensureQrCode();
      const passNumber = passRecord.passNumber || formatPassNumber(passData.passType, passData.id);
      const pdfBlob = await generatePDFPass({
        passNumber,
        passType: passData.passType,
        visitorName: passData.visitorName,
        vehicleDetails: passData.vehicleDetails,
        purpose: passData.purpose,
        entryTime: passData.entryTime,
        expectedReturn: passData.expectedReturn,
        accessCode: passRecord.accessCode,
        qrCode,
        companyName: passData.companyName,
        companyLogo: passData.companyLogo
      });

      // Download the PDF immediately
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
        description: 'Failed to generate PDF. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };


  const handleShare = async () => {
    try {
      if (!passRecord) {
        showToast({
          title: 'Loading',
          description: 'Pass record is still loading. Please wait a moment.',
          variant: 'warning',
        });
        return;
      }

      const qrCode = await ensureQrCode();
      const formattedPassNumber = passRecord.passNumber || formatPassNumber(passData.passType, passData.id);

      await sharePass({
        passNumber: formattedPassNumber,
        passType: passData.passType,
        visitorName: passData.visitorName,
        vehicleDetails: passData.vehicleDetails,
        purpose: passData.purpose,
        entryTime: passData.entryTime,
        expectedReturn: passData.expectedReturn,
        accessCode: passRecord.accessCode,
        qrCode,
        companyName: passData.companyName,
        companyLogo: passData.companyLogo
      }, {
        onSuccess: () => {
          showToast({
            title: 'Success',
            description: 'Pass shared successfully!',
            variant: 'success',
          });
        },
        onError: () => {
          showToast({
            title: 'Error',
            description: 'Failed to share pass',
            variant: 'error',
          });
        }
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to share. Please try again.',
        variant: 'error',
      });
    }
  };

  const containerStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: spacing.xl,
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative' as const
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottom: `1px solid ${colors.neutral[200]}`
  };

  const titleStyle = {
    ...typography.header,
    fontSize: '24px',
    color: colors.neutral[900],
    margin: 0
  };

  const closeButtonStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: colors.neutral[100],
    border: 'none',
    color: colors.neutral[600],
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  };

  const actionsStyle = {
    display: 'flex',
    gap: spacing.md,
    marginTop: spacing.lg,
    flexWrap: 'wrap' as const
  };

  const passContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    margin: `${spacing.lg} 0`
  };

  return (
    <div style={containerStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            {passData.passType === 'visitor' ? 'Visitor' : 'Vehicle'} Gate Pass
          </h2>
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.neutral[200];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.neutral[100];
            }}
          >
            ✕
          </button>
        </div>

        {loadingRecord && (
          <div style={{
            ...typography.bodySmall,
            backgroundColor: colors.neutral[100],
            borderRadius: '8px',
            padding: spacing.sm,
            marginBottom: spacing.md,
            color: colors.neutral[600],
          }}>
            Preparing pass details...
          </div>
        )}

        {recordError && (
          <div style={{
            ...typography.bodySmall,
            backgroundColor: colors.status.warning + '20',
            borderRadius: '8px',
            padding: spacing.sm,
            marginBottom: spacing.md,
            color: colors.status.warning,
          }}>
            {recordError}
          </div>
        )}

        {passRecord?.id && (
          <div style={{
            ...typography.bodySmall,
            color: colors.neutral[500],
            marginBottom: spacing.sm,
            textAlign: 'center' as const,
          }}>
            Record ID: <strong>{passRecord.id}</strong>
          </div>
        )}

        <div style={passContainerStyle}>
          <div id="pdf-pass-container">
            <PDFPass
              passNumber={passRecord?.passNumber || formatPassNumber(passData.passType, passData.id)}
              passType={passData.passType}
              visitorName={passData.visitorName}
              vehicleDetails={passData.vehicleDetails}
              purpose={passData.purpose}
              entryTime={passData.entryTime}
              expectedReturn={passData.expectedReturn}
              accessCode={passRecord?.accessCode || ''}
              qrCode={passRecord?.qrCode || ''}
              companyName={passData.companyName}
              companyLogo={passData.companyLogo}
            />
          </div>
        </div>

        {showActions && (
          <div style={actionsStyle}>
            <Button
              variant="primary"
              onClick={handleDownloadPDF}
              loading={isGenerating}
              disabled={loadingRecord || !passRecord}
              icon="📄"
              fullWidth
            >
              Download PDF
            </Button>

            <Button
              variant="success"
              onClick={handleShare}
              disabled={loadingRecord || !passRecord}
              icon="📤"
              fullWidth
            >
              Share Pass
            </Button>
          </div>
        )}

        <div style={{
          ...typography.bodySmall,
          color: colors.neutral[500],
          textAlign: 'center' as const,
          marginTop: spacing.md,
          padding: spacing.md,
          backgroundColor: colors.neutral[50],
          borderRadius: '8px'
        }}>
          💡 <strong>Access Code:</strong> {passRecord?.accessCode || '…'} |
          Show this pass at the gate or scan the QR code
        </div>
      </div>
    </div>
  );
};

export default PassDisplay;
