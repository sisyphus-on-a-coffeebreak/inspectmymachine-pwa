import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { TemplateDiffViewer } from './TemplateDiffViewer';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldTemplate: {
    id: string;
    name: string;
    version?: number;
    updated_at?: string;
    sections: any[];
  };
  newTemplate: {
    id: string;
    name: string;
    version?: number;
    updated_at?: string;
    sections: any[];
  };
  inspectionAnswers: Record<string, any>;
  onResolve: (strategy: 'keep_answers' | 'use_new_template' | 'merge') => Promise<void>;
  resolving?: boolean;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  oldTemplate,
  newTemplate,
  inspectionAnswers,
  onResolve,
  resolving = false,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<'keep_answers' | 'use_new_template' | 'merge' | null>(null);

  const handleResolve = async () => {
    if (!selectedStrategy) return;
    await onResolve(selectedStrategy);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Template Version Conflict"
      showCloseButton={!resolving}
    >
      <div style={{ padding: spacing.lg }}>
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.warning[50],
            border: `2px solid ${colors.warning[300]}`,
            borderRadius: borderRadius.md,
            display: 'flex',
            alignItems: 'start',
            gap: spacing.sm,
            marginBottom: spacing.lg,
          }}
        >
          <AlertTriangle size={24} color={colors.warning[700]} />
          <div style={{ flex: 1 }}>
            <div style={{ ...typography.subheader, marginBottom: spacing.xs }}>
              Template Updated During Inspection
            </div>
            <div style={{ ...typography.body, color: colors.neutral[700] }}>
              The inspection template was updated after you started this inspection. 
              Please choose how to handle the changes.
            </div>
          </div>
        </div>

        {/* Template Diff Viewer */}
        <div style={{ marginBottom: spacing.lg, maxHeight: '400px', overflowY: 'auto' }}>
          <TemplateDiffViewer
            oldTemplate={oldTemplate}
            newTemplate={newTemplate}
            inspectionAnswers={inspectionAnswers}
          />
        </div>

        {/* Resolution Options */}
        <div style={{ marginBottom: spacing.lg }}>
          <div style={{ ...typography.label, marginBottom: spacing.md }}>
            Choose Resolution Strategy:
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            <label
              style={{
                padding: spacing.md,
                border: `2px solid ${selectedStrategy === 'keep_answers' ? colors.primary : colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                backgroundColor: selectedStrategy === 'keep_answers' ? colors.primary + '10' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'start',
                gap: spacing.sm,
              }}
            >
              <input
                type="radio"
                name="resolution"
                value="keep_answers"
                checked={selectedStrategy === 'keep_answers'}
                onChange={() => setSelectedStrategy('keep_answers')}
                style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                  Keep My Answers
                </div>
                <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                  Keep all your existing answers. New questions will be added, but your answers remain unchanged.
                </div>
              </div>
            </label>

            <label
              style={{
                padding: spacing.md,
                border: `2px solid ${selectedStrategy === 'use_new_template' ? colors.primary : colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                backgroundColor: selectedStrategy === 'use_new_template' ? colors.primary + '10' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'start',
                gap: spacing.sm,
              }}
            >
              <input
                type="radio"
                name="resolution"
                value="use_new_template"
                checked={selectedStrategy === 'use_new_template'}
                onChange={() => setSelectedStrategy('use_new_template')}
                style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                  Use New Template
                </div>
                <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                  Discard your answers and start fresh with the new template. All answers will be cleared.
                </div>
              </div>
            </label>

            <label
              style={{
                padding: spacing.md,
                border: `2px solid ${selectedStrategy === 'merge' ? colors.primary : colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                backgroundColor: selectedStrategy === 'merge' ? colors.primary + '10' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'start',
                gap: spacing.sm,
              }}
            >
              <input
                type="radio"
                name="resolution"
                value="merge"
                checked={selectedStrategy === 'merge'}
                onChange={() => setSelectedStrategy('merge')}
                style={{ marginTop: '4px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                  Smart Merge
                </div>
                <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                  Keep answers for unchanged questions, clear answers for modified questions, and add new questions.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={resolving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleResolve}
            disabled={!selectedStrategy || resolving}
            icon={resolving ? <RefreshCw size={16} /> : <CheckCircle size={16} />}
          >
            {resolving ? 'Resolving...' : 'Resolve Conflict'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

