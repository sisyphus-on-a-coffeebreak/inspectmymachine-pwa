/**
 * Actions Section Component
 * Displays action buttons for gate pass operations
 */

import React from 'react';
import { X, CheckCircle, XCircle, Download } from 'lucide-react';
import { colors, typography, spacing, borderRadius, cardStyles } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { ApprovalPanel } from './ApprovalPanel';
import { isExpired } from '../../gatePassTypes';
import type { GatePass } from '../../gatePassTypes';
import { GATE_PASS_STATUS } from '../../constants';

interface ActionsSectionProps {
  pass: GatePass;
  permissions: {
    canApprovePasses: boolean;
  };
  isDownloading: boolean;
  qrCodeDataUrl: string | null;
  recordEntry: {
    isPending: boolean;
  };
  recordExit: {
    isPending: boolean;
  };
  cancelPass: {
    isPending: boolean;
  };
  onDownloadPDF: () => void;
  onDownloadPNG: () => void;
  onRecordEntry: () => void;
  onRecordExit: () => void;
  onCancel: () => void;
  onApprovalSuccess?: () => void;
}

export const ActionsSection: React.FC<ActionsSectionProps> = ({
  pass,
  permissions,
  isDownloading,
  qrCodeDataUrl,
  recordEntry,
  recordExit,
  cancelPass,
  onDownloadPDF,
  onDownloadPNG,
  onRecordEntry,
  onRecordExit,
  onCancel,
  onApprovalSuccess,
}) => {
  return (
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
            onClick={onDownloadPDF}
            disabled={isDownloading || !pass}
            icon={<Download size={20} />}
            size="lg"
          >
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button
            variant="secondary"
            onClick={onDownloadPNG}
            disabled={!qrCodeDataUrl || !pass}
            icon={<Download size={20} />}
            size="lg"
          >
            Download PNG
          </Button>
        </div>

        {/* Approval Panel */}
        {permissions.canApprovePasses && pass.status === GATE_PASS_STATUS.PENDING && (
          <ApprovalPanel passId={pass.id} onSuccess={onApprovalSuccess || (() => {})} />
        )}

        {/* Record Entry */}
        {(pass.status === GATE_PASS_STATUS.ACTIVE || pass.status === GATE_PASS_STATUS.PENDING) && !isExpired(pass) && (
          <Button
            variant="primary"
            onClick={onRecordEntry}
            disabled={recordEntry.isPending}
            icon={<CheckCircle size={20} />}
            size="lg"
          >
            {recordEntry.isPending ? 'Recording...' : 'Record Entry'}
          </Button>
        )}

        {/* Record Exit */}
        {pass.status === GATE_PASS_STATUS.INSIDE && (
          <Button
            variant="primary"
            onClick={onRecordExit}
            disabled={recordExit.isPending}
            icon={<XCircle size={20} />}
            size="lg"
          >
            {recordExit.isPending ? 'Recording...' : 'Record Exit'}
          </Button>
        )}

        {/* Cancel Pass */}
        {(pass.status === GATE_PASS_STATUS.PENDING || pass.status === GATE_PASS_STATUS.ACTIVE) && (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={cancelPass.isPending}
            icon={<X size={20} />}
            size="lg"
          >
            {cancelPass.isPending ? 'Cancelling...' : 'Cancel Pass'}
          </Button>
        )}

        {/* No Actions Available */}
        {pass.status !== GATE_PASS_STATUS.ACTIVE && pass.status !== GATE_PASS_STATUS.PENDING && pass.status !== GATE_PASS_STATUS.INSIDE && (
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
  );
};

