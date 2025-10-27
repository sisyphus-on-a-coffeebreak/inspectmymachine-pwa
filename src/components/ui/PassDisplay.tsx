import React, { useState, useEffect } from 'react';
import PDFPass from './PDFPass';
import { generatePDFPass, generateQRCode, generateAccessCode, formatPassNumber, sharePass } from '../../lib/pdf-generator-simple';
import { Button } from './button';
import { colors, spacing, typography } from '../../lib/theme';

interface PassDisplayProps {
  passData: {
    id: number;
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
  const [accessCode, setAccessCode] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    console.log('🚀 PassDisplay useEffect triggered');
    const code = generateAccessCode();
    console.log('🔑 Generated access code:', code);
    
    setAccessCode(code);
    
    // Generate QR code asynchronously
    generateQRCode(code).then(qr => {
      console.log('📱 Generated REAL QR code:', qr);
      console.log('📏 QR code length:', qr.length);
      console.log('🔍 QR code preview:', qr.substring(0, 100) + '...');
      setQrCode(qr);
      console.log('✅ QR code state updated');
    }).catch(error => {
      console.error('❌ Failed to generate QR code:', error);
      setQrCode('');
    });
  }, []);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const pdfBlob = await generatePDFPass({
        passNumber: formatPassNumber(passData.passType, passData.id),
        passType: passData.passType,
        visitorName: passData.visitorName,
        vehicleDetails: passData.vehicleDetails,
        purpose: passData.purpose,
        entryTime: passData.entryTime,
        expectedReturn: passData.expectedReturn,
        accessCode,
        qrCode,
        companyName: passData.companyName,
        companyLogo: passData.companyLogo
      });
      
      // Download the PDF immediately
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gate-pass-${formatPassNumber(passData.passType, passData.id)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };


  const handleShare = async () => {
    try {
      console.log('🔍 PassDisplay - passData:', passData);
      console.log('🔍 PassDisplay - passData.id:', passData.id);
      console.log('🔍 PassDisplay - passData.passType:', passData.passType);
      
      const formattedPassNumber = formatPassNumber(passData.passType, passData.id);
      console.log('🔍 PassDisplay - formatted pass number:', formattedPassNumber);
      
      await sharePass({
        passNumber: formattedPassNumber,
        passType: passData.passType,
        visitorName: passData.visitorName,
        vehicleDetails: passData.vehicleDetails,
        purpose: passData.purpose,
        entryTime: passData.entryTime,
        expectedReturn: passData.expectedReturn,
        accessCode,
        qrCode,
        companyName: passData.companyName,
        companyLogo: passData.companyLogo
      });
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share. Please try again.');
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

        <div style={passContainerStyle}>
          <div id="pdf-pass-container">
            <PDFPass
              passNumber={formatPassNumber(passData.passType, passData.id)}
              passType={passData.passType}
              visitorName={passData.visitorName}
              vehicleDetails={passData.vehicleDetails}
              purpose={passData.purpose}
              entryTime={passData.entryTime}
              expectedReturn={passData.expectedReturn}
              accessCode={accessCode}
              qrCode={qrCode}
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
              icon="📄"
              fullWidth
            >
              Download PDF
            </Button>
            
            <Button
              variant="success"
              onClick={handleShare}
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
          💡 <strong>Access Code:</strong> {accessCode} | 
          Show this pass at the gate or scan the QR code
        </div>
      </div>
    </div>
  );
};

export default PassDisplay;
