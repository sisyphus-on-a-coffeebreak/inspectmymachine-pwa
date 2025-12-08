/**
 * Cash Return Modal
 * 
 * Modal for returning cash (Debit transactions)
 */

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { useFloatBalance } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import { apiClient } from '../../lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';

export interface CashReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CashReturnModal: React.FC<CashReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { refetch: refetchBalance } = useFloatBalance();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
    receiptUploaded: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const returnAmount = Number(formData.amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.amount || returnAmount <= 0) {
      newErrors.amount = 'Enter a valid return amount';
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/v1/cash-returns', {
        amount: returnAmount,
        reason: formData.reason,
        notes: formData.reason,
        receipt_key: formData.receiptUploaded ? 'uploaded' : undefined,
      });

      showToast({
        title: 'Cash Returned',
        description: `Cash return of ₹${returnAmount.toLocaleString('en-IN')} has been processed successfully.`,
        variant: 'success',
      });

      setFormData({ amount: '', reason: '', receiptUploaded: false });
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
        description: error.message || 'Failed to process cash return',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="Return Cash (Debit)"
      onClose={onClose}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Return Cash'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ padding: spacing.md }}>
        <div style={{ display: 'grid', gap: spacing.lg }}>
          {/* Amount */}
          <div>
            <Label>
              Return Amount (₹) *
            </Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, amount: e.target.value }));
                if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
              }}
              placeholder="Enter cash return amount"
              style={{ marginTop: spacing.xs }}
            />
            {errors.amount && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                {errors.amount}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <Label>
              Reason for Return *
            </Label>
            <textarea
              value={formData.reason}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, reason: e.target.value }));
                if (errors.reason) setErrors(prev => ({ ...prev, reason: '' }));
              }}
              placeholder="Explain why you are returning this cash..."
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
            {errors.reason && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                {errors.reason}
              </div>
            )}
          </div>

          {/* Receipt Upload */}
          <div>
            <Label>
              Receipt (Optional)
            </Label>
            <div style={{
              padding: spacing.md,
              border: '2px dashed #D1D5DB',
              borderRadius: borderRadius.sm,
              textAlign: 'center',
              marginTop: spacing.xs,
              cursor: 'pointer',
            }}>
              <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                {formData.receiptUploaded ? '✓ Receipt uploaded' : 'Click to upload receipt'}
              </div>
            </div>
          </div>

        </div>
      </form>
    </Modal>
  );
};

