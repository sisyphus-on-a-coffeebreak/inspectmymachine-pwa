import React, { useMemo } from 'react';
import type { Vehicle } from '../../gatePassTypes';
import { colors, spacing, typography, buttonHoverStates } from '@/lib/theme';
import { getPrioritizedVehicleIds } from '@/lib/utils/vehicleHistory';

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
  const prioritizedIds = useMemo(() => getPrioritizedVehicleIds(), []);

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles.filter((v) => {
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

    // Sort: prioritized (recently used) first, then by registration number
    filtered.sort((a, b) => {
      const aIsPrioritized = prioritizedIds.includes(String(a.id));
      const bIsPrioritized = prioritizedIds.includes(String(b.id));
      
      if (aIsPrioritized && !bIsPrioritized) return -1;
      if (!aIsPrioritized && bIsPrioritized) return 1;
      
      // Both prioritized or both not - sort by registration number
      return (a.registration_number || '').localeCompare(b.registration_number || '');
    });

    return filtered;
  }, [vehicles, normalizedSelectedIds, searchTerm, filterFn, prioritizedIds]);

  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: colors.neutral[600] }}>
        Loading vehicles...
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
      {/* Autocomplete Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            onSearchChange(e.target.value);
            if (!showDropdown && e.target.value) {
              onToggle(); // Auto-open when typing
            }
          }}
          onFocus={() => {
            if (!showDropdown) {
              onToggle();
            }
          }}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: '8px',
            backgroundColor: 'white',
            fontSize: '0.875rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onBlur={(e) => {
            // Don't close if clicking on dropdown items
            const target = e.currentTarget;
            setTimeout(() => {
              // Check if target still exists and is mounted
              if (target && target.contains && document.activeElement) {
                if (!target.contains(document.activeElement)) {
                  // onToggle will be called by click handler if needed
                }
              }
            }, 200);
          }}
        />
        {searchTerm && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSearchChange('');
            }}
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: colors.neutral[500],
              padding: '0.25rem',
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown Menu - Autocomplete Results */}
      {showDropdown && (
        <div
          style={{
            marginTop: '0.5rem',
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: '8px',
            backgroundColor: 'white',
            maxHeight: '400px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000, // Increased z-index for table context
            position: 'absolute', // Changed to absolute for better positioning
            width: '100%',
            left: 0,
            right: 0,
          }}
        >
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
              filteredVehicles.map((vehicle, index) => {
                const isPrioritized = prioritizedIds.includes(String(vehicle.id));
                const isInYard = vehicle.current_status === 'In Yard' || vehicle.current_status === 'available';
                
                return (
                  <div
                    key={vehicle.id}
                    onClick={() => onSelect(String(vehicle.id))}
                    style={{
                      padding: '0.875rem 1rem',
                      borderBottom: `1px solid ${colors.neutral[100]}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: isPrioritized ? colors.primary[50] : 'white',
                      borderLeft: isPrioritized ? `3px solid ${colors.primary}` : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.primary[100];
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isPrioritized ? colors.primary[50] : 'white';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: colors.neutral[900],
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.xs,
                          }}
                        >
                          <span>🚛</span>
                          <span>{vehicle.registration_number}</span>
                          {isPrioritized && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: colors.primary[600],
                                backgroundColor: colors.primary[100],
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 500,
                              }}
                            >
                              Recent
                            </span>
                          )}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginTop: '0.25rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              color: isInYard ? colors.success[600] : colors.neutral[500],
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>{isInYard ? '✓' : '○'}</span>
                            {isInYard ? 'In Yard' : 'Out'}
                          </span>
                          {vehicle.current_location && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: colors.neutral[500],
                              }}
                            >
                              • 📍 {vehicle.current_location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};













