/**
 * Vehicle Inbound Form Section Component
 * Handles vehicle inbound-specific form fields
 */

import React from 'react';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { UnifiedVehicleSelector } from './UnifiedVehicleSelector';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import type { GatePassPurpose } from '../gatePassTypes';
import type { CreateGatePassFormData, FieldErrors } from '../hooks/useCreateGatePassForm';

interface VehicleInboundFormSectionProps {
  formData: CreateGatePassFormData;
  errors: FieldErrors;
  touched: Set<string>;
  expandedSections: Set<string>;
  purposeOptions: GatePassPurpose[];
  userYardId?: string;
  onFieldChange: (field: keyof CreateGatePassFormData, value: any) => void;
  onFieldBlur: (field: keyof CreateGatePassFormData) => void;
}

export const VehicleInboundFormSection: React.FC<VehicleInboundFormSectionProps> = ({
  formData,
  errors,
  touched,
  expandedSections,
  purposeOptions,
  userYardId,
  onFieldChange,
  onFieldBlur,
}) => {
  return (
    <div style={{ ...cardStyles.base, padding: spacing.xl, marginBottom: spacing.lg }}>
      <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
        Vehicle Information
      </h2>
      <p style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.md }}>
        Enter the vehicle registration number for a vehicle arriving at the facility. The system will search for an existing vehicle or allow you to create a new one.
      </p>
      
      {/* Required Field - Always Visible */}
      <div style={{ marginBottom: spacing.md }}>
        <UnifiedVehicleSelector
          mode="search-create"
          value={formData.vehicle_id || null}
          onChange={(id) => {
            onFieldChange('vehicle_id', id);
            onFieldBlur('vehicle_id');
          }}
          label="Vehicle Registration Number"
          required
          placeholder="Enter registration number (e.g., MH12AB1234)"
          yardId={formData.yard_id || userYardId}
          error={touched.has('vehicle_id') ? errors.vehicle_id : undefined}
        />
      </div>

      {/* Additional Details - Collapsible */}
      <CollapsibleSection
        id="inbound-additional-details"
        title="Additional Details"
        badge="Optional"
        defaultExpanded={false}
        forceExpanded={expandedSections.has('inbound-additional-details')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Purpose <span style={{ color: colors.error }}>*</span>
            </label>
            <select
              value={formData.purpose}
              onChange={(e) => onFieldChange('purpose', e.target.value as GatePassPurpose)}
              onBlur={() => onFieldBlur('purpose')}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: borderRadius.md,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
              }}
            >
              {purposeOptions.map(purpose => (
                <option key={purpose} value={purpose}>
                  {purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
            {touched.has('purpose') && errors.purpose && (
              <div style={{ color: colors.error, fontSize: '0.75rem', marginTop: spacing.xs }}>
                {errors.purpose}
              </div>
            )}
          </div>

          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => onFieldChange('notes', e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: borderRadius.md,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
      </CollapsibleSection>

      <p style={{ ...typography.bodySmall, color: colors.neutral[500], marginTop: spacing.md, fontStyle: 'italic' }}>
        Note: No driver details are required for vehicles entering the facility.
      </p>
    </div>
  );
};

