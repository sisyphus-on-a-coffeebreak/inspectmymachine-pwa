import React from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import type { InspectionTemplate } from '@/types/inspection';
import type { SubmissionProgress } from '@/lib/inspection-submit';

interface InspectionCaptureStatusBarProps {
  template: InspectionTemplate;
  templateSource?: 'network' | 'cache' | null;
  templateCachedAt?: number | null;
  queuedCount: number;
  draftSavedAt: number | null;
  progress: SubmissionProgress | null;
  templateWarning: string | null;
  submissionBanner: string | null;
}

export const InspectionCaptureStatusBar: React.FC<InspectionCaptureStatusBarProps> = ({
  template,
  templateSource,
  templateCachedAt,
  queuedCount,
  draftSavedAt,
  progress,
  templateWarning,
  submissionBanner,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      {template.description && (
        <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
          {template.description}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md }}>
        {templateSource && (
          <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
            Source: {templateSource}
            {templateCachedAt && templateSource === 'cache' && ` · cached ${new Date(templateCachedAt).toLocaleString()}`}
          </span>
        )}
        {queuedCount > 0 && (
          <span style={{ ...typography.bodySmall, color: colors.status.warning }}>
            {queuedCount} inspection{queuedCount === 1 ? '' : 's'} waiting to sync
          </span>
        )}
        {draftSavedAt && (
          <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
            Draft saved {new Date(draftSavedAt).toLocaleTimeString()}
          </span>
        )}
        {progress && progress.phase === 'uploading' && (
          <span style={{ ...typography.bodySmall, color: colors.primary }}>
            Uploading… {progress.percent ? `${progress.percent}%` : ''}
          </span>
        )}
      </div>

      {templateWarning && (
        <div style={{
          backgroundColor: colors.status.warning + '20',
          border: `1px solid ${colors.status.warning}`,
          borderRadius: '8px',
          padding: spacing.sm,
          color: colors.status.warning,
          ...typography.bodySmall,
        }}>
          ⚠️ {templateWarning}
        </div>
      )}

      {submissionBanner && (
        <div style={{
          backgroundColor: colors.neutral[100],
          borderRadius: '8px',
          padding: spacing.sm,
          color: colors.neutral[700],
          ...typography.bodySmall,
        }}>
          {submissionBanner}
        </div>
      )}
    </div>
  );
};



