import React, { useState, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { Button } from '../ui/button';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../providers/ToastProvider';
import { Save, CheckCircle, XCircle, AlertCircle, FileText, Shield, Car, Calendar } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface RtoDetailsManagerProps {
  inspectionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

interface RtoDetailsForm {
  // RC Details
  rc_number?: string;
  rc_issue_date?: string;
  rc_expiry_date?: string;
  rc_owner_name?: string;
  rc_owner_address?: string;
  
  // Fitness Certificate
  fitness_certificate_number?: string;
  fitness_issue_date?: string;
  fitness_expiry_date?: string;
  fitness_status?: 'valid' | 'expired' | 'pending' | 'not_applicable';
  
  // Permit
  permit_number?: string;
  permit_issue_date?: string;
  permit_expiry_date?: string;
  permit_type?: 'national' | 'state' | 'local' | 'not_applicable';
  
  // Insurance
  insurance_policy_number?: string;
  insurance_company?: string;
  insurance_issue_date?: string;
  insurance_expiry_date?: string;
  insurance_type?: 'third_party' | 'comprehensive' | 'not_applicable';
  
  // Tax
  tax_certificate_number?: string;
  tax_paid_date?: string;
  tax_valid_until?: string;
  
  // PUC
  puc_certificate_number?: string;
  puc_issue_date?: string;
  puc_expiry_date?: string;
  puc_status?: 'valid' | 'expired' | 'pending' | 'not_applicable';
  
  // Visibility toggles
  show_rc_details?: boolean;
  show_fitness?: boolean;
  show_permit?: boolean;
  show_insurance?: boolean;
  show_tax?: boolean;
  show_puc?: boolean;
  
  // Notes
  verification_notes?: string;
  discrepancies?: string;
}

export const RtoDetailsManager: React.FC<RtoDetailsManagerProps> = ({
  inspectionId,
  isOpen,
  onClose,
  onSave,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<RtoDetailsForm>({});
  const [activeTab, setActiveTab] = useState<'rc' | 'fitness' | 'permit' | 'insurance' | 'tax' | 'puc' | 'notes'>('rc');

  useEffect(() => {
    if (isOpen && inspectionId) {
      loadRtoDetails();
    }
  }, [isOpen, inspectionId]);

  const loadRtoDetails = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/v1/inspections/${inspectionId}/rto-details`);
      if (response.data?.success && response.data.data) {
        const details = response.data.data;
        setFormData({
          rc_number: details.rc_number || '',
          rc_issue_date: details.rc_issue_date || '',
          rc_expiry_date: details.rc_expiry_date || '',
          rc_owner_name: details.rc_owner_name || '',
          rc_owner_address: details.rc_owner_address || '',
          fitness_certificate_number: details.fitness_certificate_number || '',
          fitness_issue_date: details.fitness_issue_date || '',
          fitness_expiry_date: details.fitness_expiry_date || '',
          fitness_status: details.fitness_status || 'pending',
          permit_number: details.permit_number || '',
          permit_issue_date: details.permit_issue_date || '',
          permit_expiry_date: details.permit_expiry_date || '',
          permit_type: details.permit_type || 'not_applicable',
          insurance_policy_number: details.insurance_policy_number || '',
          insurance_company: details.insurance_company || '',
          insurance_issue_date: details.insurance_issue_date || '',
          insurance_expiry_date: details.insurance_expiry_date || '',
          insurance_type: details.insurance_type || 'not_applicable',
          tax_certificate_number: details.tax_certificate_number || '',
          tax_paid_date: details.tax_paid_date || '',
          tax_valid_until: details.tax_valid_until || '',
          puc_certificate_number: details.puc_certificate_number || '',
          puc_issue_date: details.puc_issue_date || '',
          puc_expiry_date: details.puc_expiry_date || '',
          puc_status: details.puc_status || 'pending',
          show_rc_details: details.show_rc_details ?? true,
          show_fitness: details.show_fitness ?? true,
          show_permit: details.show_permit ?? true,
          show_insurance: details.show_insurance ?? true,
          show_tax: details.show_tax ?? true,
          show_puc: details.show_puc ?? true,
          verification_notes: details.verification_notes || '',
          discrepancies: details.discrepancies || '',
        });
      }
    } catch (error: any) {
      // No RTO details exist yet (404 is expected), start with empty form
      // Silently handle 404 errors as they're expected when RTO details don't exist
      if (error?.response?.status !== 404) {
        console.warn('Failed to load RTO details:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post(`/v1/inspections/${inspectionId}/rto-details`, formData);
      
      showToast({
        title: 'Success',
        description: 'RTO details saved successfully',
        variant: 'success',
      });
      
      onSave?.();
      onClose();
    } catch (error) {
      showToast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save RTO details',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof RtoDetailsForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'rc', label: 'RC Details', icon: FileText },
    { id: 'fitness', label: 'Fitness', icon: Shield },
    { id: 'permit', label: 'Permit', icon: Car },
    { id: 'insurance', label: 'Insurance', icon: Shield },
    { id: 'tax', label: 'Tax', icon: FileText },
    { id: 'puc', label: 'PUC', icon: AlertCircle },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'rc':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div style={{ 
              padding: spacing.sm, 
              backgroundColor: colors.neutral[50], 
              borderRadius: borderRadius.sm,
              marginBottom: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <label style={{ ...typography.label, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <input
                  type="checkbox"
                  checked={formData.show_rc_details ?? true}
                  onChange={(e) => updateField('show_rc_details', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Include RC Details in Report</span>
              </label>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>RC Number</label>
              <input
                type="text"
                value={formData.rc_number || ''}
                onChange={(e) => updateField('rc_number', e.target.value)}
                style={{ ...cardStyles.input }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Issue Date</label>
                <input
                  type="date"
                  value={formData.rc_issue_date || ''}
                  onChange={(e) => updateField('rc_issue_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Expiry Date</label>
                <input
                  type="date"
                  value={formData.rc_expiry_date || ''}
                  onChange={(e) => updateField('rc_expiry_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Owner Name</label>
              <input
                type="text"
                value={formData.rc_owner_name || ''}
                onChange={(e) => updateField('rc_owner_name', e.target.value)}
                style={{ ...cardStyles.input }}
              />
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Owner Address</label>
              <textarea
                value={formData.rc_owner_address || ''}
                onChange={(e) => updateField('rc_owner_address', e.target.value)}
                rows={3}
                style={{ ...cardStyles.input }}
              />
            </div>
          </div>
        );

      case 'fitness':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div style={{ 
              padding: spacing.sm, 
              backgroundColor: colors.neutral[50], 
              borderRadius: borderRadius.sm,
              marginBottom: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <label style={{ ...typography.label, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <input
                  type="checkbox"
                  checked={formData.show_fitness ?? true}
                  onChange={(e) => updateField('show_fitness', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Include Fitness Certificate in Report</span>
              </label>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Certificate Number</label>
              <input
                type="text"
                value={formData.fitness_certificate_number || ''}
                onChange={(e) => updateField('fitness_certificate_number', e.target.value)}
                style={{ ...cardStyles.input }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Issue Date</label>
                <input
                  type="date"
                  value={formData.fitness_issue_date || ''}
                  onChange={(e) => updateField('fitness_issue_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Expiry Date</label>
                <input
                  type="date"
                  value={formData.fitness_expiry_date || ''}
                  onChange={(e) => updateField('fitness_expiry_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Status</label>
              <select
                value={formData.fitness_status || 'pending'}
                onChange={(e) => updateField('fitness_status', e.target.value)}
                style={{ ...cardStyles.input }}
              >
                <option value="valid">Valid</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
                <option value="not_applicable">Not Applicable</option>
              </select>
            </div>
          </div>
        );

      case 'permit':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div style={{ 
              padding: spacing.sm, 
              backgroundColor: colors.neutral[50], 
              borderRadius: borderRadius.sm,
              marginBottom: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <label style={{ ...typography.label, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <input
                  type="checkbox"
                  checked={formData.show_permit ?? true}
                  onChange={(e) => updateField('show_permit', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Include Permit Details in Report</span>
              </label>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Permit Number</label>
              <input
                type="text"
                value={formData.permit_number || ''}
                onChange={(e) => updateField('permit_number', e.target.value)}
                style={{ ...cardStyles.input }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Issue Date</label>
                <input
                  type="date"
                  value={formData.permit_issue_date || ''}
                  onChange={(e) => updateField('permit_issue_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Expiry Date</label>
                <input
                  type="date"
                  value={formData.permit_expiry_date || ''}
                  onChange={(e) => updateField('permit_expiry_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Permit Type</label>
              <select
                value={formData.permit_type || 'not_applicable'}
                onChange={(e) => updateField('permit_type', e.target.value)}
                style={{ ...cardStyles.input }}
              >
                <option value="national">National</option>
                <option value="state">State</option>
                <option value="local">Local</option>
                <option value="not_applicable">Not Applicable</option>
              </select>
            </div>
          </div>
        );

      case 'insurance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div style={{ 
              padding: spacing.sm, 
              backgroundColor: colors.neutral[50], 
              borderRadius: borderRadius.sm,
              marginBottom: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <label style={{ ...typography.label, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <input
                  type="checkbox"
                  checked={formData.show_insurance ?? true}
                  onChange={(e) => updateField('show_insurance', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Include Insurance Details in Report</span>
              </label>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Policy Number</label>
              <input
                type="text"
                value={formData.insurance_policy_number || ''}
                onChange={(e) => updateField('insurance_policy_number', e.target.value)}
                style={{ ...cardStyles.input }}
              />
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Insurance Company</label>
              <input
                type="text"
                value={formData.insurance_company || ''}
                onChange={(e) => updateField('insurance_company', e.target.value)}
                style={{ ...cardStyles.input }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Issue Date</label>
                <input
                  type="date"
                  value={formData.insurance_issue_date || ''}
                  onChange={(e) => updateField('insurance_issue_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Expiry Date</label>
                <input
                  type="date"
                  value={formData.insurance_expiry_date || ''}
                  onChange={(e) => updateField('insurance_expiry_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Insurance Type</label>
              <select
                value={formData.insurance_type || 'not_applicable'}
                onChange={(e) => updateField('insurance_type', e.target.value)}
                style={{ ...cardStyles.input }}
              >
                <option value="third_party">Third Party</option>
                <option value="comprehensive">Comprehensive</option>
                <option value="not_applicable">Not Applicable</option>
              </select>
            </div>
          </div>
        );

      case 'tax':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div style={{ 
              padding: spacing.sm, 
              backgroundColor: colors.neutral[50], 
              borderRadius: borderRadius.sm,
              marginBottom: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <label style={{ ...typography.label, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <input
                  type="checkbox"
                  checked={formData.show_tax ?? true}
                  onChange={(e) => updateField('show_tax', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Include Tax Details in Report</span>
              </label>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Tax Certificate Number</label>
              <input
                type="text"
                value={formData.tax_certificate_number || ''}
                onChange={(e) => updateField('tax_certificate_number', e.target.value)}
                style={{ ...cardStyles.input }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Paid Date</label>
                <input
                  type="date"
                  value={formData.tax_paid_date || ''}
                  onChange={(e) => updateField('tax_paid_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Valid Until</label>
                <input
                  type="date"
                  value={formData.tax_valid_until || ''}
                  onChange={(e) => updateField('tax_valid_until', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
            </div>
          </div>
        );

      case 'puc':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div style={{ 
              padding: spacing.sm, 
              backgroundColor: colors.neutral[50], 
              borderRadius: borderRadius.sm,
              marginBottom: spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <label style={{ ...typography.label, display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <input
                  type="checkbox"
                  checked={formData.show_puc ?? true}
                  onChange={(e) => updateField('show_puc', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Include PUC Certificate in Report</span>
              </label>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>PUC Certificate Number</label>
              <input
                type="text"
                value={formData.puc_certificate_number || ''}
                onChange={(e) => updateField('puc_certificate_number', e.target.value)}
                style={{ ...cardStyles.input }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Issue Date</label>
                <input
                  type="date"
                  value={formData.puc_issue_date || ''}
                  onChange={(e) => updateField('puc_issue_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Expiry Date</label>
                <input
                  type="date"
                  value={formData.puc_expiry_date || ''}
                  onChange={(e) => updateField('puc_expiry_date', e.target.value)}
                  style={{ ...cardStyles.input }}
                />
              </div>
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Status</label>
              <select
                value={formData.puc_status || 'pending'}
                onChange={(e) => updateField('puc_status', e.target.value)}
                style={{ ...cardStyles.input }}
              >
                <option value="valid">Valid</option>
                <option value="expired">Expired</option>
                <option value="pending">Pending</option>
                <option value="not_applicable">Not Applicable</option>
              </select>
            </div>
          </div>
        );

      case 'notes':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Verification Notes</label>
              <textarea
                value={formData.verification_notes || ''}
                onChange={(e) => updateField('verification_notes', e.target.value)}
                rows={5}
                placeholder="Add notes about the verification process..."
                style={{ ...cardStyles.input }}
              />
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Discrepancies</label>
              <textarea
                value={formData.discrepancies || ''}
                onChange={(e) => updateField('discrepancies', e.target.value)}
                rows={5}
                placeholder="Note any discrepancies found during verification..."
                style={{ ...cardStyles.input }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      onClose={onClose} 
      title="RTO Details Management" 
      size="xl" 
      showCloseButton={true}
      footer={
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving} icon={<Save size={16} />}>
            {saving ? 'Saving...' : 'Save RTO Details'}
          </Button>
        </div>
      }
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        minHeight: 0,
        maxHeight: 'calc(90vh - 140px)', // Account for header and footer
      }}>
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: spacing.xs, 
          marginBottom: spacing.lg, 
          borderBottom: `2px solid ${colors.neutral[200]}`,
          flexShrink: 0,
          overflowX: 'auto',
          paddingBottom: spacing.xs,
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  border: 'none',
                  borderBottom: activeTab === tab.id ? `3px solid ${colors.primary}` : '3px solid transparent',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  ...typography.body,
                  color: activeTab === tab.id ? colors.primary : colors.neutral[600],
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content - Scrollable */}
        {loading ? (
          <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.neutral[600] }}>
            Loading RTO details...
          </div>
        ) : (
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0, // Important for flex scrolling
            paddingRight: spacing.xs, // Space for scrollbar
          }}>
            {renderTabContent()}
          </div>
        )}
      </div>
    </Modal>
  );
};

