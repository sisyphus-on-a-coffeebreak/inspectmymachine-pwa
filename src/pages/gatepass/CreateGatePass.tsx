/**
 * Unified Create Gate Pass Form
 * 
 * Intent-based form that combines visitor and vehicle pass creation
 * Supports query param pre-selection: /create?type=visitor|outbound|inbound
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
// Icons removed - no longer needed for intent selection screen
import { useCreateGatePass } from '@/hooks/useGatePasses';
import { UnifiedVehicleSelector } from './components/UnifiedVehicleSelector';
import { ValidityCustomizer } from './components/ValidityCustomizer';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { useAuth } from '@/providers/useAuth';
import { useToast } from '@/providers/ToastProvider';
import { validateMobileNumber, formatMobileNumber } from '@/lib/validation';
import type { GatePassType, GatePassPurpose, CreateGatePassData } from './gatePassTypes';
import { colors, typography, spacing, cardStyles, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { getDefaultPurpose, getDefaultValidityDates } from './config/defaults';
import { useSmartKeyboard } from '@/hooks/useSmartKeyboard';
import { useUserRole } from './hooks/useUserRole';
import { apiClient } from '@/lib/apiClient';

type IntentType = 'visitor' | 'vehicle_outbound' | 'vehicle_inbound' | null;

interface FormData {
  // Common fields
  pass_type: GatePassType | null;
  purpose: GatePassPurpose;
  valid_from: string;
  valid_to: string;
  yard_id?: string;
  notes?: string;
  
  // Visitor fields
  visitor_name?: string;
  visitor_phone?: string;
  visitor_company?: string;
  referred_by?: string;
  additional_visitors?: string;
  additional_head_count?: number;
  vehicles_to_view?: string[]; // Vehicle UUIDs
  
  // Vehicle fields
  vehicle_id?: string; // UUID
  driver_name?: string;
  driver_contact?: string;
  driver_license_number?: string;
  expected_return_date?: string;
  expected_return_time?: string;
  destination?: string;
}

interface FieldErrors {
  [key: string]: string;
}

export const CreateGatePass: React.FC = () => {
  // Enable smart keyboard handling for mobile
  useSmartKeyboard({ enabled: true, scrollOffset: 100 });
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const createPass = useCreateGatePass();
  const { permissions } = useUserRole();
  
  // Track submission type for "Create & Approve" feature
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Intent selection (defaults to visitor if no param)
  const [selectedIntent, setSelectedIntent] = useState<IntentType>('visitor');
  
  // Step 2: Form data with smart defaults
  const getInitialFormData = (passType: GatePassType = 'visitor'): FormData => {
    const defaults = getDefaultValidityDates(passType);
    return {
      pass_type: passType,
      purpose: getDefaultPurpose(passType),
      valid_from: defaults.validFrom,
      valid_to: defaults.validTo,
      notes: '',
      vehicles_to_view: passType === 'visitor' ? [] : undefined,
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData('visitor'));
  
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Initialize from URL param or location state on mount
  useEffect(() => {
    // Priority 1: URL query param
    const typeParam = searchParams.get('type');
    if (typeParam) {
      const typeMap: Record<string, IntentType> = {
        'visitor': 'visitor',
        'outbound': 'vehicle_outbound',
        'inbound': 'vehicle_inbound',
      };
      const initialType = typeMap[typeParam] || 'visitor';
      setSelectedIntent(initialType);
      const passTypeMap: Record<IntentType, GatePassType> = {
        visitor: 'visitor',
        vehicle_outbound: 'vehicle_outbound',
        vehicle_inbound: 'vehicle_inbound',
      };
      setFormData(prev => ({
        ...prev,
        pass_type: passTypeMap[initialType],
        vehicles_to_view: initialType === 'visitor' ? (prev.vehicles_to_view || []) : undefined,
      }));
      return;
    }
    
    // Priority 2: Location state (backward compatibility)
    const state = location.state as { passType?: GatePassType } | null;
    if (state?.passType) {
      const intentMap: Record<GatePassType, IntentType> = {
        visitor: 'visitor',
        vehicle_outbound: 'vehicle_outbound',
        vehicle_inbound: 'vehicle_inbound',
      };
      const initialType = intentMap[state.passType] || 'visitor';
      setSelectedIntent(initialType);
      const passTypeMap: Record<IntentType, GatePassType> = {
        visitor: 'visitor',
        vehicle_outbound: 'vehicle_outbound',
        vehicle_inbound: 'vehicle_inbound',
      };
      setFormData(prev => ({
        ...prev,
        pass_type: passTypeMap[initialType],
        vehicles_to_view: initialType === 'visitor' ? (prev.vehicles_to_view || []) : undefined,
      }));
    }
  }, [searchParams, location.state]);

  // Apply smart defaults when pass type changes
  useEffect(() => {
    if (formData.pass_type) {
      const defaults = getDefaultValidityDates(formData.pass_type);
      const defaultPurpose = getDefaultPurpose(formData.pass_type);
      
      setFormData(prev => ({
        ...prev,
        purpose: prev.purpose || defaultPurpose, // Only set if not already set
        valid_from: prev.valid_from || defaults.validFrom,
        valid_to: prev.valid_to || defaults.validTo,
      }));
    }
  }, [formData.pass_type]);

  const updateField = (field: keyof FormData, value: any) => {
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

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => new Set(prev).add(field));
    validateField(field, formData[field]);
  };

  const validateField = (field: keyof FormData, value: any): boolean => {
    const errorKey = field as string;
    
    // Required field validation
    if (field === 'visitor_name' && formData.pass_type === 'visitor') {
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, [errorKey]: 'Visitor name is required' }));
        return false;
      }
    }
    
    if (field === 'visitor_phone' && formData.pass_type === 'visitor') {
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, [errorKey]: 'Visitor phone is required' }));
        return false;
      }
      const validation = validateMobileNumber(value);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, [errorKey]: validation.error || 'Invalid mobile number' }));
        return false;
      }
    }
    
    if (field === 'referred_by' && formData.pass_type === 'visitor') {
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, [errorKey]: 'Referred by is required' }));
        return false;
      }
    }
    
    if (field === 'vehicles_to_view' && formData.pass_type === 'visitor') {
      if (!value || value.length === 0) {
        setErrors(prev => ({ ...prev, [errorKey]: 'Please select at least one vehicle' }));
        return false;
      }
    }
    
    if (field === 'vehicle_id' && (formData.pass_type === 'vehicle_inbound' || formData.pass_type === 'vehicle_outbound')) {
      if (!value) {
        setErrors(prev => ({ ...prev, [errorKey]: 'Vehicle selection is required' }));
        return false;
      }
    }
    
    if (field === 'driver_name' && formData.pass_type === 'vehicle_outbound') {
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, [errorKey]: 'Driver name is required' }));
        return false;
      }
    }
    
    if (field === 'driver_contact' && formData.pass_type === 'vehicle_outbound') {
      if (!value || !value.trim()) {
        setErrors(prev => ({ ...prev, [errorKey]: 'Driver contact is required' }));
        return false;
      }
      const validation = validateMobileNumber(value);
      if (!validation.isValid) {
        setErrors(prev => ({ ...prev, [errorKey]: validation.error || 'Invalid mobile number' }));
        return false;
      }
    }
    
    if (field === 'purpose') {
      if (!value) {
        setErrors(prev => ({ ...prev, [errorKey]: 'Purpose is required' }));
        return false;
      }
    }
    
    return true;
  };

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};
    let isValid = true;

    if (formData.pass_type === 'visitor') {
      if (!formData.visitor_name?.trim()) {
        newErrors.visitor_name = 'Visitor name is required';
        isValid = false;
      }
      if (!formData.visitor_phone?.trim()) {
        newErrors.visitor_phone = 'Visitor phone is required';
        isValid = false;
      } else {
        const validation = validateMobileNumber(formData.visitor_phone);
        if (!validation.isValid) {
          newErrors.visitor_phone = validation.error || 'Invalid mobile number';
          isValid = false;
        }
      }
      if (!formData.referred_by?.trim()) {
        newErrors.referred_by = 'Referred by is required';
        isValid = false;
      }
      // Check vehicles_to_view - ensure it's an array with at least one item
      const vehiclesToView = formData.vehicles_to_view;
      console.log('validateForm - checking vehicles_to_view:', {
        vehiclesToView,
        isArray: Array.isArray(vehiclesToView),
        length: vehiclesToView?.length,
        type: typeof vehiclesToView,
      });
      
      if (!vehiclesToView || !Array.isArray(vehiclesToView) || vehiclesToView.length === 0) {
        console.error('Validation failed - vehicles_to_view is empty or invalid');
        newErrors.vehicles_to_view = 'Please select at least one vehicle';
        isValid = false;
      }
    } else if (formData.pass_type === 'vehicle_outbound' || formData.pass_type === 'vehicle_inbound') {
      if (!formData.vehicle_id) {
        newErrors.vehicle_id = 'Vehicle selection is required';
        isValid = false;
      }
      if (formData.pass_type === 'vehicle_outbound') {
        if (!formData.driver_name?.trim()) {
          newErrors.driver_name = 'Driver name is required';
          isValid = false;
        }
        if (!formData.driver_contact?.trim()) {
          newErrors.driver_contact = 'Driver contact is required';
          isValid = false;
        } else {
          const validation = validateMobileNumber(formData.driver_contact);
          if (!validation.isValid) {
            newErrors.driver_contact = validation.error || 'Invalid mobile number';
            isValid = false;
          }
        }
      }
    }

    if (!formData.purpose) {
      newErrors.purpose = 'Purpose is required';
      isValid = false;
    }

    setErrors(newErrors);
    
    // Auto-expand sections with validation errors
    if (!isValid) {
      const sectionsToExpand = new Set<string>();
      if (newErrors.visitor_company || newErrors.additional_visitors || newErrors.additional_head_count) {
        sectionsToExpand.add('visitor-additional-details');
      }
      if (newErrors.purpose || newErrors.notes) {
        if (formData.pass_type === 'visitor') {
          sectionsToExpand.add('visitor-additional-details');
        } else if (formData.pass_type === 'vehicle_outbound') {
          sectionsToExpand.add('outbound-trip-details');
        } else {
          sectionsToExpand.add('inbound-additional-details');
        }
      }
      if (newErrors.destination || newErrors.driver_license_number || newErrors.expected_return_date) {
        sectionsToExpand.add('outbound-trip-details');
      }
      setExpandedSections(prev => new Set([...prev, ...sectionsToExpand]));
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent, autoApprove: boolean = false) => {
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

    // Build payload based on pass_type
    let payload: CreateGatePassData;

    if (formData.pass_type === 'visitor') {
      // Validate vehicles are selected
      if (!formData.vehicles_to_view || formData.vehicles_to_view.length === 0) {
        showToast({
          title: 'Validation Error',
          description: 'Please select at least one vehicle to view',
          variant: 'error',
        });
        return;
      }

      // Normalize vehicles_to_view: ensure it's a plain array of string UUIDs
      const vehiclesToView = (formData.vehicles_to_view || [])
        .map(id => String(id))
        .filter(id => id.length > 0 && id !== 'undefined' && id !== 'null');

      // Log payload for debugging
      console.log('[CreateGatePass] Payload before send:', {
        pass_type: 'visitor',
        vehicles_to_view: vehiclesToView,
        vehicles_to_view_type: typeof vehiclesToView,
        vehicles_to_view_isArray: Array.isArray(vehiclesToView),
        vehicles_to_view_length: vehiclesToView.length,
      });

      payload = {
        pass_type: 'visitor',
        visitor_name: formData.visitor_name!,
        visitor_phone: formatMobileNumber(formData.visitor_phone!),
        visitor_company: formData.visitor_company,
        referred_by: formData.referred_by!,
        vehicles_to_view: vehiclesToView,
        purpose: formData.purpose,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_to: new Date(formData.valid_to).toISOString(),
        additional_visitors: formData.additional_visitors,
        additional_head_count: formData.additional_head_count,
        notes: formData.notes,
        yard_id: formData.yard_id || user.yard_id,
      };
    } else {
      // Keep vehicle_id as string (UUID) - no conversion needed
      if (!formData.vehicle_id) {
        showToast({
          title: 'Validation Error',
          description: 'Please select a vehicle',
          variant: 'error',
        });
        return;
      }
      
      // Build payload - only include driver fields for outbound passes
      payload = {
        pass_type: formData.pass_type!,
        vehicle_id: String(formData.vehicle_id),
        purpose: formData.purpose,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_to: new Date(formData.valid_to).toISOString(),
        // Driver details only for outbound passes
        ...(formData.pass_type === 'vehicle_outbound' && {
          driver_name: formData.driver_name,
          driver_contact: formData.driver_contact ? formatMobileNumber(formData.driver_contact) : undefined,
          driver_license_number: formData.driver_license_number,
          expected_return_date: formData.expected_return_date,
          expected_return_time: formData.expected_return_time,
          destination: formData.destination,
        }),
        notes: formData.notes,
        yard_id: formData.yard_id || user.yard_id,
      };
    }

    try {
      setIsSubmitting(true);
      const newPass = await createPass.mutateAsync(payload);
      
      // If autoApprove is requested and user has approval capability, approve it immediately
      if (autoApprove && permissions.canApprovePasses) {
        try {
          await apiClient.post(`/gate-pass-approval/approve/${newPass.id}`, {
            notes: 'Auto-approved during creation'
          });
          
          showToast({
            title: 'Success',
            description: 'Pass created and approved successfully',
            variant: 'success',
          });
        } catch (approvalError) {
          console.error('[CreateGatePass] Auto-approval failed:', approvalError);
          // Still navigate to the pass, but show warning
          showToast({
            title: 'Pass Created',
            description: 'Pass was created but auto-approval failed. You can approve it manually.',
            variant: 'warning',
          });
        }
      }
      
      navigate(`/app/gate-pass/${newPass.id}`);
    } catch {
      // Error is handled by the mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIntentSelect = (intent: IntentType) => {
    if (!intent) return; // Safety check
    
    setSelectedIntent(intent);
    
    // Update URL query param
    const typeParamMap: Record<IntentType, string> = {
      visitor: 'visitor',
      vehicle_outbound: 'outbound',
      vehicle_inbound: 'inbound',
    };
    const newParams = new URLSearchParams(searchParams);
    newParams.set('type', typeParamMap[intent]);
    setSearchParams(newParams, { replace: true });
    
    const passTypeMap: Record<IntentType, GatePassType> = {
      visitor: 'visitor',
      vehicle_outbound: 'vehicle_outbound',
      vehicle_inbound: 'vehicle_inbound',
    };
    setFormData(prev => ({
      ...prev,
      pass_type: passTypeMap[intent],
      purpose: intent === 'visitor' ? 'inspection' : intent === 'vehicle_outbound' ? 'rto_work' : 'service',
      // Initialize vehicles_to_view for visitor passes
      vehicles_to_view: intent === 'visitor' ? (prev.vehicles_to_view || []) : undefined,
      // Clear vehicle_id for vehicle passes if switching from visitor
      vehicle_id: (intent === 'vehicle_outbound' || intent === 'vehicle_inbound') ? (prev.vehicle_id || undefined) : undefined,
    }));
    setErrors({});
  };

  // Form with inline type selector
  const purposeOptions: Record<GatePassType, GatePassPurpose[]> = {
    visitor: ['inspection', 'service', 'delivery', 'meeting', 'other'],
    vehicle_outbound: ['rto_work', 'sold', 'test_drive', 'service', 'auction', 'other'],
    vehicle_inbound: ['service', 'delivery', 'inspection', 'other'],
  };

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
            onChange={(value) => handleIntentSelect(value as IntentType)}
            fullWidth={true}
            size="md"
          />
        </div>
        {/* Visitor Details Section */}
        {formData.pass_type === 'visitor' && (
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
                onChange={(e) => updateField('visitor_name', e.target.value)}
                onBlur={() => handleBlur('visitor_name')}
                placeholder="Enter visitor name"
                style={{ width: '100%' }}
              />
              {touched.visitor_name && errors.visitor_name && (
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
                onChange={(e) => updateField('visitor_phone', formatMobileNumber(e.target.value))}
                onBlur={() => handleBlur('visitor_phone')}
                placeholder="10-digit mobile number"
                maxLength={10}
                style={{ width: '100%' }}
              />
              {touched.visitor_phone && errors.visitor_phone && (
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
                onChange={(e) => updateField('referred_by', e.target.value)}
                onBlur={() => handleBlur('referred_by')}
                placeholder="Who referred this visitor?"
                style={{ width: '100%' }}
              />
              {touched.referred_by && errors.referred_by && (
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
                  updateField('vehicles_to_view', ids);
                  setTouched(prev => new Set(prev).add('vehicles_to_view'));
                }}
                label="Vehicles to View"
                required
                minSelection={1}
                yardId={formData.yard_id || user?.yard_id}
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
                    onChange={(e) => updateField('visitor_company', e.target.value)}
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
                    onChange={(e) => updateField('additional_visitors', e.target.value)}
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
                    onChange={(e) => updateField('additional_head_count', parseInt(e.target.value) || 0)}
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
                    onChange={(e) => updateField('purpose', e.target.value as GatePassPurpose)}
                    onBlur={() => handleBlur('purpose')}
                    style={{
                      width: '100%',
                      padding: spacing.sm,
                      border: '1px solid #D1D5DB',
                      borderRadius: borderRadius.md,
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    {purposeOptions[formData.pass_type!].map(purpose => (
                      <option key={purpose} value={purpose}>
                        {purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  {touched.purpose && errors.purpose && (
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
                    onChange={(e) => updateField('notes', e.target.value)}
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
        )}

        {/* Vehicle Selection Section */}
        {formData.pass_type === 'vehicle_outbound' && (
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
                updateField('vehicle_id', id);
                setTouched(prev => new Set(prev).add('vehicle_id'));
              }}
              label="Select Vehicle from Yard"
              required
              statusFilter="in_yard"
              yardId={formData.yard_id || user?.yard_id}
              error={touched.has('vehicle_id') ? errors.vehicle_id : undefined}
            />
          </div>
        )}

        {/* Vehicle Entry Section (Vehicle Inbound) */}
        {formData.pass_type === 'vehicle_inbound' && (
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
                  updateField('vehicle_id', id);
                  setTouched(prev => new Set(prev).add('vehicle_id'));
                }}
                label="Vehicle Registration Number"
                required
                placeholder="Enter registration number (e.g., MH12AB1234)"
                yardId={formData.yard_id || user?.yard_id}
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
                    onChange={(e) => updateField('purpose', e.target.value as GatePassPurpose)}
                    onBlur={() => handleBlur('purpose')}
                    style={{
                      width: '100%',
                      padding: spacing.sm,
                      border: '1px solid #D1D5DB',
                      borderRadius: borderRadius.md,
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    {purposeOptions[formData.pass_type!].map(purpose => (
                      <option key={purpose} value={purpose}>
                        {purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  {touched.purpose && errors.purpose && (
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
                    onChange={(e) => updateField('notes', e.target.value)}
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
        )}

        {/* Driver Details Section (Vehicle Outbound only) */}
        {formData.pass_type === 'vehicle_outbound' && (
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
                onChange={(e) => updateField('driver_name', e.target.value)}
                onBlur={() => handleBlur('driver_name')}
                placeholder="Enter driver name"
                style={{ width: '100%' }}
              />
              {touched.driver_name && errors.driver_name && (
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
                onChange={(e) => updateField('driver_contact', formatMobileNumber(e.target.value))}
                onBlur={() => handleBlur('driver_contact')}
                placeholder="10-digit mobile number"
                maxLength={10}
                style={{ width: '100%' }}
              />
              {touched.driver_contact && errors.driver_contact && (
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
                    onChange={(e) => updateField('purpose', e.target.value as GatePassPurpose)}
                    onBlur={() => handleBlur('purpose')}
                    style={{
                      width: '100%',
                      padding: spacing.sm,
                      border: '1px solid #D1D5DB',
                      borderRadius: borderRadius.md,
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                    }}
                  >
                    {purposeOptions[formData.pass_type!].map(purpose => (
                      <option key={purpose} value={purpose}>
                        {purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  {touched.purpose && errors.purpose && (
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
                    onChange={(e) => updateField('destination', e.target.value)}
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
                    onChange={(e) => updateField('driver_license_number', e.target.value)}
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
                      onChange={(e) => updateField('expected_return_date', e.target.value)}
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
                      onChange={(e) => updateField('expected_return_time', e.target.value)}
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
                    onChange={(e) => updateField('notes', e.target.value)}
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
                type="button"
                variant="secondary"
                onClick={(e) => handleSubmit(e, false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Only'}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Create & Approve'}
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
