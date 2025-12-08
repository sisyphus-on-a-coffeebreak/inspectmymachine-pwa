import React from 'react';
import type { Vehicle } from '../../gatePassTypes';
import { colors, spacing, typography, buttonHoverStates } from '../../../../lib/theme';

interface VehicleDropdownProps {
  vehicles: Vehicle[];
  selectedIds: string[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelect: (vehicleId: string) => void;
  loading?: boolean;
  placeholder?: string;
  showDropdown: boolean;
  onToggle: () => void;
  filterFn?: (vehicle: Vehicle) => boolean;
}

export const VehicleDropdown: React.FC<VehicleDropdownProps> = ({
  vehicles,
  selectedIds,
  searchTerm,
  onSearchChange,
  onSelect,
  loading = false,
  placeholder = 'Search by registration, make, model...',
  showDropdown,
  onToggle,
  filterFn,
}) => {
  const normalizedSelectedIds = selectedIds.map((id) => String(id));

  const filteredVehicles = vehicles.filter((v) => {
    const isSelected = normalizedSelectedIds.includes(String(v.id));
    if (isSelected) return false;

    // Apply custom filter if provided
    if (filterFn && !filterFn(v)) return false;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        v.registration_number?.toLowerCase().includes(searchLower) ||
        v.make?.toLowerCase().includes(searchLower) ||
        v.model?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: colors.neutral[600] }}>
        Loading vehicles...
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Dropdown Toggle */}
      <div
        onClick={onToggle}
        style={{
          padding: '0.75rem 1rem',
          border: `1px solid ${colors.neutral[300]}`,
          borderRadius: '8px',
          backgroundColor: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: colors.neutral[600], fontSize: '0.875rem' }}>
          Choose from yard inventory
        </span>
        <span style={{ fontSize: '0.75rem' }}>{showDropdown ? '▴' : '▾'}</span>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div
          style={{
            marginTop: '0.5rem',
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: '8px',
            backgroundColor: 'white',
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          {/* Search Input */}
          <div style={{ padding: '0.75rem', borderBottom: `1px solid ${colors.neutral[200]}` }}>
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Vehicle List */}
          <div>
            {filteredVehicles.length === 0 ? (
              <div
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: colors.neutral[600],
                  fontSize: '0.875rem',
                }}
              >
                {vehicles.length === 0
                  ? 'No vehicles available in yard'
                  : 'No vehicles found matching search'}
              </div>
            ) : (
              filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  onClick={() => onSelect(String(vehicle.id))}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: `1px solid ${colors.neutral[100]}`,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.neutral[50];
                    Object.assign(e.currentTarget.style, buttonHoverStates.hover);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      color: colors.neutral[900],
                    }}
                  >
                    🚛 {vehicle.registration_number}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: colors.neutral[600],
                      marginTop: '0.25rem',
                    }}
                  >
                    {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
                  </div>
                  {vehicle.current_location && (
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: colors.neutral[500],
                        marginTop: '0.25rem',
                      }}
                    >
                      📍 {vehicle.current_location}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


