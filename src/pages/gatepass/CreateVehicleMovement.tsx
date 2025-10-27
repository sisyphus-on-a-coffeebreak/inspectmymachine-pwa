import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { VehicleSelector } from './components//VehicleSelector';
import { PhotoUpload } from './components/PhotoUpload';
import { useAuth } from '../../providers/useAuth';
import type { VehicleMovementFormData } from './gatePassTypes';
import { validateMobileNumber, formatMobileNumber } from '../../lib/validation';

// 🚗 Create Vehicle Movement Pass
// For tracking vehicles going out (RTO, sales, test drives) or coming in

export const CreateVehicleMovement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mobileError, setMobileError] = useState<string>('');
  const [yards, setYards] = useState<Array<{id: string, name: string}>>([]);
  const [yardsLoading, setYardsLoading] = useState(true);
  const [showCustomYard, setShowCustomYard] = useState(false);
  const [customYard, setCustomYard] = useState({
    name: '',
    city: '',
    state: ''
  });
  const [creatingYard, setCreatingYard] = useState(false);
  const [formData, setFormData] = useState<VehicleMovementFormData>({
    vehicle_id: null,
    direction: 'outbound',
    purpose: 'rto_work',
    driver_name: '',
    driver_contact: '',
    driver_license_number: '',
    driver_license_photo: null,
    expected_return_date: '',
    expected_return_time: '',
    destination: '',
    exit_photos: [],
    exit_odometer: '',
    notes: '',
    vehicle_selection_type: 'existing',
    manual_vehicle: {
      registration_number: '',
      make: '',
      model: ''
    },
    yard_id: null
  });

  // Fetch yards on component mount
  useEffect(() => {
    const fetchYards = async () => {
      try {
        const response = await axios.get('/api/yards');
        setYards(response.data);
        // Set default yard if user has one
        if (user?.yard_id && response.data.length > 0) {
          setFormData(prev => ({ ...prev, yard_id: user.yard_id }));
        }
      } catch (error) {
        console.error('Failed to fetch yards:', error);
        // Set default yards if API fails
        setYards([
          { id: 'default-yard-id', name: 'Default Yard' }
        ]);
      } finally {
        setYardsLoading(false);
      }
    };

    fetchYards();
  }, [user?.yard_id]);

  // Create custom yard
  const createCustomYard = async () => {
    if (!customYard.name.trim() || !customYard.city.trim() || !customYard.state.trim()) {
      alert('Please fill in all custom yard details');
      return;
    }

    try {
      setCreatingYard(true);
      const response = await axios.post('/api/yards', customYard);
      const newYard = response.data.yard;
      
      // Add the new yard to the list
      setYards(prev => [...prev, { id: newYard.id, name: newYard.name }]);
      
      // Select the new yard
      updateField('yard_id', newYard.id);
      
      // Reset custom yard form
      setCustomYard({ name: '', city: '', state: '' });
      setShowCustomYard(false);
      
      alert(`Custom yard "${newYard.name}" created successfully!`);
    } catch (error) {
      console.error('Failed to create custom yard:', error);
      alert('Failed to create custom yard. Please try again.');
    } finally {
      setCreatingYard(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    if (!user) {
      alert('Please log in to create a vehicle movement pass');
      navigate('/login');
      return;
    }

    console.log('User authenticated:', user);

    // Validation
    if (!formData.yard_id) {
      alert('Please select a yard');
      return;
    }

    if (formData.direction === 'outbound') {
      if (!formData.vehicle_id) {
        alert('Please select a vehicle');
        return;
      }
    } else {
      // Inbound validation
      if (formData.vehicle_selection_type === 'existing' && !formData.vehicle_id) {
        alert('Please select a vehicle currently out');
        return;
      }
      if (formData.vehicle_selection_type === 'manual' && !formData.manual_vehicle?.registration_number) {
        alert('Please enter vehicle registration number');
        return;
      }
    }

    // Common validation for both inbound and outbound
    if (!formData.driver_name.trim()) {
      alert('Please enter driver name');
      return;
    }
    if (!formData.driver_contact.trim()) {
      alert('Please enter driver contact number');
      return;
    }

    // Validate mobile number
    const mobileValidation = validateMobileNumber(formData.driver_contact);
    if (!mobileValidation.isValid) {
      alert(mobileValidation.error || 'Please enter a valid mobile number');
      return;
    }

    if (formData.direction === 'outbound') {
      if (!formData.driver_license_photo) {
        alert('Please upload driver license photo');
        return;
      }
      if (formData.exit_photos.length === 0) {
        alert('Please upload vehicle condition photos');
        return;
      }
      // Only require expected return date for non-sold vehicles
      if (formData.purpose !== 'sold' && !formData.expected_return_date) {
        alert('Please enter expected return date');
        return;
      }
    }

    try {
      setLoading(true);

      // Ensure CSRF token is available
      try {
        await axios.get('/sanctum/csrf-cookie');
        console.log('CSRF token obtained');
      } catch (csrfError) {
        console.error('CSRF token failed:', csrfError);
        alert('Authentication issue. Please refresh the page and try again.');
        return;
      }

      // Get CSRF token from cookie
      const getCsrfToken = () => {
        const name = 'XSRF-TOKEN=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        for (let cookie of cookieArray) {
          cookie = cookie.trim();
          if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length);
          }
        }
        return null;
      };

      const csrfToken = getCsrfToken();
      console.log('CSRF token from cookie:', csrfToken);
      
      if (!csrfToken) {
        console.error('No CSRF token found in cookies');
        alert('CSRF token not found. Please refresh the page and try again.');
        return;
      }

      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Handle vehicle data based on direction and selection type
      if (formData.direction === 'outbound') {
        submitData.append('vehicle_id', formData.vehicle_id!.toString());
      } else {
        // Inbound vehicle handling
        if (formData.vehicle_selection_type === 'existing') {
          submitData.append('vehicle_id', formData.vehicle_id!.toString());
        } else {
          // Manual vehicle entry
          submitData.append('manual_vehicle', JSON.stringify(formData.manual_vehicle));
        }
      }
      
      submitData.append('direction', formData.direction);
      submitData.append('purpose', formData.purpose);
      submitData.append('status', formData.direction === 'outbound' ? 'out' : 'returned');

      // Add required fields for both inbound and outbound
      submitData.append('driver_name', formData.driver_name);
      submitData.append('driver_phone', formData.driver_contact); // Map driver_contact to driver_phone
      submitData.append('yard_id', formData.yard_id || user?.yard_id || 'default-yard-id'); // Use selected yard

      if (formData.direction === 'outbound') {
        // Add required fields for VehicleExitPass
        submitData.append('escort_employee_id', user?.id || 1); // Use current user as escort
        
        if (formData.driver_license_photo) {
          submitData.append('driver_license_photo', formData.driver_license_photo);
        }

        submitData.append('expected_return_date', formData.expected_return_date);
        submitData.append('expected_return_time', formData.expected_return_time);
        submitData.append('destination', formData.destination);
        submitData.append('exit_odometer', formData.exit_odometer);

        // Upload exit photos
        formData.exit_photos.forEach((photo, index) => {
          submitData.append(`exit_photos[${index}]`, photo);
        });
      } else {
        // Add required fields for inbound VehicleEntryPass
        if (formData.vehicle_selection_type === 'manual' && formData.manual_vehicle) {
          submitData.append('expected_chassis_last_5', formData.manual_vehicle.registration_number?.slice(-5) || '');
          submitData.append('expected_make', formData.manual_vehicle.make || '');
          submitData.append('expected_model', formData.manual_vehicle.model || '');
        }
        
        // Add expected arrival date for inbound vehicles
        if (formData.expected_return_date) {
          submitData.append('expected_arrival', formData.expected_return_date);
        }
      }

      if (formData.notes) {
        submitData.append('notes', formData.notes);
      }

      // Prepare headers with CSRF token
      const headers: any = {
        'Content-Type': 'multipart/form-data',
        'X-Requested-With': 'XMLHttpRequest'
      };

      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = csrfToken;
      }

      console.log('Request headers:', headers);
      
      // Debug: Log all form data being sent
      console.log('Form data being sent:');
      for (let [key, value] of submitData.entries()) {
        console.log(`${key}:`, value);
      }

      // Use the correct endpoint based on direction
      const endpoint = formData.direction === 'outbound' 
        ? '/api/vehicle-exit-passes' 
        : '/api/vehicle-entry-passes';
      
      console.log('Using endpoint:', endpoint);

      const response = await axios.post(endpoint, submitData, {
        headers
      });

      alert(`Vehicle Movement Pass #${response.data.pass_number} created successfully!`);
      navigate('/app/gate-pass');

    } catch (error) {
      console.error('Failed to create movement pass:', error);
      
      // Handle specific error types
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 419) {
          alert('Session expired. Please log in again.');
          navigate('/login');
          return;
        } else if (error.response?.status === 401) {
          alert('Please log in to create a vehicle movement pass.');
          navigate('/login');
          return;
        } else if (error.response?.status === 422) {
          // Log validation errors for debugging
          console.error('Validation errors:', error.response.data);
          const validationErrors = error.response.data?.errors || error.response.data?.message;
          console.error('Laravel validation errors:', validationErrors);
          alert(`Validation error: ${JSON.stringify(validationErrors)}`);
          return;
        }
      }
      
      alert('Failed to create movement pass. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof VehicleMovementFormData, value: VehicleMovementFormData[typeof field]) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset vehicle selection when direction changes
      if (field === 'direction') {
        newData.vehicle_id = null;
        newData.vehicle_selection_type = 'existing';
        newData.manual_vehicle = {
          registration_number: '',
          make: '',
          model: ''
        };
      }
      
      return newData;
    });
  };

  const handleMobileChange = (value: string) => {
    // Format the mobile number (remove non-digits, limit to 10)
    const formatted = formatMobileNumber(value);
    updateField('driver_contact', formatted);
    
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
          onClick={() => navigate('/app/gate-pass')}
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
          Vehicle Movement Pass
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
          <div>Pass #: <strong>VM-Auto</strong></div>
          <div>📅 {new Date().toLocaleDateString()}</div>
        </div>

        {/* Direction */}
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
            📍 Movement Direction
          </h2>
          <div style={{ height: '2px', backgroundColor: '#E5E7EB', marginBottom: '1.5rem' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: formData.direction === 'outbound' ? '#EFF6FF' : 'white',
                borderColor: formData.direction === 'outbound' ? '#3B82F6' : '#D1D5DB'
              }}
            >
              <input
                type="radio"
                name="direction"
                value="outbound"
                checked={formData.direction === 'outbound'}
                onChange={(e) => updateField('direction', e.target.value as VehicleMovementFormData['direction'])}
                style={{ marginRight: '0.75rem' }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>● Outbound (Leaving Yard)</span>
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: formData.direction === 'inbound' ? '#EFF6FF' : 'white',
                borderColor: formData.direction === 'inbound' ? '#3B82F6' : '#D1D5DB'
              }}
            >
              <input
                type="radio"
                name="direction"
                value="inbound"
                checked={formData.direction === 'inbound'}
                onChange={(e) => updateField('direction', e.target.value as VehicleMovementFormData['direction'])}
                style={{ marginRight: '0.75rem' }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>○ Inbound (Entering Yard)</span>
            </label>
          </div>
        </div>

        {/* Yard Selection */}
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
            🏢 Select Yard
          </h2>
          <div style={{ height: '2px', backgroundColor: '#E5E7EB', marginBottom: '1.5rem' }} />

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Yard Location <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={formData.yard_id || ''}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  setShowCustomYard(true);
                } else {
                  updateField('yard_id', e.target.value);
                  setShowCustomYard(false);
                }
              }}
              required
              disabled={yardsLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '1rem',
                boxSizing: 'border-box',
                backgroundColor: yardsLoading ? '#F9FAFB' : 'white'
              }}
            >
              <option value="">
                {yardsLoading ? 'Loading yards...' : 'Select a yard'}
              </option>
              {yards.map((yard) => (
                <option key={yard.id} value={yard.id}>
                  {yard.name}
                </option>
              ))}
              <option value="custom" style={{ fontStyle: 'italic', color: '#6B7280' }}>
                + Create New Yard (Partner/External)
              </option>
            </select>
            {yardsLoading && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6B7280', 
                marginTop: '0.5rem' 
              }}>
                Loading available yards...
              </div>
            )}
          </div>

          {/* Custom Yard Form */}
          {showCustomYard && (
            <div style={{ 
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                marginBottom: '1rem',
                color: '#374151'
              }}>
                🏢 Create New Partner Yard
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.75rem', 
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Yard Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={customYard.name}
                    onChange={(e) => setCustomYard(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ABC Partner Yard"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.75rem', 
                      fontWeight: 500,
                      marginBottom: '0.5rem',
                      color: '#374151'
                    }}>
                      City <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={customYard.city}
                      onChange={(e) => setCustomYard(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g., Mumbai"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.75rem', 
                      fontWeight: 500,
                      marginBottom: '0.5rem',
                      color: '#374151'
                    }}>
                      State <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={customYard.state}
                      onChange={(e) => setCustomYard(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="e.g., Maharashtra"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  justifyContent: 'flex-end',
                  marginTop: '0.5rem'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomYard(false);
                      setCustomYard({ name: '', city: '', state: '' });
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      color: '#374151',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createCustomYard}
                    disabled={creatingYard}
                    style={{
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: creatingYard ? '#9CA3AF' : '#3B82F6',
                      color: 'white',
                      fontSize: '0.875rem',
                      cursor: creatingYard ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {creatingYard ? 'Creating...' : 'Create Yard'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Selection */}
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
            🚗 Vehicle Details
          </h2>
          <div style={{ height: '2px', backgroundColor: '#E5E7EB', marginBottom: '1.5rem' }} />

          {formData.direction === 'outbound' ? (
            // Outbound: Select from available vehicles in yard
            <VehicleSelector
              onSelect={(id) => updateField('vehicle_id', id)}
              onRemove={() => updateField('vehicle_id', null)}
              selectedVehicleIds={formData.vehicle_id ? [formData.vehicle_id] : []}
              multiple={false}
              label="Select Vehicle from Yard"
              required={true}
              yardId={formData.yard_id}
            />
          ) : (
            // Inbound: Manual entry or select from vehicles currently out
            <div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: formData.vehicle_selection_type === 'existing' ? '#EFF6FF' : 'white',
                    borderColor: formData.vehicle_selection_type === 'existing' ? '#3B82F6' : '#D1D5DB'
                  }}
                >
                  <input
                    type="radio"
                    name="vehicle_selection_type"
                    value="existing"
                    checked={formData.vehicle_selection_type === 'existing'}
                    onChange={(e) => updateField('vehicle_selection_type', e.target.value)}
                    style={{ marginRight: '0.75rem' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Select from vehicles currently out
                  </span>
                </label>
                
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: formData.vehicle_selection_type === 'manual' ? '#EFF6FF' : 'white',
                    borderColor: formData.vehicle_selection_type === 'manual' ? '#3B82F6' : '#D1D5DB'
                  }}
                >
                  <input
                    type="radio"
                    name="vehicle_selection_type"
                    value="manual"
                    checked={formData.vehicle_selection_type === 'manual'}
                    onChange={(e) => updateField('vehicle_selection_type', e.target.value)}
                    style={{ marginRight: '0.75rem' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Enter new vehicle details manually
                  </span>
                </label>
              </div>

              {formData.vehicle_selection_type === 'existing' ? (
                <VehicleSelector
                  onSelect={(id) => updateField('vehicle_id', id)}
                  onRemove={() => updateField('vehicle_id', null)}
                  selectedVehicleIds={formData.vehicle_id ? [formData.vehicle_id] : []}
                  multiple={false}
                  label="Select Vehicle Currently Out"
                  required={true}
                  apiEndpoint="/api/vehicles?status=In Service"
                  yardId={formData.yard_id}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.875rem', 
                      fontWeight: 500,
                      marginBottom: '0.5rem',
                      color: '#374151'
                    }}>
                      Registration Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.manual_vehicle?.registration_number || ''}
                      onChange={(e) => updateField('manual_vehicle', { 
                        ...formData.manual_vehicle, 
                        registration_number: e.target.value 
                      })}
                      placeholder="e.g., KA-01-AB-1234"
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
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: 500,
                        marginBottom: '0.5rem',
                        color: '#374151'
                      }}>
                        Make
                      </label>
                      <input
                        type="text"
                        value={formData.manual_vehicle?.make || ''}
                        onChange={(e) => updateField('manual_vehicle', { 
                          ...formData.manual_vehicle, 
                          make: e.target.value 
                        })}
                        placeholder="e.g., Tata"
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
                    
                    <div>
                      <label style={{ 
                        display: 'block', 
                        fontSize: '0.875rem', 
                        fontWeight: 500,
                        marginBottom: '0.5rem',
                        color: '#374151'
                      }}>
                        Model
                      </label>
                      <input
                        type="text"
                        value={formData.manual_vehicle?.model || ''}
                        onChange={(e) => updateField('manual_vehicle', { 
                          ...formData.manual_vehicle, 
                          model: e.target.value 
                        })}
                        placeholder="e.g., 407"
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
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Outbound Details */}
        {formData.direction === 'outbound' && (
          <>
            {/* Purpose */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                fontSize: '0.875rem', 
                fontWeight: 600,
                marginBottom: '1rem',
                color: '#6B7280'
              }}>
                ─────── OUTBOUND DETAILS ───────
              </h2>

              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                Purpose of Movement <span style={{ color: '#EF4444' }}>*</span>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { value: 'rto_work', label: 'RTO Work (Fitness/Documents)' },
                  { value: 'sold', label: 'Sold (Customer Delivery)' },
                  { value: 'test_drive', label: 'Test Drive' },
                  { value: 'service', label: 'Service/Repair' },
                  { value: 'auction', label: 'Auction/Transfer' },
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
                      onChange={(e) => updateField('purpose', e.target.value as VehicleMovementFormData['purpose'])}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <span style={{ fontSize: '0.875rem' }}>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Driver License Photo - Only for outbound */}
            <div style={{ marginBottom: '2rem' }}>
              <PhotoUpload
                label="Driver License Photo"
                required={true}
                multiple={false}
                onPhotosChange={(files) => updateField('driver_license_photo', files[0] || null)}
                hint="Take a clear photo of the driver's license"
              />
            </div>

            {/* Expected Return - Only for non-sold vehicles */}
            {formData.purpose !== 'sold' && (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Expected Return Date <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expected_return_date}
                    onChange={(e) => updateField('expected_return_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
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

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 500,
                    marginBottom: '0.5rem',
                    color: '#374151'
                  }}>
                    Expected Return Time
                  </label>
                  <input
                    type="time"
                    value={formData.expected_return_time}
                    onChange={(e) => updateField('expected_return_time', e.target.value)}
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
              </>
            )}

            {/* Customer Delivery Notice */}
            {formData.purpose === 'sold' && (
              <div style={{ 
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#FEF3C7',
                border: '1px solid #F59E0B',
                borderRadius: '8px',
                color: '#92400E'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                  🚚 Customer Delivery
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  This vehicle will be delivered to the customer and will not return to the yard.
                </div>
              </div>
            )}

            {/* Destination */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                Destination
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => updateField('destination', e.target.value)}
                placeholder="e.g., RTO Office, Customer Site"
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

            {/* Vehicle Condition Photos */}
            <PhotoUpload
              label="Vehicle Condition (Before Exit)"
              required={true}
              multiple={true}
              maxPhotos={5}
              onPhotosChange={(files) => updateField('exit_photos', files)}
              hint="Take photos of vehicle condition before it leaves"
            />

            {/* Odometer */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#374151'
              }}>
                Current Odometer Reading
              </label>
              <input
                type="number"
                value={formData.exit_odometer}
                onChange={(e) => updateField('exit_odometer', e.target.value)}
                placeholder="KM/Hours"
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
          </>
        )}

        {/* Driver Information - Required for both inbound and outbound */}
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
            👤 Driver Information
          </h2>
          <div style={{ height: '2px', backgroundColor: '#E5E7EB', marginBottom: '1.5rem' }} />

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Driver Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.driver_name}
              onChange={(e) => updateField('driver_name', e.target.value)}
              placeholder="Driver Name"
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#374151'
            }}>
              Driver Contact Number <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="tel"
              value={formData.driver_contact}
              onChange={(e) => handleMobileChange(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              required
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

        {/* Notes */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: 500,
            marginBottom: '0.5rem',
            color: '#374151'
          }}>
            Notes
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
          {loading ? 'Creating Pass...' : 'Create Movement Pass'}
        </button>
      </form>
    </div>
  );
};