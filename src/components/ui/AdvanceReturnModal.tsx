/**
 * Advance Return Modal
 * 
 * Modal for returning advances (Debit transactions)
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

export interface Advance {
  id: string;
  amount: number;
  remaining: number;
  purpose: string;
  issued_date: string;
  expiry_date?: string;
}

export interface AdvanceReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  advance?: Advance;
  onSuccess?: () => void;
}

export const AdvanceReturnModal: React.FC<AdvanceReturnModalProps> = ({
  isOpen,
  onClose,
  advance,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { refetch: refetchBalance } = useFloatBalance();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    returnAmount: '',
    returnType: 'full' as 'full' | 'partial',
    reason: '',
    receiptUploaded: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const returnAmount = formData.returnType === 'full' 
    ? (advance?.remaining || 0)
    : Number(formData.returnAmount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (formData.returnType === 'partial') {
      if (!formData.returnAmount || returnAmount <= 0) {
        newErrors.returnAmount = 'Enter a valid return amount';
      } else if (returnAmount > (advance?.remaining || 0)) {
        newErrors.returnAmount = 'Return amount cannot exceed remaining advance';
      }
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
      await apiClient.post(`/v1/advances/${advance.id}/return`, {
        return_amount: returnAmount,
        return_type: formData.returnType,
        reason: formData.reason,
        notes: formData.reason,
        receipt_key: formData.receiptUploaded ? 'uploaded' : undefined,
      });

      showToast({
        title: 'Advance Returned',
        description: `Return of ₹${returnAmount.toLocaleString('en-IN')} has been processed successfully.`,
        variant: 'success',
      });

      setFormData({ returnAmount: '', returnType: 'full', reason: '', receiptUploaded: false });
      setErrors({});
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['float', 'balance'] });
      await queryClient.invalidateQueries({ queryKey: ['advances'] });
      await queryClient.invalidateQueries({ queryKey: ['ledger', 'transactions'] });
      await refetchBalance();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to return advance',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !advance) return null;

  return (
    <Modal
      title="Return Advance (Debit)"
      onClose={onClose}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Return Advance'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ padding: spacing.md }}>
        <div style={{ display: 'grid', gap: spacing.lg }}>
          {/* Advance Info */}
          <div style={{
            padding: spacing.md,
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.sm,
            border: `1px solid ${colors.neutral[200]}`,
          }}>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Advance Details
            </div>
            <div style={{ ...typography.body, marginBottom: spacing.xs }}>
              Purpose: {advance.purpose}
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
              Original: ₹{advance.amount.toLocaleString('en-IN')} • 
              Remaining: ₹{advance.remaining.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Return Type */}
          <div>
            <Label>Return Type *</Label>
            <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.xs }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="full"
                  checked={formData.returnType === 'full'}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnType: e.target.value as any }))}
                />
                <span>Full Return (₹{advance.remaining.toLocaleString('en-IN')})</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="partial"
                  checked={formData.returnType === 'partial'}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnType: e.target.value as any }))}
                />
                <span>Partial Return</span>
              </label>
            </div>
          </div>

          {/* Partial Return Amount */}
          {formData.returnType === 'partial' && (
            <div>
              <Label>
                Return Amount (₹) *
              </Label>
              <Input
                type="number"
                value={formData.returnAmount}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, returnAmount: e.target.value }));
                  if (errors.returnAmount) setErrors(prev => ({ ...prev, returnAmount: '' }));
                }}
                placeholder={`Max: ₹${advance.remaining.toLocaleString('en-IN')}`}
                max={advance.remaining}
                style={{ marginTop: spacing.xs }}
              />
              {errors.returnAmount && (
                <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                  {errors.returnAmount}
                </div>
              )}
            </div>
          )}

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
              placeholder="Explain why you are returning this advance..."
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
              Receipt for Return (Optional)
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

