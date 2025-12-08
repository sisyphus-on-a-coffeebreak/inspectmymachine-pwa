import React, { useState } from 'react';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { Button } from '../ui/button';

export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const COLOR_PRESETS = [
  { name: 'Blue', value: '#1E40AF' },
  { name: 'Teal', value: '#0D9488' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Gold', value: '#D97706' },
  { name: 'Gray', value: '#4B5563' },
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handlePresetClick = (presetValue: string) => {
    onChange(presetValue);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <label style={{ ...typography.label, marginBottom: spacing.sm, display: 'block' }}>
        {label}
      </label>

      <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Color preview and hex input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            padding: spacing.xs,
            backgroundColor: 'white',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: borderRadius.sm,
              backgroundColor: value,
              border: `1px solid ${colors.neutral[300]}`,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            onClick={() => !disabled && setShowPicker(!showPicker)}
            aria-label="Color preview"
          />
          <input
            type="text"
            value={value}
            onChange={handleHexChange}
            disabled={disabled}
            pattern="^#[0-9A-Fa-f]{6}$"
            style={{
              ...typography.body,
              width: '100px',
              padding: spacing.xs,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.sm,
              fontFamily: 'monospace',
              fontSize: '14px',
            }}
            placeholder="#000000"
          />
        </div>

        {/* Preset colors */}
        <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
          <span style={{ ...typography.caption, color: colors.neutral[600], marginRight: spacing.xs }}>
            Presets:
          </span>
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => !disabled && handlePresetClick(preset.value)}
              disabled={disabled}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: borderRadius.sm,
                backgroundColor: preset.value,
                border: `2px solid ${value === preset.value ? colors.primary : colors.neutral[300]}`,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: disabled ? 0.5 : 1,
              }}
              aria-label={`Select ${preset.name} color`}
              title={preset.name}
            />
          ))}
        </div>
      </div>

      {/* Native color picker (hidden, can be shown if needed) */}
      {showPicker && !disabled && (
        <div style={{ marginTop: spacing.sm }}>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.md,
              cursor: 'pointer',
            }}
          />
        </div>
      )}
    </div>
  );
};
