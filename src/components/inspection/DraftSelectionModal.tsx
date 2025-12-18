/**
 * Draft Selection Modal
 * 
 * Presents user with existing drafts for a template/vehicle
 * Allows explicit choice: continue draft or start new inspection
 */

import React, { useState, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { Button } from '../ui/button';
import { X, Clock, FileText, Upload, CheckCircle } from 'lucide-react';
import type { DraftMetadata } from '../../lib/inspectionDrafts';
import { useMobileViewport, getResponsiveModalStyles, lockBodyScroll, getTouchButtonStyles } from '../../lib/mobileUtils';

interface DraftSelectionModalProps {
  drafts: DraftMetadata[];
  templateName: string;
  vehicleName?: string;
  onResume: (draft: DraftMetadata) => void;
  onStartNew: () => void;
  onClose: () => void;
}

export const DraftSelectionModal: React.FC<DraftSelectionModalProps> = ({
  drafts,
  templateName,
  vehicleName,
  onResume,
  onStartNew,
  onClose,
}) => {
  const [selectedDraft, setSelectedDraft] = useState<DraftMetadata | null>(null);
  const isMobile = useMobileViewport();

  useEffect(() => {
    lockBodyScroll(true);
    return () => {
      lockBodyScroll(false);
    };
  }, []);

  // Format relative time
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const modalStyles = getResponsiveModalStyles(true);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isMobile ? '#ffffff' : 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: isMobile ? 'stretch' : 'center',
        zIndex: 1000,
        padding: isMobile ? 0 : spacing.md,
        overflow: 'hidden',
      }}
      onClick={isMobile ? undefined : onClose}
    >
      <div
        style={{
          ...cardStyles.card,
          ...(isMobile ? modalStyles : {
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
          }),
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'white',
          borderRadius: isMobile ? 0 : borderRadius.lg,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: spacing.lg,
            borderBottom: `1px solid ${colors.neutral[200]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ ...typography.heading.h3, margin: 0, marginBottom: spacing.xs }}>
              Continue Draft or Start New?
            </h2>
            <p style={{ ...typography.bodySmall, color: colors.neutral[600], margin: 0 }}>
              {templateName}
              {vehicleName && ` • ${vehicleName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              ...getTouchButtonStyles(),
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.neutral[600],
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drafts List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: spacing.md,
          }}
        >
          {drafts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: spacing.xl,
                color: colors.neutral[600],
              }}
            >
              <FileText size={48} style={{ marginBottom: spacing.md, opacity: 0.3 }} />
              <p style={{ ...typography.body, margin: 0 }}>
                No existing drafts found.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {drafts.map((draft) => (
                <button
                  key={draft.id || draft.localDraftKey}
                  onClick={() => setSelectedDraft(draft)}
                  style={{
                    ...cardStyles.card,
                    padding: spacing.md,
                    textAlign: 'left',
                    border: `2px solid ${
                      selectedDraft?.id === draft.id || selectedDraft?.localDraftKey === draft.localDraftKey
                        ? colors.primary
                        : colors.neutral[200]
                    }`,
                    backgroundColor:
                      selectedDraft?.id === draft.id || selectedDraft?.localDraftKey === draft.localDraftKey
                        ? colors.primary[50]
                        : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: spacing.xs,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          ...typography.body,
                          fontWeight: 600,
                          marginBottom: spacing.xs,
                        }}
                      >
                        {draft.vehicle?.registration_number || 'No Vehicle'}
                        {draft.vehicle?.make && ` • ${draft.vehicle.make} ${draft.vehicle.model || ''}`}
                      </div>
                      <div
                        style={{
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                        }}
                      >
                        <Clock size={14} />
                        {formatRelativeTime(draft.updatedAt)}
                        {draft.source === 'local' && (
                          <span
                            style={{
                              padding: `2px ${spacing.xs}`,
                              backgroundColor: colors.warning[100],
                              color: colors.warning[700],
                              borderRadius: borderRadius.sm,
                              fontSize: '11px',
                            }}
                          >
                            Local
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div style={{ marginBottom: spacing.xs }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: spacing.xs,
                      }}
                    >
                      <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        Progress
                      </span>
                      <span style={{ ...typography.bodySmall, fontWeight: 600 }}>
                        {draft.progress.answered} / {draft.progress.total} questions
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: colors.neutral[200],
                        borderRadius: borderRadius.full,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${draft.progress.percent}%`,
                          height: '100%',
                          backgroundColor: colors.primary,
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>

                  {/* Pending Uploads */}
                  {draft.pendingUploads > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs,
                        ...typography.bodySmall,
                        color: colors.warning[700],
                        marginTop: spacing.xs,
                      }}
                    >
                      <Upload size={14} />
                      {draft.pendingUploads} file{draft.pendingUploads !== 1 ? 's' : ''} pending upload
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            padding: spacing.lg,
            borderTop: `1px solid ${colors.neutral[200]}`,
            display: 'flex',
            gap: spacing.md,
            flexDirection: 'column',
          }}
        >
          {selectedDraft && (
            <Button
              onClick={() => {
                onResume(selectedDraft);
                onClose();
              }}
              variant="primary"
              style={{ 
                width: '100%',
                ...getTouchButtonStyles({ minHeight: 48 }),
              }}
            >
              Continue This Draft
            </Button>
          )}
          <Button
            onClick={() => {
              onStartNew();
              onClose();
            }}
            variant={selectedDraft ? 'secondary' : 'primary'}
            style={{ 
              width: '100%',
              ...getTouchButtonStyles({ minHeight: 48 }),
            }}
          >
            Start New Inspection
          </Button>
        </div>
      </div>
    </div>
  );
};
