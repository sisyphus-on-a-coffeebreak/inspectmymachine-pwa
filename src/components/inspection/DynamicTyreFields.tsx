import React, { useState, useEffect } from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../ui/button';

interface TyreField {
  id: string;
  position: string;
  brand: string;
  model: string;
  size: string;
  condition: string;
  tread_depth: number;
  pressure: number;
  damage: string[];
  photos: File[];
}

interface DynamicTyreFieldsProps {
  value?: TyreField[];
  onChange: (tyres: TyreField[]) => void;
  maxTyres?: number;
  disabled?: boolean;
}

const TYRE_POSITIONS = [
  'Front Left', 'Front Right', 'Rear Left', 'Rear Right',
  'Spare', 'Front Left Inner', 'Front Right Inner',
  'Rear Left Inner', 'Rear Right Inner'
];

const TYRE_CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'];
const DAMAGE_TYPES = ['Cuts', 'Cracks', 'Bulges', 'Uneven Wear', 'Sidewall Damage', 'Puncture'];

export const DynamicTyreFields: React.FC<DynamicTyreFieldsProps> = ({
  value = [],
  onChange,
  maxTyres = 10,
  disabled = false
}) => {
  const [tyres, setTyres] = useState<TyreField[]>(value);

  useEffect(() => {
    onChange(tyres);
  }, [tyres, onChange]);

  const addTyre = () => {
    if (tyres.length >= maxTyres) return;

    const newTyre: TyreField = {
      id: `tyre_${Date.now()}`,
      position: '',
      brand: '',
      model: '',
      size: '',
      condition: 'Good',
      tread_depth: 0,
      pressure: 0,
      damage: [],
      photos: []
    };

    setTyres([...tyres, newTyre]);
  };

  const removeTyre = (id: string) => {
    setTyres(tyres.filter(tyre => tyre.id !== id));
  };

  const updateTyre = (id: string, field: keyof TyreField, value: any) => {
    setTyres(tyres.map(tyre => 
      tyre.id === id ? { ...tyre, [field]: value } : tyre
    ));
  };

  const addDamage = (id: string, damage: string) => {
    const tyre = tyres.find(t => t.id === id);
    if (tyre && !tyre.damage.includes(damage)) {
      updateTyre(id, 'damage', [...tyre.damage, damage]);
    }
  };

  const removeDamage = (id: string, damage: string) => {
    const tyre = tyres.find(t => t.id === id);
    if (tyre) {
      updateTyre(id, 'damage', tyre.damage.filter(d => d !== damage));
    }
  };

  const handlePhotoUpload = (id: string, files: File[]) => {
    updateTyre(id, 'photos', files);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ ...typography.subheader, color: colors.neutral[900] }}>
          Tyre Inspection ({tyres.length} tyres)
        </h3>
        <Button
          variant="primary"
          onClick={addTyre}
          disabled={disabled || tyres.length >= maxTyres}
          icon="➕"
        >
          Add Tyre
        </Button>
      </div>

      {/* Tyre Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {tyres.map((tyre, index) => (
          <div
            key={tyre.id}
            style={{
              padding: spacing.lg,
              backgroundColor: colors.neutral[50],
              borderRadius: '12px',
              border: `1px solid ${colors.neutral[200]}`
            }}
          >
            {/* Tyre Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: spacing.md
            }}>
              <h4 style={{ ...typography.subheader, color: colors.neutral[900] }}>
                Tyre #{index + 1}
              </h4>
              <Button
                variant="secondary"
                onClick={() => removeTyre(tyre.id)}
                disabled={disabled}
                icon="🗑️"
                size="sm"
              >
                Remove
              </Button>
            </div>

            {/* Tyre Details Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: spacing.md,
              marginBottom: spacing.md
            }}>
              {/* Position */}
              <div>
                <label style={{ ...typography.label, color: colors.neutral[700], marginBottom: spacing.xs, display: 'block' }}>
                  Position *
                </label>
                <select
                  value={tyre.position}
                  onChange={(e) => updateTyre(tyre.id, 'position', e.target.value)}
                  disabled={disabled}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    borderRadius: '6px',
                    border: `1px solid ${colors.neutral[300]}`,
                    ...typography.body
                  }}
                >
                  <option value="">Select Position</option>
                  {TYRE_POSITIONS.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label style={{ ...typography.label, color: colors.neutral[700], marginBottom: spacing.xs, display: 'block' }}>
                  Brand
                </label>
                <input
                  type="text"
                  value={tyre.brand}
                  onChange={(e) => updateTyre(tyre.id, 'brand', e.target.value)}
                  disabled={disabled}
                  placeholder="e.g., Michelin, Bridgestone"
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    borderRadius: '6px',
                    border: `1px solid ${colors.neutral[300]}`,
                    ...typography.body
                  }}
                />
              </div>

              {/* Model */}
              <div>
                <label style={{ ...typography.label, color: colors.neutral[700], marginBottom: spacing.xs, display: 'block' }}>
                  Model
                </label>
                <input
                  type="text"
                  value={tyre.model}
                  onChange={(e) => updateTyre(tyre.id, 'model', e.target.value)}
                  disabled={disabled}
                  placeholder="e.g., XM2, Ecopia"
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    borderRadius: '6px',
                    border: `1px solid ${colors.neutral[300]}`,
                    ...typography.body
                  }}
                />
              </div>

              {/* Size */}
              <div>
                <label style={{ ...typography.label, color: colors.neutral[700], marginBottom: spacing.xs, display: 'block' }}>
                  Size
                </label>
                <input
                  type="text"
                  value={tyre.size}
                  onChange={(e) => updateTyre(tyre.id, 'size', e.target.value)}
                  disabled={disabled}
                  placeholder="e.g., 185/65R15"
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    borderRadius: '6px',
                    border: `1px solid ${colors.neutral[300]}`,
                    ...typography.body
                  }}
                />
              </div>

              {/* Condition */}
              <div>
                <label style={{ ...typography.label, color: colors.neutral[700], marginBottom: spacing.xs, display: 'block' }}>
                  Condition
                </label>
                <select
                  value={tyre.condition}
                  onChange={(e) => updateTyre(tyre.id, 'condition', e.target.value)}
                  disabled={disabled}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    borderRadius: '6px',
                    border: `1px solid ${colors.neutral[300]}`,
                    ...typography.body
                  }}
                >
                  {TYRE_CONDITIONS.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>

              {/* Tread Depth */}
              <div>
                <label style={{ ...typography.label, color: colors.neutral[700], marginBottom: spacing.xs, display: 'block' }}>
                  Tread Depth (mm)
                </label>
                <input
                  type="number"
                  value={tyre.tread_depth}
                  onChange={(e) => updateTyre(tyre.id, 'tread_depth', parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  min="0"
                  max="20"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    borderRadius: '6px',
                    border: `1px solid ${colors.neutral[300]}`,
                    ...typography.body
                  }}
                />
              </div>

              {/* Pressure */}
              <div>
                <label style={{ ...typography.label, color: colors.neutral[700], marginBottom: spacing.xs, display: 'block' }}>
                  Pressure (PSI)
                </label>
                <input
                  type="number"
                  value={tyre.pressure}
                  onChange={(e) => updateTyre(tyre.id, 'pressure', parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  min="0"
                  max="100"
                  step="0.1"
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    borderRadius: '6px',
                    border: `1px solid ${colors.neutral[300]}`,
                    ...typography.body
                  }}
                />
              </div>
            </div>

            {/* Damage Types */}
            <div style={{ marginBottom: spacing.md }}>
              <label style={{ ...typography.label, color: colors.neutral[700], marginBottom: spacing.sm, display: 'block' }}>
                Damage Types
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
                {DAMAGE_TYPES.map(damage => (
                  <label
                    key={damage}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      padding: spacing.xs,
                      backgroundColor: tyre.damage.includes(damage) ? colors.primary + '20' : colors.neutral[100],
                      borderRadius: '6px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      border: `1px solid ${tyre.damage.includes(damage) ? colors.primary : colors.neutral[300]}`
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={tyre.damage.includes(damage)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          addDamage(tyre.id, damage);
                        } else {
                          removeDamage(tyre.id, damage);
                        }
                      }}
                      disabled={disabled}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: '12px', color: colors.neutral[700] }}>
                      {damage}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label style={{ ...typography.label, color: colors.neutral[700], marginBottom: spacing.sm, display: 'block' }}>
                Photos
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handlePhotoUpload(tyre.id, files);
                }}
                disabled={disabled}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  borderRadius: '6px',
                  border: `1px solid ${colors.neutral[300]}`,
                  ...typography.body
                }}
              />
              {tyre.photos.length > 0 && (
                <div style={{ marginTop: spacing.sm, fontSize: '12px', color: colors.neutral[600] }}>
                  {tyre.photos.length} photo(s) uploaded
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {tyres.length === 0 && (
        <div style={{
          padding: spacing.xl,
          textAlign: 'center',
          backgroundColor: colors.neutral[50],
          borderRadius: '12px',
          border: `2px dashed ${colors.neutral[300]}`
        }}>
          <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>🛞</div>
          <p style={{ color: colors.neutral[600], marginBottom: spacing.sm }}>
            No tyres added yet
          </p>
          <Button
            variant="primary"
            onClick={addTyre}
            disabled={disabled}
            icon="➕"
          >
            Add First Tyre
          </Button>
        </div>
      )}
    </div>
  );
};

