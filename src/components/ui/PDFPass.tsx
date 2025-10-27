import React from 'react';
import { colors, spacing, borderRadius } from '../../lib/theme';

export interface PDFPassProps {
  passNumber: string;
  passType: 'visitor' | 'vehicle';
  visitorName?: string;
  vehicleDetails?: {
    registration: string;
    make: string;
    model: string;
  };
  purpose: string;
  entryTime: string; // For visitors: scheduled date, for vehicles: departure/entry time
  expectedReturn?: string;
  accessCode: string;
  qrCode?: string;
  companyName?: string;
  companyLogo?: string;
  className?: string;
}

const PDFPass: React.FC<PDFPassProps> = ({
  passNumber,
  passType,
  visitorName,
  vehicleDetails,
  purpose,
  entryTime,
  expectedReturn,
  accessCode,
  qrCode,
  className
}) => {
  const passStyle = {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    lineHeight: 1.5,
    color: colors.neutral[800]
  };

  const headerStyle = {
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.brand} 100%)`,
    color: 'white',
    padding: spacing.xl,
    textAlign: 'center' as const,
    position: 'relative' as const
  };

  const statusIndicatorStyle = {
    position: 'absolute' as const,
    top: spacing.md,
    right: spacing.md,
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: colors.status.normal,
    border: '2px solid white'
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  };

  const logoIconStyle = {
    width: '48px',
    height: '48px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    marginRight: spacing.md
  };

  const logoTextStyle = {
    textAlign: 'center' as const
  };

  const contentStyle = {
    padding: spacing.xl
  };

  const sectionStyle = {
    marginBottom: spacing.xl
  };

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottom: `2px solid ${colors.primary}`
  };

  const fieldStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.sm
  };

  const labelStyle = {
    fontWeight: '600',
    color: colors.neutral[600],
    fontSize: '13px',
    minWidth: '120px'
  };

  const valueStyle = {
    fontWeight: '500',
    color: colors.neutral[800],
    textAlign: 'right' as const,
    flex: 1
  };

  const qrSectionStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg
  };

  const qrCodeStyle = {
    width: '160px',
    height: '160px',
    backgroundColor: 'white',
    border: `3px solid ${colors.primary}`,
    borderRadius: borderRadius.lg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    marginBottom: spacing.md,
    overflow: 'hidden'
  };

  const accessCodeStyle = {
    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.brand} 100%)`,
    color: 'white',
    textAlign: 'center' as const,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    marginBottom: spacing.lg
  };

  const footerStyle = {
    backgroundColor: colors.neutral[100],
    padding: spacing.lg,
    textAlign: 'center' as const,
    borderTop: `1px solid ${colors.neutral[200]}`,
    fontSize: '14px',
    fontWeight: 500,
    color: colors.neutral[600]
  };

  return (
    <div style={passStyle} className={className}>
      {/* Status Indicator */}
      <div style={statusIndicatorStyle} />
      
      {/* Header Section */}
      <div style={headerStyle}>
        <div style={logoStyle}>
          <div style={logoIconStyle}>🏢</div>
          <div style={logoTextStyle}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>VOMS</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              {passType === 'visitor' ? 'Visitor Gate Pass' : 'Vehicle Movement Pass'}
            </div>
          </div>
        </div>
        
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          opacity: 0.9
        }}>
          #{passNumber}
        </div>
      </div>

      {/* Main Content */}
      <div style={contentStyle}>
        {/* Visitor Information */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>👤 Visitor Information</div>
          
          <div style={fieldStyle}>
            <span style={labelStyle}>Name:</span>
            <span style={valueStyle}>{visitorName}</span>
          </div>
          
          <div style={fieldStyle}>
            <span style={labelStyle}>Purpose:</span>
            <span style={{
              ...valueStyle,
              color: colors.primary,
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>{purpose}</span>
          </div>
          
          <div style={fieldStyle}>
            <span style={labelStyle}>
              {passType === 'visitor' ? 'Scheduled Date:' : 'Entry Time:'}
            </span>
            <span style={valueStyle}>
              {(() => {
                try {
                  const date = new Date(entryTime);
                  if (isNaN(date.getTime())) {
                    return passType === 'visitor' ? 'Not scheduled' : 'Not entered yet';
                  }
                  return date.toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                } catch (error) {
                  return passType === 'visitor' ? 'Not scheduled' : 'Not entered yet';
                }
              })()}
            </span>
          </div>
          
          {expectedReturn && (
            <div style={fieldStyle}>
              <span style={labelStyle}>Expected Return:</span>
              <span style={valueStyle}>
                {(() => {
                  try {
                    const date = new Date(expectedReturn);
                    if (isNaN(date.getTime())) {
                      return 'Not specified';
                    }
                    return date.toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    });
                  } catch (error) {
                    return 'Not specified';
                  }
                })()}
              </span>
            </div>
          )}
        </div>

        {/* Vehicle Information */}
        {passType === 'vehicle' && vehicleDetails && (
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>🚗 Vehicle Information</div>
            
            <div style={fieldStyle}>
              <span style={labelStyle}>Registration:</span>
              <span style={{
                ...valueStyle,
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: colors.brand
              }}>{vehicleDetails.registration}</span>
            </div>
            
            <div style={fieldStyle}>
              <span style={labelStyle}>Make & Model:</span>
              <span style={valueStyle}>
                {vehicleDetails.make} {vehicleDetails.model}
              </span>
            </div>
          </div>
        )}

        {/* QR Code Section */}
        <div style={qrSectionStyle}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: colors.neutral[700],
            marginBottom: spacing.md,
            textAlign: 'center'
          }}>
            📱 SCAN QR CODE FOR ENTRY
          </div>
          
          <div style={qrCodeStyle}>
            {qrCode ? (
              <img 
                src={qrCode} 
                alt="QR Code" 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
                onLoad={() => {
                  console.log('✅ QR Code image loaded successfully');
                }}
                onError={(e) => {
                  console.error('❌ QR Code image failed to load');
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
                backgroundColor: colors.neutral[100]
              }}>
                <div style={{ fontSize: '28px', marginBottom: spacing.sm, opacity: 0.6 }}>📱</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: colors.neutral[600] }}>QR Code</div>
                <div style={{ fontSize: '10px', color: colors.neutral[500], marginTop: spacing.xs }}>
                  Generating...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Access Code Badge */}
        <div style={accessCodeStyle}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 'bold', 
            marginBottom: spacing.sm,
            letterSpacing: '1px',
            opacity: 0.9
          }}>
            🔑 ACCESS CODE
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            letterSpacing: '3px',
            fontFamily: 'monospace'
          }}>
            {accessCode}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        🚪 Show this pass at the gate for seamless entry
      </div>
    </div>
  );
};

// Print-optimized version
export const PrintablePDFPass: React.FC<PDFPassProps> = (props) => {
  const printStyle = {
    width: '100%',
    height: '100vh',
    margin: 0,
    padding: 0,
    boxShadow: 'none',
    borderRadius: 0
  };

  return (
    <div style={printStyle}>
      <PDFPass {...props} />
    </div>
  );
};

export default PDFPass;