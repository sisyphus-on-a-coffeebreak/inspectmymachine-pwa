import React from 'react';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import type { ReportBranding } from '../../lib/report-branding';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { ExternalLink } from 'lucide-react';

export interface ReportPreviewProps {
  branding: ReportBranding;
  onFullSize?: () => void;
  compact?: boolean;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  branding,
  onFullSize,
  compact = false,
}) => {
  const previewContent = (
    <div
      style={{
        border: `1px solid ${colors.neutral[300]}`,
        borderRadius: borderRadius.md,
        backgroundColor: 'white',
        padding: compact ? spacing.md : spacing.lg,
        transform: compact ? 'scale(0.7)' : 'scale(1)',
        transformOrigin: 'top left',
        width: compact ? '142%' : '100%',
        minHeight: compact ? '400px' : '500px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: spacing.lg,
          paddingBottom: spacing.md,
          borderBottom: `2px solid ${branding.primaryColor || colors.primary}`,
        }}
      >
        {/* Logo */}
        {branding.showLogoInHeader && branding.logoUrl && (
          <div style={{ flex: '0 0 auto' }}>
            <img
              src={branding.logoUrl}
              alt="Company logo"
              style={{
                maxWidth: '150px',
                maxHeight: '50px',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Company Info */}
        <div style={{ flex: '1', textAlign: 'right', marginLeft: spacing.md }}>
          <h2
            style={{
              ...typography.heading,
              fontSize: compact ? '18px' : '24px',
              color: branding.primaryColor || colors.primary,
              margin: 0,
              marginBottom: spacing.xs,
            }}
          >
            {branding.companyName}
          </h2>
          {branding.tradingAs && (
            <p
              style={{
                ...typography.body,
                fontSize: compact ? '12px' : '14px',
                color: colors.neutral[600],
                margin: 0,
                marginBottom: spacing.xs,
              }}
            >
              {branding.tradingAs}
            </p>
          )}
          {branding.showAddressInHeader && (
            <div
              style={{
                ...typography.caption,
                fontSize: compact ? '10px' : '12px',
                color: colors.neutral[600],
              }}
            >
              {branding.addressLine1 && <div>{branding.addressLine1}</div>}
              {branding.addressLine2 && <div>{branding.addressLine2}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Report Title */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <h3
          style={{
            ...typography.subheader,
            fontSize: compact ? '16px' : '20px',
            color: colors.neutral[900],
            margin: 0,
            marginBottom: spacing.xs,
          }}
        >
          Vehicle Inspection Report (VIR)
        </h3>
        <p
          style={{
            ...typography.caption,
            fontSize: compact ? '10px' : '12px',
            color: colors.neutral[500],
          }}
        >
          Report ID: VIR-12345678
        </p>
      </div>

      {/* Sample Content */}
      <div
        style={{
          backgroundColor: colors.neutral[50],
          padding: spacing.md,
          borderRadius: borderRadius.md,
          marginBottom: spacing.md,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: spacing.sm,
            ...typography.body,
            fontSize: compact ? '11px' : '12px',
          }}
        >
          <div>
            <strong>Vehicle:</strong> Sample Vehicle
          </div>
          <div>
            <strong>Registration:</strong> ABC-1234
          </div>
          <div>
            <strong>Inspector:</strong> John Doe
          </div>
          <div>
            <strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}
          </div>
        </div>
      </div>

      {/* Sample Section */}
      <div style={{ marginBottom: spacing.md }}>
        <div
          style={{
            ...typography.subheader,
            fontSize: compact ? '14px' : '16px',
            padding: spacing.sm,
            backgroundColor: colors.neutral[100],
            borderLeft: `4px solid ${branding.secondaryColor || colors.primary}`,
            marginBottom: spacing.sm,
          }}
        >
          Sample Section
        </div>
        <div
          style={{
            padding: spacing.sm,
            backgroundColor: 'white',
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: borderRadius.sm,
            ...typography.body,
            fontSize: compact ? '11px' : '12px',
          }}
        >
          Sample question and answer content...
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: spacing.xl,
          paddingTop: spacing.md,
          borderTop: `1px solid ${colors.neutral[200]}`,
          textAlign: 'center',
          ...typography.caption,
          fontSize: compact ? '9px' : '10px',
          color: colors.neutral[600],
        }}
      >
        {branding.footerText && <div style={{ marginBottom: spacing.xs }}>{branding.footerText}</div>}
        {branding.showContactInFooter && (
          <div>
            {branding.phone && <span>Phone: {branding.phone}</span>}
            {branding.phone && branding.email && <span> | </span>}
            {branding.email && <span>Email: {branding.email}</span>}
            {branding.website && (
              <>
                {(branding.phone || branding.email) && <span> | </span>}
                <span>Website: {branding.website}</span>
              </>
            )}
          </div>
        )}
        <div style={{ marginTop: spacing.xs }}>
          Generated on {new Date().toLocaleString('en-IN')} | {branding.companyName}
        </div>
        {branding.includeQRCode && (
          <div
            style={{
              marginTop: spacing.sm,
              padding: spacing.sm,
              backgroundColor: colors.neutral[100],
              borderRadius: borderRadius.sm,
              display: 'inline-block',
            }}
          >
            [QR Code Placeholder]
          </div>
        )}
      </div>
    </div>
  );

  if (compact) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {previewContent}
        {onFullSize && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onFullSize}
            style={{
              position: 'absolute',
              bottom: spacing.sm,
              right: spacing.sm,
            }}
          >
            <ExternalLink size={16} style={{ marginRight: spacing.xs }} />
            Full Size
          </Button>
        )}
      </div>
    );
  }

  return previewContent;
};





