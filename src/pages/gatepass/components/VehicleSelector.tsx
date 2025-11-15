import React, { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { buttonHoverStates } from '../../../lib/theme';
import type { Vehicle } from '../gatePassTypes';

// 🚗 VehicleSelector Component
// Dropdown to select vehicles from your yard inventory
// Fetches live data from backend, shows vehicle details

interface VehicleSelectorProps {
  onSelect: (vehicleId: number) => void;
  onRemove: (vehicleId: number) => void;
  selectedVehicleIds: number[];
  multiple?: boolean;
  label?: string;
  required?: boolean;
  apiEndpoint?: string;
  yardId?: string | null;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  onSelect,
  onRemove,
  selectedVehicleIds,
  multiple = true,
  label = 'Select Vehicle(s)',
  required = false,
  apiEndpoint = '/vehicles',
  yardId = null
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch vehicles from backend when component loads or yardId changes
  useEffect(() => {
    fetchVehicles();
  }, [yardId]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params: any = {};
      if (yardId) {
        params.yard_id = yardId;
      }
      
      // Extract pathname and query params from apiEndpoint
      // apiEndpoint might be like '/v1/vehicles' or '/v1/vehicles?status=In Service'
      let endpointPath = apiEndpoint;
      
      // If endpoint contains query params, extract them
      if (apiEndpoint.includes('?')) {
        const url = new URL(apiEndpoint, 'http://dummy.com');
        endpointPath = url.pathname;
        // Extract existing query params
        url.searchParams.forEach((value, key) => {
          params[key] = value;
        });
      }
      
      // Ensure endpointPath starts with / (axios baseURL already includes /api)
      if (!endpointPath.startsWith('/')) {
        endpointPath = '/' + endpointPath;
      }
      
      const response = await apiClient.get(endpointPath, { params });
      
      // Handle Laravel API response format (wrapped in { data: [] })
      const vehicleData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || []);
        
      setVehicles(vehicleData);
    } catch (error) {
      // Error is already handled by apiClient
      setVehicles([]); // Graceful degradation - show empty list instead of blocking alert
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicles = vehicles.filter(v => selectedVehicleIds.includes(v.id));
  
  const filteredVehicles = vehicles.filter(v => 
    !selectedVehicleIds.includes(v.id) &&
    (v.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
     v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
     v.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (vehicleId: number) => {
    onSelect(vehicleId);
    setSearchTerm('');
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#6B7280' }}>
        Loading vehicles...
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Label */}
      <label style={{ 
        display: 'block', 
        fontSize: '0.875rem', 
        fontWeight: 500,
        marginBottom: '0.5rem',
        color: '#374151'
      }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>

      {/* Dropdown Toggle */}
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          padding: '0.75rem 1rem',
          border: '1px solid #D1D5DB',
          borderRadius: '8px',
          backgroundColor: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>
          Choose from yard inventory
        </span>
        <span style={{ fontSize: '0.75rem' }}>▾</span>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div style={{
          marginTop: '0.5rem',
          border: '1px solid #D1D5DB',
          borderRadius: '8px',
          backgroundColor: 'white',
          maxHeight: '300px',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {/* Search Input */}
          <div style={{ padding: '0.75rem', borderBottom: '1px solid #E5E7EB' }}>
            <input
              type="text"
              placeholder="Search by registration, make, model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Vehicle List */}
          <div>
            {filteredVehicles.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
                {vehicles.length === 0 ? 'No vehicles available in yard' : 'No vehicles found matching search'}
              </div>
            ) : (
              filteredVehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  onClick={() => handleSelect(vehicle.id)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #F3F4F6',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                    Object.assign(e.currentTarget.style, buttonHoverStates.hover);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#111827' }}>
                    🚛 {vehicle.registration_number}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    {vehicle.make} {vehicle.model} ({vehicle.year})
                  </div>
                  {vehicle.current_location && (
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                      📍 {vehicle.current_location}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Selected Vehicles */}
      {selectedVehicles.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
            Selected Vehicles:
          </div>
          {selectedVehicles.map(vehicle => (
            <div
              key={vehicle.id}
              style={{
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                backgroundColor: '#F9FAFB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                  🚛 {vehicle.registration_number}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                  {vehicle.make} {vehicle.model}
                </div>
              </div>
              <button
                onClick={() => onRemove(vehicle.id)}
                style={{
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Another Button */}
      {multiple && selectedVehicles.length > 0 && (
        <button
          onClick={() => setShowDropdown(true)}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1rem',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            backgroundColor: 'white',
            color: '#3B82F6',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          + Add Another Vehicle
        </button>
      )}
    </div>
  );
};