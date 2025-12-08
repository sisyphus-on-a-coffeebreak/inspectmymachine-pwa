/**
 * Issue Advance Modal
 * 
 * Modal for issuing advances (Credit transactions)
 * Shows ledger impact preview before submission
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { useFloatBalance } from '../../lib/queries';
import { useToast } from '../../providers/ToastProvider';
import { apiClient } from '../../lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';

export interface IssueAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialAmount?: number;
}

export const IssueAdvanceModal: React.FC<IssueAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAmount,
}) => {
  const { showToast } = useToast();
  const { refetch: refetchBalance } = useFloatBalance();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    amount: initialAmount ? initialAmount.toString() : '',
    purpose: '',
    expiryDate: '',
    notes: '',
  });

  // Update amount when initialAmount changes
  useEffect(() => {
    if (initialAmount && isOpen) {
      setFormData(prev => ({ ...prev, amount: initialAmount.toString() }));
    }
  }, [initialAmount, isOpen]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const advanceAmount = Number(formData.amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.amount || advanceAmount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/v1/advances', {
        amount: advanceAmount,
        purpose: formData.purpose,
        expiry_date: formData.expiryDate || undefined,
        notes: formData.notes || undefined,
      });

      showToast({
        title: 'Advance Issued',
        description: `Advance of ₹${advanceAmount.toLocaleString('en-IN')} has been issued successfully.`,
        variant: 'success',
      });

      // Reset form
      setFormData({ amount: '', purpose: '', expiryDate: '', notes: '' });
      setErrors({});

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['float', 'balance'] });
      await queryClient.invalidateQueries({ queryKey: ['advances'] });
      await refetchBalance();
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to issue advance';
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      title="Issue Advance (Credit)"
      onClose={onClose}
      size="lg"
      footer={
        <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={(e) => {
              e?.preventDefault();
              if (e) {
                handleSubmit(e as unknown as React.FormEvent);
              }
            }} 
            disabled={loading}
          >
            {loading ? 'Issuing...' : 'Issue Advance'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ padding: 0 }}>
        <div style={{ display: 'grid', gap: spacing.lg }}>
          {/* Amount */}
          <div>
            <Label>
              Amount (₹) *
            </Label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, amount: e.target.value }));
                if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
              }}
              placeholder="Enter advance amount"
              style={{ marginTop: spacing.xs }}
            />
            {errors.amount && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                {errors.amount}
              </div>
            )}
          </div>

          {/* Purpose */}
          <div>
            <Label>
              Purpose *
            </Label>
            <textarea
              value={formData.purpose}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, purpose: e.target.value }));
                if (errors.purpose) setErrors(prev => ({ ...prev, purpose: '' }));
              }}
              placeholder="Describe the purpose of this advance..."
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
            {errors.purpose && (
              <div style={{ color: colors.status.error, fontSize: '12px', marginTop: spacing.xs }}>
                {errors.purpose}
              </div>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <Label>
              Expiry Date (Optional)
            </Label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              style={{ marginTop: spacing.xs }}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>
              Additional Notes (Optional)
            </Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information..."
              style={{
                width: '100%',
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: borderRadius.sm,
                fontSize: '14px',
                minHeight: '60px',
                resize: 'vertical',
                marginTop: spacing.xs,
                fontFamily: typography.body.fontFamily,
              }}
            />
          </div>

        </div>
      </form>
    </Modal>
  );
};

