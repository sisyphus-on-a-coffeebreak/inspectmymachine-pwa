import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { colors, spacing, typography } from '../../../lib/theme';
import { Search, Plus, Check } from 'lucide-react';
import type { Vehicle } from '../gatePassTypes';

interface VehicleSearchAndCreateProps {
  onVehicleSelect: (vehicleId: string) => void;
  selectedVehicleId?: string;
  yardId?: string | null;
}

export const VehicleSearchAndCreate: React.FC<VehicleSearchAndCreateProps> = ({
  onVehicleSelect,
  selectedVehicleId,
  yardId,
}) => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<Vehicle | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState({
    make: '',
    model: '',
    year: '',
  });

  // If vehicle is already selected, fetch its details
  useEffect(() => {
    if (selectedVehicleId && !foundVehicle) {
      fetchVehicleDetails(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      const response = await apiClient.get<Vehicle>(`/v1/vehicles/${vehicleId}`);
      setFoundVehicle(response.data);
      setRegistrationNumber(response.data.registration_number || '');
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
    }
  };

  const handleSearch = async () => {
    if (!registrationNumber.trim()) {
      return;
    }

    setSearching(true);
    try {
      // Search for vehicle by registration number
      const response = await apiClient.get<{ data: Vehicle[] }>('/v1/vehicles', {
        params: {
          search: registrationNumber.trim(),
        },
      });

      const vehicles = getVehiclesFromResponse(response);

      const matchingVehicle = vehicles.find(
        v => v.registration_number?.toLowerCase() === registrationNumber.trim().toLowerCase()
      );

      if (matchingVehicle) {
        setFoundVehicle(matchingVehicle);
        onVehicleSelect(matchingVehicle.id);
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
  };

  const handleCreateVehicle = async () => {
    if (!registrationNumber.trim()) {
      return;
    }

    setCreating(true);
    try {
      // API requires make, model, year, and vehicle_type
      // For inbound vehicles, we'll use defaults if not provided
      const response = await apiClient.post<Vehicle>('/v1/vehicles', {
        registration_number: registrationNumber.trim().toUpperCase(),
        make: newVehicleData.make.trim() || 'Unknown',
        model: newVehicleData.model.trim() || 'Unknown',
        year: newVehicleData.year ? parseInt(newVehicleData.year, 10) : new Date().getFullYear(),
        vehicle_type: 'commercial', // Default to commercial, can be updated later
        yard_id: yardId || null,
      });

      setFoundVehicle(response.data);
      onVehicleSelect(response.data.id);
      setShowCreateForm(false);
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      // Error is handled by apiClient
    } finally {
      setCreating(false);
    }
  };

  const handleClear = () => {
    setRegistrationNumber('');
    setFoundVehicle(null);
    setShowCreateForm(false);
    setNewVehicleData({ make: '', model: '', year: '' });
    onVehicleSelect('');
  };

  // Handle response data format (could be wrapped in 'data' or direct array)
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

  return (
    <div>
      {/* Search Input */}
      <div style={{ marginBottom: spacing.md }}>
        <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
          Vehicle Registration Number <span style={{ color: colors.error }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Input
            type="text"
            value={registrationNumber}
            onChange={(e) => {
              setRegistrationNumber(e.target.value.toUpperCase());
              if (foundVehicle) {
                handleClear();
              }
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            placeholder="Enter registration number (e.g., MH12AB1234)"
            style={{ flex: 1 }}
            disabled={!!foundVehicle}
          />
          {!foundVehicle && (
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={!registrationNumber.trim() || searching}
            >
              <Search size={16} style={{ marginRight: spacing.xs }} />
              {searching ? 'Searching...' : 'Search'}
            </Button>
          )}
          {foundVehicle && (
            <Button
              variant="secondary"
              onClick={handleClear}
            >
              Change
            </Button>
          )}
        </div>
      </div>

      {/* Found Vehicle Display */}
      {foundVehicle && (
        <div style={{
          padding: spacing.md,
          border: `2px solid ${colors.success}`,
          borderRadius: '8px',
          backgroundColor: colors.success + '10',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          <Check size={20} color={colors.success} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: colors.neutral[900] }}>
              🚛 {foundVehicle.registration_number}
            </div>
            {(foundVehicle.make || foundVehicle.model) && (
              <div style={{ fontSize: '0.75rem', color: colors.neutral[600], marginTop: spacing.xs }}>
                {foundVehicle.make} {foundVehicle.model} {foundVehicle.year ? `(${foundVehicle.year})` : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create New Vehicle Form */}
      {showCreateForm && !foundVehicle && (
        <div style={{
          padding: spacing.md,
          border: `1px solid ${colors.neutral[300]}`,
          borderRadius: '8px',
          backgroundColor: colors.neutral[50],
          marginTop: spacing.md,
        }}>
          <div style={{ 
            fontSize: '0.875rem', 
            color: colors.neutral[700], 
            marginBottom: spacing.md,
            fontWeight: 500,
          }}>
            Vehicle not found. Create a new vehicle record:
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.md }}>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Make <span style={{ color: colors.error }}>*</span>
              </label>
              <Input
                type="text"
                value={newVehicleData.make}
                onChange={(e) => setNewVehicleData(prev => ({ ...prev, make: e.target.value }))}
                placeholder="e.g., Tata"
                required
              />
            </div>
            <div>
              <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                Model <span style={{ color: colors.error }}>*</span>
              </label>
              <Input
                type="text"
                value={newVehicleData.model}
                onChange={(e) => setNewVehicleData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="e.g., Ace"
                required
              />
            </div>
          </div>
          
          <div style={{ marginBottom: spacing.md }}>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
              Year <span style={{ color: colors.error }}>*</span>
            </label>
            <Input
              type="number"
              value={newVehicleData.year}
              onChange={(e) => setNewVehicleData(prev => ({ ...prev, year: e.target.value }))}
              placeholder={`e.g., ${new Date().getFullYear()}`}
              min="1900"
              max={new Date().getFullYear() + 1}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="primary"
              onClick={handleCreateVehicle}
              disabled={!registrationNumber.trim() || !newVehicleData.make.trim() || !newVehicleData.model.trim() || !newVehicleData.year || creating}
            >
              <Plus size={16} style={{ marginRight: spacing.xs }} />
              {creating ? 'Creating...' : 'Create Vehicle & Continue'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateForm(false);
                setNewVehicleData({ make: '', model: '', year: '' });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

