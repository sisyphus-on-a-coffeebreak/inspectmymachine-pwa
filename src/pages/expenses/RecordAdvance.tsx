/**
 * Record Advance Page
 * 
 * Allows employees to record advances they receive
 * This is self-service - employees record advances they receive from company
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { useToast } from '../../providers/ToastProvider';
import { apiClient } from '../../lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { useSmartKeyboard } from '../../hooks/useSmartKeyboard';
import { emitAdvanceRecorded } from '../../lib/workflow/eventEmitters';
import { Wallet, Upload, Calendar } from 'lucide-react';

interface RecordAdvanceFormData {
  amount: string;
  date: string;
  purpose: string;
  received_from: string;
  receipt?: File | null;
  notes?: string;
}

export const RecordAdvance: React.FC = () => {
  useSmartKeyboard({ enabled: true, scrollOffset: 100 });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<RecordAdvanceFormData>({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    received_from: '',
    receipt: null,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handleChange = (field: keyof RecordAdvanceFormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange('receipt', file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    const amount = Number(formData.amount);
    
    if (!formData.amount || amount <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    if (!formData.received_from.trim()) {
      newErrors.received_from = 'Please specify who you received the advance from';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const payload = new FormData();
      payload.append('amount', amount.toString());
      payload.append('date', formData.date);
      payload.append('purpose', formData.purpose);
      payload.append('received_from', formData.received_from);
      if (formData.notes) {
        payload.append('notes', formData.notes);
      }
      if (formData.receipt) {
        payload.append('receipt', formData.receipt);
      }
      payload.append('recorded_by_employee', 'true'); // Flag to indicate employee recorded

      const response = await apiClient.post('/v1/advances/record', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Emit workflow event
      if (response.data?.id) {
        await emitAdvanceRecorded(
          response.data.id,
          user?.id?.toString() || '',
          amount,
          user?.id?.toString()
        );
      }

      showToast({
        title: 'Advance Recorded',
        description: `Advance of ₹${amount.toLocaleString('en-IN')} has been recorded successfully.`,
        variant: 'success',
      });

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['advances'] });
      await queryClient.invalidateQueries({ queryKey: ['float', 'balance'] });
      await queryClient.invalidateQueries({ queryKey: ['ledger'] });

      // Navigate back
      navigate('/app/expenses');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to record advance';
      showToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: spacing.xl,
      minHeight: '100dvh',
      backgroundColor: colors.neutral[50],
    }}>
      <PageHeader
        title="Record Advance"
        subtitle="Record an advance you have received from the company"
        icon="💰"
        breadcrumbs={[
          { label: 'Dashboard', path: '/app/home', icon: '🏠' },
          { label: 'Expenses', path: '/app/expenses', icon: '💰' },
          { label: 'Record Advance', icon: '➕' },
        ]}
      />

      <form onSubmit={handleSubmit} style={{ marginTop: spacing.xl }}>
        <div style={{ ...cardStyles.base, padding: spacing.xl, marginBottom: spacing.lg }}>
          <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
            Advance Details
          </h2>

          {/* Amount */}
          <div style={{ marginBottom: spacing.lg }}>
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="Enter amount"
              style={{ marginTop: spacing.xs }}
              error={errors.amount}
            />
          </div>

          {/* Date */}
          <div style={{ marginBottom: spacing.lg }}>
            <Label htmlFor="date">
              <Calendar size={16} style={{ display: 'inline', marginRight: spacing.xs }} />
              Date Received *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              style={{ marginTop: spacing.xs }}
              error={errors.date}
            />
          </div>

          {/* Purpose */}
          <div style={{ marginBottom: spacing.lg }}>
            <Label htmlFor="purpose">Purpose *</Label>
            <Input
              id="purpose"
              type="text"
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="e.g., Field expenses, Travel advance, etc."
              style={{ marginTop: spacing.xs }}
              error={errors.purpose}
            />
          </div>

          {/* Received From */}
          <div style={{ marginBottom: spacing.lg }}>
            <Label htmlFor="received_from">Received From *</Label>
            <Input
              id="received_from"
              type="text"
              value={formData.received_from}
              onChange={(e) => handleChange('received_from', e.target.value)}
              placeholder="e.g., Accounts Department, Manager Name, etc."
              style={{ marginTop: spacing.xs }}
              error={errors.received_from}
            />
            <p style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
              Specify who gave you the advance (person or department)
            </p>
          </div>

          {/* Receipt Upload */}
          <div style={{ marginBottom: spacing.lg }}>
            <Label htmlFor="receipt">
              <Upload size={16} style={{ display: 'inline', marginRight: spacing.xs }} />
              Receipt (Optional)
            </Label>
            <Input
              id="receipt"
              type="file"
              accept="image/*,.pdf"
              onChange={handleReceiptChange}
              style={{ marginTop: spacing.xs }}
            />
            {receiptPreview && (
              <div style={{ marginTop: spacing.sm }}>
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.neutral[200]}`,
                  }}
                />
              </div>
            )}
            <p style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
              Upload a photo or PDF of the advance receipt (if available)
            </p>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: spacing.lg }}>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information..."
              rows={3}
              style={{
                width: '100%',
                padding: spacing.sm,
                marginTop: spacing.xs,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontFamily: typography.fontFamily,
                fontSize: typography.body.fontSize,
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Info Box */}
        <div style={{
          ...cardStyles.base,
          padding: spacing.md,
          marginBottom: spacing.lg,
          backgroundColor: colors.info[50],
          border: `1px solid ${colors.info[200]}`,
        }}>
          <p style={{ ...typography.bodySmall, color: colors.info[800], margin: 0 }}>
            <strong>Note:</strong> This advance will be added to your account as a credit (CR). 
            Your expenses will be debited (DR) from this balance. The balance can go negative 
            if you spend from your pocket in urgent situations.
          </p>
        </div>

        {/* Submit Buttons */}
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/app/expenses')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            icon={<Wallet size={18} />}
          >
            {loading ? 'Recording...' : 'Record Advance'}
          </Button>
        </div>
      </form>
    </div>
  );
};



