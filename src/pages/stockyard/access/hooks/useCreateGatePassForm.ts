/**
 * Custom hook for Create Gate Pass form logic
 * Handles form state, validation, and submission
 */

import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/providers/useAuth';
import { validateMobileNumber, formatMobileNumber } from '@/lib/validation';
import type { GatePassType, GatePassPurpose, CreateGatePassData } from '../gatePassTypes';
import { getDefaultPurpose, getDefaultValidityDates } from '../config/defaults';

type PassIntentType = 'visitor' | 'vehicle_outbound' | 'vehicle_inbound' | null;

export interface CreateGatePassFormData {
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

export interface FieldErrors {
  [key: string]: string;
}

export function useCreateGatePassForm() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Step 1: Intent selection (defaults to visitor if no param)
  const [selectedIntent, setSelectedIntent] = useState<PassIntentType>('visitor');
  
  // Step 2: Form data with smart defaults
  const getInitialFormData = (passType: GatePassType = 'visitor'): CreateGatePassFormData => {
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

  const [formData, setFormData] = useState<CreateGatePassFormData>(getInitialFormData('visitor'));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Initialize from URL param or location state on mount
  useEffect(() => {
    // Priority 1: URL query param
    const typeParam = searchParams.get('type');
    if (typeParam) {
      const typeMap: Record<string, PassIntentType> = {
        'visitor': 'visitor',
        'outbound': 'vehicle_outbound',
        'inbound': 'vehicle_inbound',
      };
      const initialType = typeMap[typeParam] || 'visitor';
      setSelectedIntent(initialType);
      const passTypeMap: Record<PassIntentType, GatePassType> = {
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
      const intentMap: Record<GatePassType, PassIntentType> = {
        visitor: 'visitor',
        vehicle_outbound: 'vehicle_outbound',
        vehicle_inbound: 'vehicle_inbound',
      };
      const initialType = intentMap[state.passType] || 'visitor';
      setSelectedIntent(initialType);
      const passTypeMap: Record<PassIntentType, GatePassType> = {
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

  const updateField = (field: keyof CreateGatePassFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation: validate field if it's been touched or if it has an error
    if (touched.has(field) || errors[field]) {
      validateField(field, value);
    }
    
    // Clear error when field is updated (optimistic clearing)
    if (errors[field]) {
      // Don't clear immediately - let validateField decide
      // This prevents flickering while user is typing
    }
  };

  const handleBlur = (field: keyof CreateGatePassFormData) => {
    setTouched(prev => new Set(prev).add(field));
    validateField(field, formData[field]);
  };

  const validateField = (field: keyof CreateGatePassFormData, value: any): boolean => {
    const errorKey = field as string;
    
    // Clear error if field is valid
    const clearError = () => {
      setErrors(prev => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    };
    
    // Required field validation with helpful messages
    if (field === 'visitor_name' && formData.pass_type === 'visitor') {
      if (!value || !value.trim()) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: 'Visitor name is required. Example: John Doe' 
        }));
        return false;
      }
      if (value.trim().length < 2) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: 'Visitor name must be at least 2 characters long' 
        }));
        return false;
      }
      clearError();
      return true;
    }
    
    if (field === 'visitor_phone' && formData.pass_type === 'visitor') {
      if (!value || !value.trim()) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: 'Visitor phone is required. Example: 9876543210' 
        }));
        return false;
      }
      const validation = validateMobileNumber(value);
      if (!validation.isValid) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: validation.error || 'Invalid mobile number. Must be 10 digits (e.g., 9876543210)' 
        }));
        return false;
      }
      clearError();
      return true;
    }
    
    if (field === 'referred_by' && formData.pass_type === 'visitor') {
      if (!value || !value.trim()) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: 'Referred by is required. Enter the name of the person who referred this visitor' 
        }));
        return false;
      }
      clearError();
      return true;
    }
    
    if (field === 'vehicles_to_view' && formData.pass_type === 'visitor') {
      if (!value || value.length === 0) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: 'Please select at least one vehicle that the visitor wants to view' 
        }));
        return false;
      }
      clearError();
      return true;
    }
    
    if (field === 'vehicle_id' && (formData.pass_type === 'vehicle_inbound' || formData.pass_type === 'vehicle_outbound')) {
      if (!value) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: 'Vehicle selection is required. Search and select a vehicle from the list' 
        }));
        return false;
      }
      clearError();
      return true;
    }
    
    if (field === 'driver_name' && formData.pass_type === 'vehicle_outbound') {
      if (!value || !value.trim()) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: 'Driver name is required. Enter the full name of the driver' 
        }));
        return false;
      }
      if (value.trim().length < 2) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: 'Driver name must be at least 2 characters long' 
        }));
        return false;
      }
      clearError();
      return true;
    }
    
    if (field === 'driver_contact' && formData.pass_type === 'vehicle_outbound') {
      if (!value || !value.trim()) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: 'Driver contact is required. Example: 9876543210' 
        }));
        return false;
      }
      const validation = validateMobileNumber(value);
      if (!validation.isValid) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: validation.error || 'Invalid mobile number. Must be 10 digits (e.g., 9876543210)' 
        }));
        return false;
      }
      clearError();
      return true;
    }
    
    if (field === 'purpose') {
      if (!value) {
        setErrors(prev => ({ 
          ...prev, 
          [errorKey]: 'Purpose is required. Select the reason for this pass' 
        }));
        return false;
      }
      clearError();
      return true;
    }
    
    // If no validation rules match, clear any existing error
    clearError();
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
      if (!vehiclesToView || !Array.isArray(vehiclesToView) || vehiclesToView.length === 0) {
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

  const buildPayload = (): CreateGatePassData | null => {
    if (formData.pass_type === 'visitor') {
      // Validate vehicles are selected
      if (!formData.vehicles_to_view || formData.vehicles_to_view.length === 0) {
        return null;
      }

      // Normalize vehicles_to_view: ensure it's a plain array of string UUIDs
      const vehiclesToView = (formData.vehicles_to_view || [])
        .map(id => String(id))
        .filter(id => id.length > 0 && id !== 'undefined' && id !== 'null');

      return {
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
        yard_id: formData.yard_id || user?.yard_id,
      };
    } else {
      // Keep vehicle_id as string (UUID) - no conversion needed
      if (!formData.vehicle_id) {
        return null;
      }
      
      // Build payload - only include driver fields for outbound passes
      return {
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
        yard_id: formData.yard_id || user?.yard_id,
      };
    }
  };

  const handleIntentSelect = (intent: PassIntentType) => {
    if (!intent) return; // Safety check
    
    setSelectedIntent(intent);
    
    // Update URL query param
    const typeParamMap: Record<PassIntentType, string> = {
      visitor: 'visitor',
      vehicle_outbound: 'outbound',
      vehicle_inbound: 'inbound',
    };
    const newParams = new URLSearchParams(searchParams);
    newParams.set('type', typeParamMap[intent]);
    setSearchParams(newParams, { replace: true });
    
    const passTypeMap: Record<PassIntentType, GatePassType> = {
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

  return {
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
  };
}

