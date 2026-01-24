/**
 * Visitor Form Section Component
 * Handles all visitor-specific form fields
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { UnifiedVehicleSelector } from './UnifiedVehicleSelector';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { formatMobileNumber } from '@/lib/validation';
import type { GatePassPurpose } from '../gatePassTypes';
import type { CreateGatePassFormData, FieldErrors } from '../hooks/useCreateGatePassForm';

interface VisitorFormSectionProps {
  formData: CreateGatePassFormData;
  errors: FieldErrors;
  touched: Set<string>;
  expandedSections: Set<string>;
  purposeOptions: GatePassPurpose[];
  userYardId?: string;
  onFieldChange: (field: keyof CreateGatePassFormData, value: any) => void;
  onFieldBlur: (field: keyof CreateGatePassFormData) => void;
}

export const VisitorFormSection: React.FC<VisitorFormSectionProps> = ({
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
        Visitor Details
      </h2>
      
      <div style={{ marginBottom: spacing.md }}>
        <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
          Visitor Name <span style={{ color: colors.error }}>*</span>
        </label>
        <Input
          type="text"
          value={formData.visitor_name || ''}
          onChange={(e) => onFieldChange('visitor_name', e.target.value)}
          onBlur={() => onFieldBlur('visitor_name')}
          placeholder="Enter visitor name"
          style={{ width: '100%' }}
        />
        {touched.has('visitor_name') && errors.visitor_name && (
          <div style={{ color: colors.error, fontSize: '0.75rem', marginTop: spacing.xs }}>
            {errors.visitor_name}
          </div>
        )}
      </div>

      <div style={{ marginBottom: spacing.md }}>
        <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
          Visitor Phone <span style={{ color: colors.error }}>*</span>
        </label>
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={formData.visitor_phone || ''}
          onChange={(e) => onFieldChange('visitor_phone', formatMobileNumber(e.target.value))}
          onBlur={() => onFieldBlur('visitor_phone')}
          placeholder="10-digit mobile number"
          maxLength={10}
          style={{ width: '100%' }}
        />
        {touched.has('visitor_phone') && errors.visitor_phone && (
          <div style={{ color: colors.error, fontSize: '0.75rem', marginTop: spacing.xs }}>
            {errors.visitor_phone}
          </div>
        )}
      </div>

      {/* Required Fields - Always Visible */}
      <div style={{ marginBottom: spacing.md }}>
        <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
          Referred By <span style={{ color: colors.error }}>*</span>
        </label>
        <Input
          type="text"
          value={formData.referred_by || ''}
          onChange={(e) => onFieldChange('referred_by', e.target.value)}
          onBlur={() => onFieldBlur('referred_by')}
          placeholder="Who referred this visitor?"
          style={{ width: '100%' }}
        />
        {touched.has('referred_by') && errors.referred_by && (
          <div style={{ color: colors.error, fontSize: '0.75rem', marginTop: spacing.xs }}>
            {errors.referred_by}
          </div>
        )}
      </div>

      <div style={{ marginBottom: spacing.md }}>
        <UnifiedVehicleSelector
          mode="multiple"
          value={formData.vehicles_to_view || []}
          onChange={(ids) => {
            onFieldChange('vehicles_to_view', ids);
            onFieldBlur('vehicles_to_view');
          }}
          label="Vehicles to View"
          required
          minSelection={1}
          yardId={formData.yard_id || userYardId}
          error={touched.has('vehicles_to_view') ? errors.vehicles_to_view : undefined}
        />
      </div>

      {/* Additional Details - Collapsible */}
      <CollapsibleSection
        id="visitor-additional-details"
        title="Additional Details"
        badge="Optional"
        defaultExpanded={false}
        forceExpanded={expandedSections.has('visitor-additional-details')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Visitor Company
            </label>
            <Input
              type="text"
              value={formData.visitor_company || ''}
              onChange={(e) => onFieldChange('visitor_company', e.target.value)}
              placeholder="Optional company name"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Additional Visitors
            </label>
            <textarea
              value={formData.additional_visitors || ''}
              onChange={(e) => onFieldChange('additional_visitors', e.target.value)}
              placeholder="Names of additional visitors (optional)"
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

          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Additional Head Count
            </label>
            <Input
              type="number"
              value={formData.additional_head_count || ''}
              onChange={(e) => onFieldChange('additional_head_count', parseInt(e.target.value) || 0)}
              placeholder="0"
              min={0}
              style={{ width: '100%' }}
            />
          </div>

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
    </div>
  );
};

