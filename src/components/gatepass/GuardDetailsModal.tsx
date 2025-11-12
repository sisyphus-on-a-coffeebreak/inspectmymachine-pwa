/**
 * Guard Details Modal
 * 
 * Comprehensive modal for guard actions when processing gate pass entries.
 * Includes:
 * - Incident logging
 * - Escort prompts
 * - Asset checklist
 * - Supervisor escalation
 * - Entry confirmation
 */

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { colors, spacing, borderRadius, typography } from '@/lib/theme';
import { AlertTriangle, CheckSquare, Square, UserPlus, Shield, Clock } from 'lucide-react';
import type { UnifiedGatePassRecord } from '@/lib/services/GatePassService';

export interface GuardDetailsModalProps {
  record: UnifiedGatePassRecord;
  onConfirm: (data: GuardActionData) => Promise<void>;
  onCancel: () => void;
  onClose: () => void;
  showSlaTimer?: boolean;
  slaSeconds?: number;
}

export interface GuardActionData {
  notes?: string;
  incident_log?: string;
  escort_required: boolean;
  escort_name?: string;
  asset_checklist: Record<string, boolean>;
  supervisor_escalated: boolean;
  escalation_reason?: string;
  confirm_entry: boolean;
}

const DEFAULT_ASSET_CHECKLIST = {
  'Vehicle condition verified': false,
  'Driver license verified': false,
  'Documents checked': false,
  'Safety equipment present': false,
  'No unauthorized items': false,
};

export function GuardDetailsModal({
  record,
  onConfirm,
  onCancel,
  onClose,
  showSlaTimer = true,
  slaSeconds = 300, // 5 minutes default
}: GuardDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [incidentLog, setIncidentLog] = useState('');
  const [escortRequired, setEscortRequired] = useState(false);
  const [escortName, setEscortName] = useState('');
  const [assetChecklist, setAssetChecklist] = useState<Record<string, boolean>>(DEFAULT_ASSET_CHECKLIST);
  const [supervisorEscalated, setSupervisorEscalated] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [slaTimeRemaining, setSlaTimeRemaining] = useState(slaSeconds);

  // SLA countdown timer
  React.useEffect(() => {
    if (!showSlaTimer || slaTimeRemaining <= 0) return;
    const timer = setInterval(() => {
      setSlaTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [showSlaTimer, slaTimeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChecklistToggle = (key: string) => {
    setAssetChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleConfirm = async () => {
    if (supervisorEscalated && !escalationReason.trim()) {
      return; // Validation handled in UI
    }

    try {
      setLoading(true);
      const data: GuardActionData = {
        notes: notes.trim() || undefined,
        incident_log: incidentLog.trim() || undefined,
        escort_required: escortRequired,
        escort_name: escortRequired && escortName.trim() ? escortName.trim() : undefined,
        asset_checklist: assetChecklist,
        supervisor_escalated: supervisorEscalated,
        escalation_reason: supervisorEscalated && escalationReason.trim() ? escalationReason.trim() : undefined,
        confirm_entry: true,
      };
      await onConfirm(data);
      onClose();
    } catch (error) {
      console.error('Failed to confirm entry:', error);
      // Error handling should be done by parent via toast
    } finally {
      setLoading(false);
    }
  };

  const allChecklistItemsChecked = Object.values(assetChecklist).every(Boolean);
  const canConfirm = !supervisorEscalated || escalationReason.trim().length > 0;

  return (
    <Modal
      title={`Process Entry - ${record.passNumber}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={loading}
            disabled={!canConfirm}
          >
            Confirm Entry
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {/* SLA Timer */}
        {showSlaTimer && slaTimeRemaining > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: spacing.md,
              backgroundColor: slaTimeRemaining < 60 ? colors.error[50] : colors.warning[50],
              border: `1px solid ${slaTimeRemaining < 60 ? colors.error[200] : colors.warning[200]}`,
              borderRadius: borderRadius.md,
            }}
          >
            <Clock
              size={20}
              style={{
                color: slaTimeRemaining < 60 ? colors.error[600] : colors.warning[600],
              }}
            />
            <span
              style={{
                ...typography.body,
                fontWeight: 600,
                color: slaTimeRemaining < 60 ? colors.error[700] : colors.warning[700],
              }}
            >
              Time remaining: {formatTime(slaTimeRemaining)}
            </span>
          </div>
        )}

        {/* Record Summary */}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.md,
          }}
        >
          <h4 style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.sm }}>
            Pass Details
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <div>
              <strong>Type:</strong> {record.type === 'visitor' ? 'Visitor' : 'Vehicle Movement'}
            </div>
            {record.visitorName && (
              <div>
                <strong>Visitor:</strong> {record.visitorName}
              </div>
            )}
            {record.vehicle && (
              <div>
                <strong>Vehicle:</strong> {record.vehicle.registration_number} ({record.vehicle.make} {record.vehicle.model})
              </div>
            )}
            <div>
              <strong>Purpose:</strong> {record.purpose}
            </div>
          </div>
        </div>

        {/* Asset Checklist */}
        <div>
          <Label style={{ marginBottom: spacing.sm, display: 'block' }}>
            Asset Checklist {allChecklistItemsChecked && '✓'}
          </Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {Object.entries(assetChecklist).map(([key, checked]) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  cursor: 'pointer',
                  padding: spacing.sm,
                  borderRadius: borderRadius.sm,
                  backgroundColor: checked ? colors.success[50] : 'transparent',
                  border: `1px solid ${checked ? colors.success[200] : colors.neutral[200]}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleChecklistToggle(key)}
                  style={{ display: 'none' }}
                />
                {checked ? (
                  <CheckSquare size={20} style={{ color: colors.success[600] }} />
                ) : (
                  <Square size={20} style={{ color: colors.neutral[400] }} />
                )}
                <span style={{ ...typography.body, flex: 1 }}>{key}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Escort Required */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              cursor: 'pointer',
              marginBottom: escortRequired ? spacing.sm : 0,
            }}
          >
            <input
              type="checkbox"
              checked={escortRequired}
              onChange={(e) => setEscortRequired(e.target.checked)}
            />
            <UserPlus size={20} style={{ color: colors.neutral[600] }} />
            <span style={{ ...typography.body, fontWeight: 600 }}>Escort Required</span>
          </label>
          {escortRequired && (
            <Input
              placeholder="Enter escort name"
              value={escortName}
              onChange={(e) => setEscortName(e.target.value)}
              style={{ marginTop: spacing.sm }}
            />
          )}
        </div>

        {/* Incident Log */}
        <div>
          <Label>
            <AlertTriangle size={16} style={{ display: 'inline', marginRight: spacing.xs }} />
            Incident Log (Optional)
          </Label>
          <textarea
            value={incidentLog}
            onChange={(e) => setIncidentLog(e.target.value)}
            placeholder="Log any incidents, observations, or concerns..."
            rows={3}
            style={{
              width: '100%',
              padding: spacing.md,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Notes */}
        <div>
          <Label>Additional Notes (Optional)</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows={2}
            style={{
              width: '100%',
              padding: spacing.md,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Supervisor Escalation */}
        <div
          style={{
            padding: spacing.md,
            backgroundColor: colors.warning[50],
            border: `1px solid ${colors.warning[200]}`,
            borderRadius: borderRadius.md,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              cursor: 'pointer',
              marginBottom: supervisorEscalated ? spacing.sm : 0,
            }}
          >
            <input
              type="checkbox"
              checked={supervisorEscalated}
              onChange={(e) => setSupervisorEscalated(e.target.checked)}
            />
            <Shield size={20} style={{ color: colors.warning[600] }} />
            <span style={{ ...typography.body, fontWeight: 600 }}>Escalate to Supervisor</span>
          </label>
          {supervisorEscalated && (
            <>
              <Input
                placeholder="Reason for escalation (required)"
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                style={{ marginTop: spacing.sm }}
                required
              />
              {!escalationReason.trim() && (
                <p style={{ ...typography.bodySmall, color: colors.error[600], marginTop: spacing.xs }}>
                  Please provide a reason for escalation
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

