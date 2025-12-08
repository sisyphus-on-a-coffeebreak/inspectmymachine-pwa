import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { colors, spacing } from '../../../../lib/theme';

interface VehicleSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  searching: boolean;
  found: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const VehicleSearchInput: React.FC<VehicleSearchInputProps> = ({
  value,
  onChange,
  onSearch,
  onClear,
  searching,
  found,
  disabled = false,
  placeholder = 'Enter registration number (e.g., MH12AB1234)',
}) => {
  return (
    <div style={{ display: 'flex', gap: spacing.sm }}>
      <Input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          if (found) {
            onClear();
          }
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !found && !searching && value.trim()) {
            onSearch();
          }
        }}
        placeholder={placeholder}
        style={{ flex: 1 }}
        disabled={disabled || found}
      />
      {!found && (
        <Button
          variant="primary"
          onClick={onSearch}
          disabled={!value.trim() || searching || disabled}
        >
          <Search size={16} style={{ marginRight: spacing.xs }} />
          {searching ? 'Searching...' : 'Search'}
        </Button>
      )}
      {found && (
        <Button
          variant="secondary"
          onClick={onClear}
          disabled={disabled}
        >
          Change
        </Button>
      )}
    </div>
  );
};


