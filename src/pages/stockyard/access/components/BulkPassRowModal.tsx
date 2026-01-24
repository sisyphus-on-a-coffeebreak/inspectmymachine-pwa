/**
 * Bulk Pass Row Modal Component
 * 
 * Modal form for editing a single row in bulk pass creation
 * Provides full space for complex fields like vehicle selection
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/FormField';
import { UnifiedVehicleSelector } from './UnifiedVehicleSelector';
import { validateMobileNumber, formatMobileNumber } from '@/lib/validation';
import { colors, spacing, borderRadius } from '@/lib/theme';
import type { GatePassType, GatePassPurpose } from '../gatePassTypes';
import { XCircle, CheckCircle } from 'lucide-react';

// Format datetime-local input value (YYYY-MM-DDTHH:mm) - handles timezone correctly
const formatForDateTimeLocal = (value: string | undefined): string => {
  if (!value) return '';
  
  // If already in datetime-local format (YYYY-MM-DDTHH:mm), return as is
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  
  // If it's an ISO string or other date format, parse it
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    
    // Get local date components (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

// Parse datetime-local input to keep it as local time string (no timezone conversion)
const parseFromDateTimeLocal = (value: string): string => {
  if (!value) return '';
  // Keep as datetime-local format - don't convert to ISO/UTC
  // The backend should handle this format or we'll convert on submit
  return value;
};

interface BulkPassRowModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: Record<string, unknown>;
  passType: GatePassType;
  yardId?: string;
  errors: Record<string, string>;
  touched: Set<string>;
  onSave: (data: Record<string, unknown>) => void;
  rowIndex: number;
}

// Purpose options based on pass type
const purposeOptions: Record<GatePassType, GatePassPurpose[]> = {
  visitor: ['inspection', 'service', 'delivery', 'meeting', 'other'],
  vehicle_outbound: ['rto_work', 'sold', 'test_drive', 'service', 'auction', 'other'],
  vehicle_inbound: ['service', 'delivery', 'inspection', 'other'],
};

export const BulkPassRowModal: React.FC<BulkPassRowModalProps> = ({
  isOpen,
  onClose,
  rowData: initialData,
  passType,
  yardId,
  errors,
  touched,
  onSave,
  rowIndex,
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData || {});
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [localTouched, setLocalTouched] = useState<Set<string>>(new Set());

  // Sync with parent data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
      setLocalErrors(errors || {});
      setLocalTouched(touched || new Set());
    }
    // Only sync when modal opens, not when errors/touched change (they're recreated on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setLocalTouched(prev => new Set([...prev, field]));
    
    // Clear error when user starts typing
    if (localErrors[field]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateField = (field: string, value: unknown): string | undefined => {
    // Phone validation
    if (field === 'visitor_phone' || field === 'driver_contact') {
      const cleanValue = String(value || '').replace(/\D/g, '');
      const validation = validateMobileNumber(cleanValue);
      if (cleanValue && !validation.isValid) {
        return validation.error || 'Phone must be 10 digits between 6000000000 and 9999999999';
      }
    }
    
    // Date validation
        if (field === 'valid_to' && formData.valid_from) {
          const fromDate = new Date(String(formData.valid_from));
          const toDate = new Date(String(value));
      if (toDate < fromDate) {
        return 'Valid To must be after Valid From';
      }
    }
    
    return undefined;
  };

  const handleBlur = (field: string) => {
    const value = formData[field];
    const error = validateField(field, value);
    if (error) {
      setLocalErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSave = () => {
    // Validate all required fields
    const newErrors: Record<string, string> = {};
    const requiredFields: string[] = [];
    
    if (passType === 'visitor') {
      requiredFields.push('visitor_name', 'visitor_phone', 'referred_by', 'purpose', 'valid_from', 'valid_to');
    } else if (passType === 'vehicle_outbound') {
      requiredFields.push('vehicle_id', 'driver_name', 'driver_contact', 'destination', 'purpose', 'valid_from', 'valid_to');
    } else if (passType === 'vehicle_inbound') {
      requiredFields.push('vehicle_registration', 'purpose', 'valid_from', 'valid_to');
    }
    
    requiredFields.forEach(field => {
      const value = formData[field];
      if (!value || (typeof value === 'string' && !value.trim())) {
        newErrors[field] = `${field.replace(/_/g, ' ')} is required`;
      } else {
        const fieldError = validateField(field, value);
        if (fieldError) {
          newErrors[field] = fieldError;
        }
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setLocalErrors(newErrors);
      setLocalTouched(new Set(requiredFields));
      return;
    }
    
    onSave(formData);
    onClose();
  };

  const hasErrors = Object.keys(localErrors).length > 0;
  const isValid = !hasErrors;

  return (
    <Modal
      title={`Edit Row ${rowIndex + 1} - ${passType === 'visitor' ? 'Visitor Pass' : passType === 'vehicle_outbound' ? 'Vehicle Outbound' : 'Vehicle Inbound'}`}
      onClose={onClose}
      size="lg"
      disableFailsafe={true}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            {isValid ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, color: colors.success[600] }}>
                <CheckCircle size={16} />
                <span style={{ fontSize: '0.875rem' }}>Valid</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, color: colors.error[600] }}>
                <XCircle size={16} />
                <span style={{ fontSize: '0.875rem' }}>{Object.keys(localErrors).length} error(s)</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!isValid}>
              Save Row
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {/* Visitor Pass Form */}
        {passType === 'visitor' && (
          <>
            <FormField
              label="Visitor Name"
              required
              error={localTouched.has('visitor_name') ? localErrors.visitor_name : undefined}
              touched={localTouched.has('visitor_name')}
              isValid={!localErrors.visitor_name && !!formData.visitor_name}
            >
              <Input
                type="text"
                value={String(formData.visitor_name || '')}
                onChange={(e) => updateField('visitor_name', e.target.value)}
                onBlur={() => handleBlur('visitor_name')}
                placeholder="Enter visitor name"
              />
            </FormField>

            <FormField
              label="Phone Number"
              required
              error={localTouched.has('visitor_phone') ? localErrors.visitor_phone : undefined}
              touched={localTouched.has('visitor_phone')}
              isValid={!localErrors.visitor_phone && !!formData.visitor_phone}
              helperText="10 digits between 6000000000 and 9999999999"
            >
              <Input
                type="tel"
                value={formatMobileNumber(String(formData.visitor_phone || ''))}
                onChange={(e) => updateField('visitor_phone', formatMobileNumber(e.target.value))}
                onBlur={() => handleBlur('visitor_phone')}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </FormField>

            <FormField
              label="Referred By"
              required
              error={localTouched.has('referred_by') ? localErrors.referred_by : undefined}
              touched={localTouched.has('referred_by')}
              isValid={!localErrors.referred_by && !!formData.referred_by}
            >
              <Input
                type="text"
                value={String(formData.referred_by || '')}
                onChange={(e) => updateField('referred_by', e.target.value)}
                onBlur={() => handleBlur('referred_by')}
                placeholder="Who referred this visitor?"
              />
            </FormField>

            <FormField
              label="Company"
              error={localTouched.has('visitor_company') ? localErrors.visitor_company : undefined}
              touched={localTouched.has('visitor_company')}
            >
              <Input
                type="text"
                value={String(formData.visitor_company || '')}
                onChange={(e) => updateField('visitor_company', e.target.value)}
                placeholder="Visitor's company (optional)"
              />
            </FormField>

            <FormField
              label="Vehicles to View"
              error={localTouched.has('vehicles_to_view') ? localErrors.vehicles_to_view : undefined}
              touched={localTouched.has('vehicles_to_view')}
              helperText="Select vehicles the visitor can view (optional)"
            >
              <UnifiedVehicleSelector
                mode="multiple"
                value={Array.isArray(formData.vehicles_to_view) ? formData.vehicles_to_view : (formData.vehicles_to_view ? [formData.vehicles_to_view] : null)}
                onChange={(ids) => {
                  const vehicleIds = Array.isArray(ids) ? ids : (ids ? [ids] : []);
                  updateField('vehicles_to_view', vehicleIds);
                }}
                label=""
                statusFilter="all"
                yardId={yardId}
                placeholder="Select vehicles..."
                minSelection={0}
              />
            </FormField>

            <FormField
              label="Purpose"
              required
              error={localTouched.has('purpose') ? localErrors.purpose : undefined}
              touched={localTouched.has('purpose')}
              isValid={!localErrors.purpose && !!formData.purpose}
            >
              <select
                value={String(formData.purpose || '')}
                onChange={(e) => updateField('purpose', e.target.value)}
                onBlur={() => handleBlur('purpose')}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: localTouched.has('purpose') && localErrors.purpose 
                    ? `2px solid ${colors.error[500]}` 
                    : `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  backgroundColor: localTouched.has('purpose') && localErrors.purpose 
                    ? colors.error[50] 
                    : 'white',
                }}
              >
                <option value="">Select purpose...</option>
                {purposeOptions.visitor.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <FormField
                label="Valid From"
                required
                error={localTouched.has('valid_from') ? localErrors.valid_from : undefined}
                touched={localTouched.has('valid_from')}
                isValid={!localErrors.valid_from && !!formData.valid_from}
              >
                <Input
                  type="datetime-local"
                  value={formatForDateTimeLocal(String(formData.valid_from || ''))}
                  onChange={(e) => updateField('valid_from', parseFromDateTimeLocal(e.target.value))}
                  onBlur={() => handleBlur('valid_from')}
                />
              </FormField>

              <FormField
                label="Valid To"
                required
                error={localTouched.has('valid_to') ? localErrors.valid_to : undefined}
                touched={localTouched.has('valid_to')}
                isValid={!localErrors.valid_to && !!formData.valid_to}
              >
                <Input
                  type="datetime-local"
                  value={formatForDateTimeLocal(String(formData.valid_to || ''))}
                  onChange={(e) => updateField('valid_to', parseFromDateTimeLocal(e.target.value))}
                  onBlur={() => handleBlur('valid_to')}
                />
              </FormField>
            </div>

            <FormField
              label="Notes"
              error={localTouched.has('notes') ? localErrors.notes : undefined}
              touched={localTouched.has('notes')}
            >
              <textarea
                value={String(formData.notes || '')}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Additional notes (optional)"
                rows={3}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                }}
              />
            </FormField>
          </>
        )}

        {/* Vehicle Outbound Form */}
        {passType === 'vehicle_outbound' && (
          <>
            <FormField
              label="Vehicle (from Yard)"
              required
              error={localTouched.has('vehicle_id') ? localErrors.vehicle_id : undefined}
              touched={localTouched.has('vehicle_id')}
              isValid={!localErrors.vehicle_id && !!formData.vehicle_id}
              helperText="Select a vehicle currently in the yard"
            >
              <UnifiedVehicleSelector
                mode="single"
                value={(formData.vehicle_id as string | null) || null}
                onChange={(id) => updateField('vehicle_id', id)}
                label=""
                required
                statusFilter="in_yard"
                yardId={yardId}
                placeholder="Select vehicle from yard..."
              />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <FormField
                label="Driver Name"
                required
                error={localTouched.has('driver_name') ? localErrors.driver_name : undefined}
                touched={localTouched.has('driver_name')}
                isValid={!localErrors.driver_name && !!formData.driver_name}
              >
                <Input
                  type="text"
                  value={String(formData.driver_name || '')}
                  onChange={(e) => updateField('driver_name', e.target.value)}
                  onBlur={() => handleBlur('driver_name')}
                  placeholder="Enter driver name"
                />
              </FormField>

              <FormField
                label="Driver Contact"
                required
                error={localTouched.has('driver_contact') ? localErrors.driver_contact : undefined}
                touched={localTouched.has('driver_contact')}
                isValid={!localErrors.driver_contact && !!formData.driver_contact}
                helperText="10 digits between 6000000000 and 9999999999"
              >
                <Input
                  type="tel"
                  value={formatMobileNumber(String(formData.driver_contact || ''))}
                  onChange={(e) => updateField('driver_contact', formatMobileNumber(e.target.value))}
                  onBlur={() => handleBlur('driver_contact')}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </FormField>
            </div>

            <FormField
              label="Destination"
              required
              error={localTouched.has('destination') ? localErrors.destination : undefined}
              touched={localTouched.has('destination')}
              isValid={!localErrors.destination && !!formData.destination}
            >
              <Input
                type="text"
                value={String(formData.destination || '')}
                onChange={(e) => updateField('destination', e.target.value)}
                onBlur={() => handleBlur('destination')}
                placeholder="Where is the vehicle going?"
              />
            </FormField>

            <FormField
              label="Purpose"
              required
              error={localTouched.has('purpose') ? localErrors.purpose : undefined}
              touched={localTouched.has('purpose')}
              isValid={!localErrors.purpose && !!formData.purpose}
            >
              <select
                value={String(formData.purpose || '')}
                onChange={(e) => updateField('purpose', e.target.value)}
                onBlur={() => handleBlur('purpose')}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: localTouched.has('purpose') && localErrors.purpose 
                    ? `2px solid ${colors.error[500]}` 
                    : `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  backgroundColor: localTouched.has('purpose') && localErrors.purpose 
                    ? colors.error[50] 
                    : 'white',
                }}
              >
                <option value="">Select purpose...</option>
                {purposeOptions.vehicle_outbound.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <FormField
                label="Valid From"
                required
                error={localTouched.has('valid_from') ? localErrors.valid_from : undefined}
                touched={localTouched.has('valid_from')}
                isValid={!localErrors.valid_from && !!formData.valid_from}
              >
                <Input
                  type="datetime-local"
                  value={formatForDateTimeLocal(String(formData.valid_from || ''))}
                  onChange={(e) => updateField('valid_from', parseFromDateTimeLocal(e.target.value))}
                  onBlur={() => handleBlur('valid_from')}
                />
              </FormField>

              <FormField
                label="Valid To"
                required
                error={localTouched.has('valid_to') ? localErrors.valid_to : undefined}
                touched={localTouched.has('valid_to')}
                isValid={!localErrors.valid_to && !!formData.valid_to}
              >
                <Input
                  type="datetime-local"
                  value={formatForDateTimeLocal(String(formData.valid_to || ''))}
                  onChange={(e) => updateField('valid_to', parseFromDateTimeLocal(e.target.value))}
                  onBlur={() => handleBlur('valid_to')}
                />
              </FormField>
            </div>

            <FormField
              label="Expected Return Date"
              error={localTouched.has('expected_return_date') ? localErrors.expected_return_date : undefined}
              touched={localTouched.has('expected_return_date')}
            >
              <Input
                type="date"
                value={String(formData.expected_return_date || '')}
                onChange={(e) => updateField('expected_return_date', e.target.value)}
                placeholder="Optional return date"
              />
            </FormField>

            <FormField
              label="Notes"
              error={localTouched.has('notes') ? localErrors.notes : undefined}
              touched={localTouched.has('notes')}
            >
              <textarea
                value={String(formData.notes || '')}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Additional notes (optional)"
                rows={3}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                }}
              />
            </FormField>
          </>
        )}

        {/* Vehicle Inbound Form */}
        {passType === 'vehicle_inbound' && (
          <>
            <FormField
              label="Vehicle Registration"
              required
              error={localTouched.has('vehicle_registration') ? localErrors.vehicle_registration : undefined}
              touched={localTouched.has('vehicle_registration')}
              isValid={!localErrors.vehicle_registration && !!formData.vehicle_registration}
            >
              <Input
                type="text"
                value={String(formData.vehicle_registration || '')}
                onChange={(e) => updateField('vehicle_registration', e.target.value.toUpperCase())}
                onBlur={() => handleBlur('vehicle_registration')}
                placeholder="Enter vehicle registration number"
              />
            </FormField>

            <FormField
              label="Purpose"
              required
              error={localTouched.has('purpose') ? localErrors.purpose : undefined}
              touched={localTouched.has('purpose')}
              isValid={!localErrors.purpose && !!formData.purpose}
            >
              <select
                value={String(formData.purpose || '')}
                onChange={(e) => updateField('purpose', e.target.value)}
                onBlur={() => handleBlur('purpose')}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: localTouched.has('purpose') && localErrors.purpose 
                    ? `2px solid ${colors.error[500]}` 
                    : `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  backgroundColor: localTouched.has('purpose') && localErrors.purpose 
                    ? colors.error[50] 
                    : 'white',
                }}
              >
                <option value="">Select purpose...</option>
                {purposeOptions.vehicle_inbound.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <FormField
                label="Valid From"
                required
                error={localTouched.has('valid_from') ? localErrors.valid_from : undefined}
                touched={localTouched.has('valid_from')}
                isValid={!localErrors.valid_from && !!formData.valid_from}
              >
                <Input
                  type="datetime-local"
                  value={formatForDateTimeLocal(String(formData.valid_from || ''))}
                  onChange={(e) => updateField('valid_from', parseFromDateTimeLocal(e.target.value))}
                  onBlur={() => handleBlur('valid_from')}
                />
              </FormField>

              <FormField
                label="Valid To"
                required
                error={localTouched.has('valid_to') ? localErrors.valid_to : undefined}
                touched={localTouched.has('valid_to')}
                isValid={!localErrors.valid_to && !!formData.valid_to}
              >
                <Input
                  type="datetime-local"
                  value={formatForDateTimeLocal(String(formData.valid_to || ''))}
                  onChange={(e) => updateField('valid_to', parseFromDateTimeLocal(e.target.value))}
                  onBlur={() => handleBlur('valid_to')}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
              <FormField
                label="Driver Name"
                error={localTouched.has('driver_name') ? localErrors.driver_name : undefined}
                touched={localTouched.has('driver_name')}
              >
                <Input
                  type="text"
                  value={String(formData.driver_name || '')}
                  onChange={(e) => updateField('driver_name', e.target.value)}
                  placeholder="Driver name (optional)"
                />
              </FormField>

              <FormField
                label="Driver Contact"
                error={localTouched.has('driver_contact') ? localErrors.driver_contact : undefined}
                touched={localTouched.has('driver_contact')}
                helperText="10 digits between 6000000000 and 9999999999"
              >
                <Input
                  type="tel"
                  value={formatMobileNumber(String(formData.driver_contact || ''))}
                  onChange={(e) => updateField('driver_contact', formatMobileNumber(e.target.value))}
                  placeholder="Driver contact (optional)"
                  maxLength={10}
                />
              </FormField>
            </div>

            <FormField
              label="Notes"
              error={localTouched.has('notes') ? localErrors.notes : undefined}
              touched={localTouched.has('notes')}
            >
              <textarea
                value={String(formData.notes || '')}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Additional notes, condition, components, etc. (optional)"
                rows={4}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                }}
              />
            </FormField>
          </>
        )}
      </div>
    </Modal>
  );
};

