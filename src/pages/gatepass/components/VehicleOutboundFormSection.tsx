/**
 * Vehicle Outbound Form Section Component
 * Handles vehicle outbound-specific form fields
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { UnifiedVehicleSelector } from './UnifiedVehicleSelector';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { formatMobileNumber } from '@/lib/validation';
import type { GatePassPurpose } from '../gatePassTypes';
import type { CreateGatePassFormData, FieldErrors } from '../hooks/useCreateGatePassForm';

interface VehicleOutboundFormSectionProps {
  formData: CreateGatePassFormData;
  errors: FieldErrors;
  touched: Set<string>;
  expandedSections: Set<string>;
  purposeOptions: GatePassPurpose[];
  userYardId?: string;
  onFieldChange: (field: keyof CreateGatePassFormData, value: any) => void;
  onFieldBlur: (field: keyof CreateGatePassFormData) => void;
}

export const VehicleOutboundFormSection: React.FC<VehicleOutboundFormSectionProps> = ({
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
    <>
      {/* Vehicle Selection Section */}
      <div style={{ ...cardStyles.base, padding: spacing.xl, marginBottom: spacing.lg }}>
        <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
          Vehicle Selection
        </h2>
        <p style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.md }}>
          Select a vehicle from your yard inventory
        </p>
        
        <UnifiedVehicleSelector
          mode="single"
          value={formData.vehicle_id || null}
          onChange={(id) => {
            onFieldChange('vehicle_id', id);
            onFieldBlur('vehicle_id');
          }}
          label="Select Vehicle from Yard"
          required
          statusFilter="in_yard"
          yardId={formData.yard_id || userYardId}
          error={touched.has('vehicle_id') ? errors.vehicle_id : undefined}
        />
      </div>

      {/* Driver Details Section */}
      <div style={{ ...cardStyles.base, padding: spacing.xl, marginBottom: spacing.lg }}>
        <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
          Driver Details
        </h2>
        
        {/* Required Fields - Always Visible */}
        <div style={{ marginBottom: spacing.md }}>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
            Driver Name <span style={{ color: colors.error }}>*</span>
          </label>
          <Input
            type="text"
            value={formData.driver_name || ''}
            onChange={(e) => onFieldChange('driver_name', e.target.value)}
            onBlur={() => onFieldBlur('driver_name')}
            placeholder="Enter driver name"
            style={{ width: '100%' }}
          />
          {touched.has('driver_name') && errors.driver_name && (
            <div style={{ color: colors.error, fontSize: '0.75rem', marginTop: spacing.xs }}>
              {errors.driver_name}
            </div>
          )}
        </div>

        <div style={{ marginBottom: spacing.md }}>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
            Driver Contact <span style={{ color: colors.error }}>*</span>
          </label>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={formData.driver_contact || ''}
            onChange={(e) => onFieldChange('driver_contact', formatMobileNumber(e.target.value))}
            onBlur={() => onFieldBlur('driver_contact')}
            placeholder="10-digit mobile number"
            maxLength={10}
            style={{ width: '100%' }}
          />
          {touched.has('driver_contact') && errors.driver_contact && (
            <div style={{ color: colors.error, fontSize: '0.75rem', marginTop: spacing.xs }}>
              {errors.driver_contact}
            </div>
          )}
        </div>

        {/* Trip Details - Collapsible */}
        <CollapsibleSection
          id="outbound-trip-details"
          title="Trip Details"
          badge="Optional"
          defaultExpanded={false}
          forceExpanded={expandedSections.has('outbound-trip-details')}
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
                Destination
              </label>
              <Input
                type="text"
                value={formData.destination || ''}
                onChange={(e) => onFieldChange('destination', e.target.value)}
                placeholder="Where is the vehicle going?"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Driver License Number
              </label>
              <Input
                type="text"
                value={formData.driver_license_number || ''}
                onChange={(e) => onFieldChange('driver_license_number', e.target.value)}
                placeholder="Optional license number"
                style={{ width: '100%' }}
              />
            </div>

            <div 
              className="responsive-date-time-grid"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr', // Single column on mobile by default
                gap: spacing.md
              }}
            >
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  Expected Return Date
                </label>
                <Input
                  type="date"
                  value={formData.expected_return_date || ''}
                  onChange={(e) => onFieldChange('expected_return_date', e.target.value)}
                  style={{ width: '100%', fontSize: '16px' }} // 16px prevents iOS zoom
                />
              </div>
              <div>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  Expected Return Time
                </label>
                <Input
                  type="time"
                  value={formData.expected_return_time || ''}
                  onChange={(e) => onFieldChange('expected_return_time', e.target.value)}
                  style={{ width: '100%', fontSize: '16px' }} // 16px prevents iOS zoom
                />
              </div>
            </div>
            <style>{`
              @media (min-width: 768px) {
                .responsive-date-time-grid {
                  grid-template-columns: 1fr 1fr !important;
                }
              }
            `}</style>

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
      </div>
    </>
  );
};

