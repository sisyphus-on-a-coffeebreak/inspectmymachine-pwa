import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { VehicleSelector } from './components/VehicleSelector';
import type { VisitorPassFormData } from './gatePassTypes';
import { useAuth } from '../../providers/useAuth';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';
import { validateMobileNumber, formatMobileNumber, formatMobileDisplay } from '../../lib/validation';

// 👥 Create Visitor Pass Form
// Mobile-first form for creating visitor gate passes
// Used when clients come to inspect vehicles

export const CreateVisitorPass: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { confirm, ConfirmComponent } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [mobileError, setMobileError] = useState<string>('');
  const [formData, setFormData] = useState<VisitorPassFormData>({
    primary_visitor_name: '',
    additional_visitors: '',
    additional_head_count: 0,
    referred_by: '',
    contact_number: '',
    selected_vehicle_ids: [],
    purpose: 'inspection',
    expected_date: new Date().toISOString().split('T')[0],
    expected_time: '11:00',
    notes: ''
  });
  const [templateDuration, setTemplateDuration] = useState<number | null>(null); // Duration in minutes
  const [customDuration, setCustomDuration] = useState<{ hours: number; minutes: number }>({ hours: 2, minutes: 0 }); // Custom duration override

  // Load template data if passed via navigation state
  useEffect(() => {
    const template = (location.state as any)?.template;
    if (template) {
      // Pre-fill form with template data
      if (template.purpose) {
        setFormData(prev => ({ ...prev, purpose: template.purpose }));
      }
      if (template.notes) {
        setFormData(prev => ({ ...prev, notes: template.notes }));
      }
      // Store duration from template (in minutes)
      if (template.expected_duration_minutes) {
        setTemplateDuration(template.expected_duration_minutes);
        // Also set custom duration to match template for display
        const hours = Math.floor(template.expected_duration_minutes / 60);
        const mins = template.expected_duration_minutes % 60;
        setCustomDuration({ hours, minutes: mins });
      }
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    if (!user) {
      showToast({
        title: 'Authentication Required',
        description: 'Please log in to create a visitor pass',
        variant: 'error',
      });
      navigate('/login');
      return;
    }

    // Validation
    if (!formData.primary_visitor_name.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please enter visitor name',
        variant: 'error',
      });
      return;
    }

    if (formData.selected_vehicle_ids.length === 0) {
      showToast({
        title: 'Validation Error',
        description: 'Please select at least one vehicle',
        variant: 'error',
      });
      return;
    }

    if (!formData.referred_by.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please enter who referred this visitor',
        variant: 'error',
      });
      return;
    }

    if (!formData.contact_number.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please enter contact number',
        variant: 'error',
      });
      return;
    }

    // Validate mobile number
    const mobileValidation = validateMobileNumber(formData.contact_number);
    if (!mobileValidation.isValid) {
      showToast({
        title: 'Validation Error',
        description: mobileValidation.error || 'Please enter a valid mobile number',
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);

      // Calculate valid_to based on template duration, custom duration, or default to end of day
      const validFromStr = `${formData.expected_date} ${formData.expected_time}:00`;
      const validFromDate = new Date(`${formData.expected_date}T${formData.expected_time}:00`);
      
      // Priority: template duration > custom duration > end of day
      let durationMinutes: number | null = null;
      if (templateDuration && templateDuration > 0) {
        durationMinutes = templateDuration;
      } else if (customDuration.hours > 0 || customDuration.minutes > 0) {
        durationMinutes = (customDuration.hours * 60) + customDuration.minutes;
      }
      
      let validTo: string;
      if (durationMinutes && durationMinutes > 0) {
        // Add duration in minutes (ensure at least 1 minute to satisfy 'after:valid_from' validation)
        const minDuration = Math.max(durationMinutes, 1);
        const validToDate = new Date(validFromDate.getTime() + (minDuration * 60 * 1000));
        // Format as YYYY-MM-DD HH:MM:SS for Laravel
        const year = validToDate.getFullYear();
        const month = String(validToDate.getMonth() + 1).padStart(2, '0');
        const day = String(validToDate.getDate()).padStart(2, '0');
        const hours = String(validToDate.getHours()).padStart(2, '0');
        const minutes = String(validToDate.getMinutes()).padStart(2, '0');
        const seconds = String(validToDate.getSeconds()).padStart(2, '0');
        validTo = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } else {
        // Default to end of day if no duration specified (ensure it's after valid_from)
        const endOfDay = new Date(`${formData.expected_date}T23:59:59`);
        // If valid_from is already past end of day, add 1 day
        if (validFromDate >= endOfDay) {
          const nextDay = new Date(validFromDate);
          nextDay.setDate(nextDay.getDate() + 1);
          const year = nextDay.getFullYear();
          const month = String(nextDay.getMonth() + 1).padStart(2, '0');
          const day = String(nextDay.getDate()).padStart(2, '0');
          validTo = `${year}-${month}-${day} 23:59:59`;
        } else {
          validTo = formData.expected_date + ' 23:59:59';
        }
      }

      const requestData = {
        visitor_name: formData.primary_visitor_name,
        visitor_phone: formData.contact_number,
        visitor_company: formData.referred_by,
        vehicles_to_view: formData.selected_vehicle_ids,
        purpose: formData.purpose,
        valid_from: validFromStr,
        valid_to: validTo,
        yard_id: user?.yard_id || '01764192-4382-47dd-9e16-97f64d9a299f',
        notes: formData.notes || null
      };

      const response = await apiClient.post('/visitor-gate-passes', requestData);

      // Create a readable pass number from the UUID
      const passId = response.data.pass.id;
      const shortPassNumber = `VP${passId.substring(0, 8).toUpperCase()}`;
      
      showToast({
        title: 'Success',
        description: `Gate Pass #${shortPassNumber} created successfully!`,
        variant: 'success',
        duration: 5000,
      });
      
      // Ask if they want to share on WhatsApp
      const shouldShare = await confirm({
        title: 'Share on WhatsApp?',
        message: 'Would you like to share this gate pass on WhatsApp?',
        confirmLabel: 'Share',
        cancelLabel: 'Skip',
      });
      
      if (shouldShare) {
        const message = encodeURIComponent(
          `Gate Pass #${shortPassNumber}\n` +
          `Visitor: ${formData.primary_visitor_name}\n` +
          `Date: ${formData.expected_date}\n` +
          `Time: ${formData.expected_time}`
        );
        window.open(`https://wa.me/?text=${message}`, '_blank');
      }

      navigate('/dashboard');

    } catch (error: unknown) {
      // Failed to create pass
      
      // Show specific validation errors if available
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.data?.errors) {
          const errors = axiosError.response.data.errors;
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          showToast({
            title: 'Validation Errors',
            description: errorMessages,
            variant: 'error',
            duration: 7000,
          });
        } else {
          showToast({
            title: 'Error',
            description: 'Failed to create gate pass. Please try again.',
            variant: 'error',
          });
        }
      } else {
        showToast({
          title: 'Error',
          description: 'Failed to create gate pass. Please try again.',
          variant: 'error',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof VisitorPassFormData, value: VisitorPassFormData[typeof field]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMobileChange = (value: string) => {
    // Format the mobile number (remove non-digits, limit to 10)
    const formatted = formatMobileNumber(value);
    updateField('contact_number', formatted);
    
    // Only show error if user has entered 10 digits and it's invalid
    if (formatted.length === 10) {
      const validation = validateMobileNumber(formatted);
      if (!validation.isValid) {
        setMobileError(validation.error || 'Invalid mobile number');
      } else {
        setMobileError('');
      }
    } else if (formatted.length > 0) {
      // Clear error if user is still typing (less than 10 digits)
      setMobileError('');
    }
  };

  return (
    <>
      {ConfirmComponent}
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '1rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            border: 'none',
            background: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            marginRight: '1rem',
            padding: '0.5rem'
          }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
          New Visitor Pass
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Pass Info */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#F9FAFB',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#6B7280'
        }}>
          <div>Pass #: <strong>Auto-generated</strong></div>
          <div>📅 {new Date().toLocaleDateString()}</div>
        </div>

        {/* Visitor Information Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: 600,
            marginBottom: '1rem',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            👤 Visitor Information
          </h2>
          <div style={{ height: '2px', backgroundColor: '#E5E7EB', marginBottom: '1.5rem' }} />

          {/* Primary Visitor Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Primary Visitor Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.primary_visitor_name}
              onChange={(e) => updateField('primary_visitor_name', e.target.value)}
              placeholder="Enter name"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Additional Visitors */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Additional Visitors (Optional)
            </label>
            <input
              type="text"
              value={formData.additional_visitors}
              onChange={(e) => updateField('additional_visitors', e.target.value)}
              placeholder="Name 2, Name 3 (comma separated)"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>
              💡 Enter names separated by commas
            </div>
          </div>

          {/* Additional Head Count */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Additional Head Count
            </label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              backgroundColor: '#F9FAFB'
            }}>
              <button
                type="button"
                onClick={() => updateField('additional_head_count', Math.max(0, formData.additional_head_count - 1))}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                −
              </button>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 600,
                minWidth: '60px',
                textAlign: 'center'
              }}>
                {formData.additional_head_count}
              </div>
              <button
                type="button"
                onClick={() => updateField('additional_head_count', formData.additional_head_count + 1)}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                +
              </button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>
              💡 How many unnamed persons?
            </div>
          </div>

          {/* Referred By */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Referred By <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.referred_by}
              onChange={(e) => updateField('referred_by', e.target.value)}
              placeholder='Enter referrer name or "Direct"'
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Contact Number */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Contact Number <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="tel"
              value={formData.contact_number}
              onChange={(e) => handleMobileChange(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${mobileError ? '#EF4444' : '#D1D5DB'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {mobileError && (
              <div style={{
                color: '#EF4444',
                fontSize: '0.75rem',
                marginTop: '0.25rem'
              }}>
                {mobileError}
              </div>
            )}
          </div>
        </div>

        {/* Vehicles Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: 600,
            marginBottom: '1rem',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🚗 Vehicles to Inspect
          </h2>
          <div style={{ height: '2px', backgroundColor: '#E5E7EB', marginBottom: '1.5rem' }} />

          <VehicleSelector
            onSelect={(id) => updateField('selected_vehicle_ids', [...formData.selected_vehicle_ids, id])}
            onRemove={(id) => updateField('selected_vehicle_ids', formData.selected_vehicle_ids.filter(v => v !== id))}
            selectedVehicleIds={formData.selected_vehicle_ids}
            multiple={true}
            required={true}
          />
        </div>

        {/* Visit Details Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '1rem', 
            fontWeight: 600,
            marginBottom: '1rem',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📋 Visit Details
          </h2>
          <div style={{ height: '2px', backgroundColor: '#E5E7EB', marginBottom: '1.5rem' }} />

          {/* Purpose */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Purpose of Visit <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { value: 'inspection', label: 'Inspection/Viewing' },
                { value: 'service', label: 'Service/Maintenance' },
                { value: 'delivery', label: 'Delivery/Pickup' },
                { value: 'meeting', label: 'Meeting' },
                { value: 'other', label: 'Other' }
              ].map(option => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: formData.purpose === option.value ? '#EFF6FF' : 'white',
                    borderColor: formData.purpose === option.value ? '#3B82F6' : '#D1D5DB'
                  }}
                >
                  <input
                    type="radio"
                    name="purpose"
                    value={option.value}
                    checked={formData.purpose === option.value}
                    onChange={(e) => updateField('purpose', e.target.value as VisitorPassFormData['purpose'])}
                    style={{ marginRight: '0.75rem' }}
                  />
                  <span style={{ fontSize: '0.875rem' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Expected Date */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Expected Visit Date
            </label>
            <input
              type="date"
              value={formData.expected_date}
              onChange={(e) => updateField('expected_date', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Expected Time */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Expected Time
            </label>
            <input
              type="time"
              value={formData.expected_time}
              onChange={(e) => updateField('expected_time', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Time Limit / Duration */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Time Limit {templateDuration ? '(from template)' : ''}
            </label>
            {templateDuration ? (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#EFF6FF',
                border: '1px solid #3B82F6',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1E40AF'
              }}>
                {(() => {
                  const hours = Math.floor(templateDuration / 60);
                  const mins = templateDuration % 60;
                  if (hours > 0 && mins > 0) {
                    return `${hours}h ${mins}m`;
                  } else if (hours > 0) {
                    return `${hours} hour${hours > 1 ? 's' : ''}`;
                  } else {
                    return `${mins} minute${mins > 1 ? 's' : ''}`;
                  }
                })()} from entry time
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={customDuration.hours}
                    onChange={(e) => setCustomDuration(prev => ({ 
                      ...prev, 
                      hours: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="Hours"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>Hours</div>
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customDuration.minutes}
                    onChange={(e) => setCustomDuration(prev => ({ 
                      ...prev, 
                      minutes: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="Minutes"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>Minutes</div>
                </div>
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>
              ⏱️ Pass will automatically expire after this duration from entry time
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              placeholder="Any additional information..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '2px', backgroundColor: '#E5E7EB', marginBottom: '2rem' }} />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: loading ? '#9CA3AF' : '#3B82F6',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'Creating Pass...' : 'Create Pass & Share'}
        </button>

        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.75rem', 
          color: '#6B7280',
          marginTop: '1rem'
        }}>
          (Will generate PDF for WhatsApp)
        </div>
      </form>
      </div>
    </>
  );
};