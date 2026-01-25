/**
 * Unified Create Access Pass Form (formerly Gate Pass)
 * 
 * Intent-based form that combines visitor and vehicle pass creation
 * Supports query param pre-selection: /create?type=visitor|outbound|inbound
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateGatePass } from '@/hooks/useGatePasses';
import { ValidityCustomizer } from './components/ValidityCustomizer';
import { VisitorFormSection } from './components/VisitorFormSection';
import { VehicleOutboundFormSection } from './components/VehicleOutboundFormSection';
import { VehicleInboundFormSection } from './components/VehicleInboundFormSection';
import { useAuth } from '@/providers/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { colors, typography, spacing, cardStyles } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useSmartKeyboard } from '@/hooks/useSmartKeyboard';
import { useUserRole } from './hooks/useUserRole';
import { useCreateGatePassForm } from './hooks/useCreateGatePassForm';
import type { GatePassType, GatePassPurpose } from './gatePassTypes';
import { emitAccessPassCreated } from '@/lib/workflow/eventEmitters';

export const CreateAccessPass: React.FC = () => {
  // Enable smart keyboard handling for mobile
  useSmartKeyboard({ enabled: true, scrollOffset: 100 });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const createPass = useCreateGatePass();
  const { permissions } = useUserRole();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use custom hook for form logic
  const {
    formData,
    errors,
    touched,
    expandedSections,
    selectedIntent,
    updateField,
    handleBlur,
    validateForm,
    buildPayload,
    handleIntentSelect,
  } = useCreateGatePassForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast({
        title: 'Authentication Required',
        description: 'Please log in to create a gate pass',
        variant: 'error',
      });
      navigate('/login');
      return;
    }

    if (!validateForm()) {
      showToast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'error',
      });
      return;
    }

    // Build payload using hook method
    const payload = buildPayload();
    if (!payload) {
      showToast({
        title: 'Validation Error',
        description: formData.pass_type === 'visitor' 
          ? 'Please select at least one vehicle to view'
          : 'Please select a vehicle',
        variant: 'error',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const newPass = await createPass.mutateAsync(payload);
      
      // Backend handles auto-approval automatically based on user permissions
      // Check if pass was auto-approved by backend
      const isAutoApproved = newPass.status === 'active';
      
      if (isAutoApproved) {
        showToast({
          title: 'Success',
          description: 'Pass created and auto-approved',
          variant: 'success',
        });
      } else {
        showToast({
          title: 'Success',
          description: 'Pass created successfully and is pending approval',
          variant: 'success',
        });
      }

      // Emit workflow event (don't block navigation if it fails)
      try {
        await emitAccessPassCreated(
          newPass.id,
          payload.pass_type,
          payload.vehicle_id,
          payload.visitor_id,
          user?.id?.toString()
        );
      } catch (error) {
        // Don't block navigation if event emission fails
        console.debug('Workflow event emission failed:', error);
      }
      
      // Show success toast with "Create Another" option
      const currentType = formData.pass_type;
      showToast({
        title: 'Pass Created Successfully!',
        description: isAutoApproved 
          ? `Pass #${newPass.pass_number} created and auto-approved`
          : `Pass #${newPass.pass_number} created and pending approval`,
        variant: 'success',
        duration: 6000,
        actionLabel: 'Create Another',
        onAction: () => {
          // Reset form but keep the same pass type
          Object.keys(formData).forEach((key) => {
            if (key !== 'pass_type') {
              updateField(key as any, '');
            }
          });
          // Navigate to create page with same type
          navigate(`/app/stockyard/access/create?type=${currentType}`, { replace: true });
        },
      });
      
      // Navigate to the created pass details page after a short delay
      // This allows user to see the toast and click "Create Another" if needed
      setTimeout(() => {
        navigate(`/app/stockyard/access/${newPass.id}`);
      }, 2500);
    } catch (error) {
      // Hook should handle via onError, but log for debugging
      console.error('Failed to create access pass:', error);
      // Hooks verified to have onError handlers that show toast notifications
    } finally {
      setIsSubmitting(false);
    }
  };

  // Purpose options for each pass type
  const purposeOptions: Record<GatePassType, GatePassPurpose[]> = {
    visitor: ['inspection', 'service', 'delivery', 'meeting', 'other'],
    vehicle_outbound: ['rto_work', 'sold', 'test_drive', 'service', 'auction', 'other'],
    vehicle_inbound: ['service', 'delivery', 'inspection', 'other'],
  };

  const currentPurposeOptions = formData.pass_type ? purposeOptions[formData.pass_type] : [];

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: spacing.xl,
      minHeight: '100dvh', // Use dynamic viewport height for mobile
      backgroundColor: colors.neutral[50],
    }}>
      <PageHeader
        title="Create Gate Pass"
        subtitle="Fill in the details below"
        icon="🚪"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
          { label: 'Gate Pass', path: '/app/gate-pass', icon: '🚪' },
          { label: 'Create', icon: '➕' },
        ]}
      />

      <form onSubmit={handleSubmit} style={{ marginTop: spacing.xl }}>
        {/* Pass Type Selector - Compact Toggle */}
        <div style={{ ...cardStyles.base, padding: spacing.lg, marginBottom: spacing.lg }}>
          <label style={{ ...typography.label, display: 'block', marginBottom: spacing.sm }}>
            Pass Type
          </label>
          <SegmentedControl
            options={[
              { value: 'visitor', label: '👥 Visitor' },
              { value: 'vehicle_outbound', label: '🚛 Vehicle Out' },
              { value: 'vehicle_inbound', label: '🚗 Vehicle In' },
            ]}
            value={selectedIntent}
            onChange={(value) => handleIntentSelect(value as 'visitor' | 'vehicle_outbound' | 'vehicle_inbound' | null)}
            fullWidth={true}
            size="md"
          />
        </div>
        {/* Visitor Details Section */}
        {formData.pass_type === 'visitor' && (
          <VisitorFormSection
            formData={formData}
            errors={errors}
            touched={touched}
            expandedSections={expandedSections}
            purposeOptions={currentPurposeOptions}
            userYardId={user?.yard_id}
            onFieldChange={updateField}
            onFieldBlur={handleBlur}
          />
        )}

        {/* Vehicle Outbound Section */}
        {formData.pass_type === 'vehicle_outbound' && (
          <VehicleOutboundFormSection
            formData={formData}
            errors={errors}
            touched={touched}
            expandedSections={expandedSections}
            purposeOptions={currentPurposeOptions}
            userYardId={user?.yard_id}
            onFieldChange={updateField}
            onFieldBlur={handleBlur}
          />
        )}

        {/* Vehicle Inbound Section */}
        {formData.pass_type === 'vehicle_inbound' && (
          <VehicleInboundFormSection
            formData={formData}
            errors={errors}
            touched={touched}
            expandedSections={expandedSections}
            purposeOptions={currentPurposeOptions}
            userYardId={user?.yard_id}
            onFieldChange={updateField}
            onFieldBlur={handleBlur}
          />
        )}

        {/* Validity Customizer Section */}
        <div style={{ ...cardStyles.base, padding: spacing.xl, marginBottom: spacing.lg }}>
          <h2 style={{ ...typography.subheader, marginBottom: spacing.lg }}>
            Validity Period
          </h2>
          
          <ValidityCustomizer
            validFrom={formData.valid_from ? new Date(formData.valid_from).toISOString() : new Date().toISOString()}
            validTo={formData.valid_to ? new Date(formData.valid_to).toISOString() : new Date().toISOString()}
            onValidFromChange={(value) => {
              // Convert ISO string to datetime-local format
              const date = new Date(value);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              updateField('valid_from', `${year}-${month}-${day}T${hours}:${minutes}`);
            }}
            onValidToChange={(value) => {
              // Convert ISO string to datetime-local format
              const date = new Date(value);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              updateField('valid_to', `${year}-${month}-${day}T${hours}:${minutes}`);
            }}
            passType={formData.pass_type!}
          />
        </div>

        {/* Submit Button(s) */}
        <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/app/gate-pass')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          {/* Show two buttons for users who can approve (yard in-charge, admins) */}
          {permissions.canApprovePasses ? (
            <>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Pass'}
              </Button>
            </>
          ) : (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
