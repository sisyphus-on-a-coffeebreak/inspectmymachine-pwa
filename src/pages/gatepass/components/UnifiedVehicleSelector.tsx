/**
 * Unified Vehicle Selector Component
 * 
 * A single component that handles all vehicle selection use cases:
 * - Multiple selection (visitor passes)
 * - Single selection (outbound passes)
 * - Search & create (inbound passes)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { useDebounce } from '../../../hooks/useDebounce';
import type { Vehicle } from '../gatePassTypes';
import { colors, spacing, typography } from '../../../lib/theme';
import { VehicleDropdown } from './UnifiedVehicleSelector/VehicleDropdown';
import { VehicleChip } from './UnifiedVehicleSelector/VehicleChip';
import { VehicleCard } from './UnifiedVehicleSelector/VehicleCard';
import { VehicleSearchInput } from './UnifiedVehicleSelector/VehicleSearchInput';
import { CreateVehicleForm } from './UnifiedVehicleSelector/CreateVehicleForm';

export interface NewVehiclePayload {
  registration_number: string;
  make?: string;
  model?: string;
  year?: number;
  vehicle_type?: string;
  yard_id?: string | null;
}

interface UnifiedVehicleSelectorProps {
  // Core props
  mode: 'single' | 'multiple' | 'search-create';
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;

  // Filters
  statusFilter?: 'in_yard' | 'all';
  yardId?: string | null;

  // Validation
  required?: boolean;
  minSelection?: number; // For multiple mode (default: 1)
  maxSelection?: number; // For multiple mode

  // UI customization
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;

  // Callbacks
  onCreateNew?: (vehicleData: NewVehiclePayload) => Promise<Vehicle>;

  // Advanced
  apiEndpoint?: string; // Override default '/v1/vehicles'
  disabled?: boolean;
}

export const UnifiedVehicleSelector: React.FC<UnifiedVehicleSelectorProps> = ({
  mode,
  value,
  onChange,
  statusFilter = 'all',
  yardId = null,
  required = false,
  minSelection = 1,
  maxSelection,
  placeholder,
  label,
  helperText,
  error,
  onCreateNew,
  apiEndpoint = '/v1/vehicles',
  disabled = false,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<Vehicle | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState('');

  // Debounce search for dropdown mode
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Normalize value based on mode
  const selectedIds = useMemo(() => {
    if (!value) return [];
    if (mode === 'multiple') {
      return Array.isArray(value) ? value.map(String) : [String(value)];
    }
    return [String(value)];
  }, [value, mode]);

  // Fetch vehicles for dropdown modes
  const fetchVehicles = useCallback(async () => {
    if (mode === 'search-create') return; // Don't fetch for search-create mode

    try {
      setLoading(true);

      const params: any = {};
      if (yardId) {
        params.yard_id = yardId;
      }
      if (statusFilter === 'in_yard') {
        params.status = 'In Service'; // Adjust based on your status values
      }
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      // Extract pathname from apiEndpoint
      let endpointPath = apiEndpoint;
      if (apiEndpoint.includes('?')) {
        const url = new URL(apiEndpoint, 'http://dummy.com');
        endpointPath = url.pathname;
        url.searchParams.forEach((value, key) => {
          params[key] = value;
        });
      }

      if (!endpointPath.startsWith('/')) {
        endpointPath = '/' + endpointPath;
      }

      const response = await apiClient.get(endpointPath, { params });

      // Handle Laravel API response format
      const vehicleData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [mode, yardId, statusFilter, debouncedSearch, apiEndpoint]);

  // Fetch vehicles when dependencies change
  useEffect(() => {
    if (mode !== 'search-create') {
      fetchVehicles();
    }
  }, [fetchVehicles, mode]);

  // Fetch selected vehicle details for search-create mode
  useEffect(() => {
    if (mode === 'search-create' && value && !foundVehicle) {
      fetchVehicleDetails(String(value));
    }
  }, [mode, value, foundVehicle]);

  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      const response = await apiClient.get<Vehicle>(`/v1/vehicles/${vehicleId}`);
      setFoundVehicle(response.data);
      setRegistrationNumber(response.data.registration_number || '');
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
    }
  };

  // Handle vehicle selection
  const handleSelect = useCallback(
    (vehicleId: string) => {
      if (mode === 'multiple') {
        const currentIds = selectedIds;
        if (!currentIds.includes(vehicleId)) {
          if (maxSelection && currentIds.length >= maxSelection) {
            return; // Don't add if max reached
          }
          const newIds = [...currentIds, vehicleId];
          onChange(newIds);
        }
        setSearchTerm('');
        setShowDropdown(false);
      } else {
        // single mode
        onChange(vehicleId);
        setSearchTerm('');
        setShowDropdown(false);
      }
    },
    [mode, selectedIds, maxSelection, onChange]
  );

  // Handle vehicle removal (multiple mode)
  const handleRemove = useCallback(
    (vehicleId: string) => {
      if (mode === 'multiple') {
        const newIds = selectedIds.filter((id) => id !== vehicleId);
        onChange(newIds.length > 0 ? newIds : null);
      }
    },
    [mode, selectedIds, onChange]
  );

  // Handle search (search-create mode)
  const handleSearch = useCallback(async () => {
    if (!registrationNumber.trim()) {
      return;
    }

    setSearching(true);
    try {
      const response = await apiClient.get<{ data: Vehicle[] }>('/v1/vehicles', {
        params: {
          search: registrationNumber.trim(),
        },
      });

      const vehicles = getVehiclesFromResponse(response);
      const matchingVehicle = vehicles.find(
        (v) =>
          v.registration_number?.toLowerCase() === registrationNumber.trim().toLowerCase()
      );

      if (matchingVehicle) {
        setFoundVehicle(matchingVehicle);
        onChange(String(matchingVehicle.id));
      } else {
        setFoundVehicle(null);
        setShowCreateForm(true);
      }
    } catch (error) {
      console.error('Error searching for vehicle:', error);
      setFoundVehicle(null);
      setShowCreateForm(true);
    } finally {
      setSearching(false);
    }
  }, [registrationNumber, onChange]);

  // Handle vehicle creation (search-create mode)
  const handleCreateVehicle = useCallback(
    async (data: NewVehiclePayload) => {
      setCreating(true);
      try {
        const createFn = onCreateNew || (async (payload: NewVehiclePayload) => {
          const response = await apiClient.post<Vehicle>('/v1/vehicles', {
            registration_number: payload.registration_number.trim().toUpperCase(),
            make: payload.make || 'Unknown',
            model: payload.model || 'Unknown',
            year: payload.year || new Date().getFullYear(),
            vehicle_type: payload.vehicle_type || 'commercial',
            yard_id: payload.yard_id || null,
          });
          return response.data;
        });

        const newVehicle = await createFn(data);
        setFoundVehicle(newVehicle);
        onChange(String(newVehicle.id));
        setShowCreateForm(false);
      } catch (error) {
        console.error('Error creating vehicle:', error);
        throw error; // Re-throw to let form handle it
      } finally {
        setCreating(false);
      }
    },
    [onCreateNew, onChange]
  );

  // Handle clear (search-create mode)
  const handleClear = useCallback(() => {
    setRegistrationNumber('');
    setFoundVehicle(null);
    setShowCreateForm(false);
    onChange(null);
  }, [onChange]);

  // Get selected vehicles for display
  const selectedVehicles = useMemo(() => {
    if (mode === 'search-create') {
      return foundVehicle ? [foundVehicle] : [];
    }
    return vehicles.filter((v) => selectedIds.includes(String(v.id)));
  }, [mode, vehicles, selectedIds, foundVehicle]);

  // Get vehicle for single mode
  const selectedVehicle = useMemo(() => {
    if (mode === 'single' && selectedVehicles.length > 0) {
      return selectedVehicles[0];
    }
    return null;
  }, [mode, selectedVehicles]);

  // Validation
  const validationError = useMemo(() => {
    if (error) return error;
    if (required && !value) {
      return `${label || 'Vehicle'} is required`;
    }
    if (mode === 'multiple') {
      const selected = selectedIds;
      if (minSelection && selected.length < minSelection) {
        return `Please select at least ${minSelection} vehicle(s)`;
      }
      if (maxSelection && selected.length > maxSelection) {
        return `Please select at most ${maxSelection} vehicle(s)`;
      }
    }
    return null;
  }, [error, required, value, label, mode, selectedIds, minSelection, maxSelection]);

  // Helper to normalize vehicle response
  const getVehiclesFromResponse = (response: any): Vehicle[] => {
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data?.items)) {
      return response.data.items;
    }
    return [];
  };

  // Render based on mode
  if (mode === 'search-create') {
    return (
      <div>
        {label && (
          <label
            style={{
              ...typography.label,
              display: 'block',
              marginBottom: spacing.xs,
            }}
          >
            {label} {required && <span style={{ color: colors.error }}>*</span>}
          </label>
        )}

        <VehicleSearchInput
          value={registrationNumber}
          onChange={setRegistrationNumber}
          onSearch={handleSearch}
          onClear={handleClear}
          searching={searching}
          found={!!foundVehicle}
          disabled={disabled}
          placeholder={placeholder}
        />

        {foundVehicle && (
          <VehicleCard
            vehicle={foundVehicle}
            onChange={handleClear}
            disabled={disabled}
          />
        )}

        {showCreateForm && !foundVehicle && (
          <CreateVehicleForm
            registrationNumber={registrationNumber}
            onSubmit={handleCreateVehicle}
            onCancel={() => {
              setShowCreateForm(false);
              setRegistrationNumber('');
            }}
            loading={creating}
            yardId={yardId}
          />
        )}

        {helperText && (
          <p
            style={{
              ...typography.bodySmall,
              color: colors.neutral[500],
              marginTop: spacing.xs,
            }}
          >
            {helperText}
          </p>
        )}

        {validationError && (
          <div
            style={{
              color: colors.error,
              fontSize: '0.75rem',
              marginTop: spacing.xs,
            }}
          >
            {validationError}
          </div>
        )}
      </div>
    );
  }

  // Render for single and multiple modes
  return (
    <div>
      {label && (
        <label
          style={{
            ...typography.label,
            display: 'block',
            marginBottom: spacing.xs,
          }}
        >
          {label} {required && <span style={{ color: colors.error }}>*</span>}
        </label>
      )}

      {/* Selected Vehicles Display */}
      {mode === 'multiple' && selectedVehicles.length > 0 && (
        <div style={{ marginBottom: spacing.sm }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: colors.neutral[600],
              marginBottom: spacing.xs,
            }}
          >
            Selected Vehicles:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
            {selectedVehicles.map((vehicle) => (
              <VehicleChip
                key={vehicle.id}
                vehicle={vehicle}
                onRemove={handleRemove}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {mode === 'single' && selectedVehicle && (
        <VehicleCard
          vehicle={selectedVehicle}
          onChange={() => {
            onChange(null);
            setShowDropdown(true);
          }}
          disabled={disabled}
        />
      )}

      {/* Dropdown */}
      {(!selectedVehicle || mode === 'multiple') && (
        <VehicleDropdown
          vehicles={vehicles}
          selectedIds={selectedIds}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelect={handleSelect}
          loading={loading}
          placeholder={placeholder}
          showDropdown={showDropdown}
          onToggle={() => setShowDropdown(!showDropdown)}
          filterFn={
            statusFilter === 'in_yard'
              ? (v) => v.status === 'available' || v.status === 'In Service'
              : undefined
          }
        />
      )}

      {/* Add Another Button (multiple mode) */}
      {mode === 'multiple' && selectedVehicles.length > 0 && (
        <button
          onClick={() => setShowDropdown(true)}
          disabled={disabled}
          style={{
            marginTop: spacing.sm,
            padding: `${spacing.xs} ${spacing.sm}`,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: '6px',
            backgroundColor: 'white',
            color: colors.primary[600],
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          + Add Another Vehicle
        </button>
      )}

      {helperText && (
        <p
          style={{
            ...typography.bodySmall,
            color: colors.neutral[500],
            marginTop: spacing.xs,
          }}
        >
          {helperText}
        </p>
      )}

      {validationError && (
        <div
          style={{
            color: colors.error,
            fontSize: '0.75rem',
            marginTop: spacing.xs,
          }}
        >
          {validationError}
        </div>
      )}
    </div>
  );
};







