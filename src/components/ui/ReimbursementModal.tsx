/**
 * Reimbursement Modal
 * 
 * Modal for posting reimbursements (Credit transactions)
 * Auto-calculates deficit for reimbursement
 */

import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { useFloatBalance, useExpenses } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import { apiClient } from '../../lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';

export interface ReimbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReimbursementModal: React.FC<ReimbursementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { data: floatData, refetch: refetchBalance } = useFloatBalance();
  const { data: expensesData } = useExpenses({ mine: true });
  const queryClient = useQueryClient();
  const currentBalance = Number(floatData?.balance ?? 0);
  const expenses = expensesData?.data || [];

  // Calculate deficit (expenses - advances)
  // For now, we'll use current balance as negative = deficit
  const deficit = useMemo(() => {
    if (currentBalance >= 0) return 0;
    return Math.abs(currentBalance);
  }, [currentBalance]);

  const [formData, setFormData] = useState({
    amount: deficit.toString(),
    description: '',
    autoCalculate: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reimbursementAmount = Number(formData.amount) || 0;

  // Auto-update amount when deficit changes
  React.useEffect(() => {
    if (formData.autoCalculate && deficit > 0) {
      setFormData(prev => ({ ...prev, amount: deficit.toString() }));
    }
  }, [deficit, formData.autoCalculate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.amount || reimbursementAmount <= 0) {
      newErrors.amount = 'Enter a valid reimbursement amount';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/v1/reimbursements', {
        amount: reimbursementAmount,
        description: formData.description,
        notes: formData.description,
      });

      showToast({
        title: 'Reimbursement Posted',
        description: `Reimbursement of ₹${reimbursementAmount.toLocaleString('en-IN')} has been posted successfully.`,
        variant: 'success',
      });

      setFormData({ amount: deficit.toString(), description: '', autoCalculate: true });
      setErrors({});
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['float', 'balance'] });
      await queryClient.invalidateQueries({ queryKey: ['ledger', 'transactions'] });
      await refetchBalance();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to post reimbursement',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="Post Reimbursement (Credit)"
      onClose={onClose}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Posting...' : 'Post Reimbursement'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ padding: spacing.md }}>
        <div style={{ display: 'grid', gap: spacing.lg }}>
          {/* Deficit Info */}
          {deficit > 0 && (
            <div style={{
              padding: spacing.md,
              backgroundColor: colors.status.warning + '20',
              border: `1px solid ${colors.status.warning}`,
              borderRadius: borderRadius.sm,
            }}>
              <div style={{ ...typography.subheader, color: colors.status.warning, marginBottom: spacing.xs }}>
                Current Deficit: ₹{deficit.toLocaleString('en-IN')}
              </div>
              <div style={{ ...typography.bodySmall, color: colors.neutral[700] }}>
                This is the amount you owe (expenses exceed advances). Reimbursement will clear this deficit.
              </div>
            </div>
          )}

          {deficit === 0 && (
            <div style={{
              padding: spacing.md,
              backgroundColor: colors.status.normal + '20',
              border: `1px solid ${colors.status.normal}`,
              borderRadius: borderRadius.sm,
            }}>
              <div style={{ ...typography.bodySmall, color: colors.neutral[700] }}>
                You have no deficit. Your balance is positive or zero.
              </div>
            </div>
          )}

          {/* Auto-calculate checkbox */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.autoCalculate}
                onChange={(e) => setFormData(prev => ({ ...prev, autoCalculate: e.target.checked }))}
              />
              <span style={{ ...typography.body }}>Auto-calculate from deficit</span>
            </label>
          </div>

          {/* Amount */}
          <div>
            <Label>
              Reimbursement Amount (₹) *
            </Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, amount: e.target.value, autoCalculate: false }));
                if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
              }}
              placeholder="Enter reimbursement amount"
              disabled={formData.autoCalculate && deficit > 0}
              style={{ marginTop: spacing.xs }}
            />
            {errors.amount && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                {errors.amount}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label>
              Description *
            </Label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
              }}
              placeholder="Describe this reimbursement..."
              style={{
                width: '100%',
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: borderRadius.sm,
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical',
                marginTop: spacing.xs,
                fontFamily: typography.body.fontFamily,
              }}
            />
            {errors.description && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                {errors.description}
              </div>
            )}
          </div>

        </div>
      </form>
    </Modal>
  );
};

