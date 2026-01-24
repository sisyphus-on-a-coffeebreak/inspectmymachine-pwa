/**
 * Enhanced Capability Editor Component
 * 
 * Provides a comprehensive UI for managing enhanced capabilities with all
 * granularity layers: scope, fields, conditions, time, and context.
 */

import React, { useState } from 'react';
import { Button } from '../ui/button';
import type { EnhancedCapability, CapabilityModule, CapabilityAction } from '@/lib/permissions/types';
import { Plus, Trash2, Clock, Shield, Filter, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { colors, spacing, typography, cardStyles, borderRadius } from '@/lib/theme';

interface EnhancedCapabilityEditorProps {
  capabilities: EnhancedCapability[];
  onChange: (capabilities: EnhancedCapability[]) => void;
  readonly?: boolean;
}

export const EnhancedCapabilityEditor: React.FC<EnhancedCapabilityEditorProps> = ({
  capabilities,
  onChange,
  readonly = false
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const modules: CapabilityModule[] = ['gate_pass', 'inspection', 'expense', 'user_management', 'reports'];
  const actions: CapabilityAction[] = ['create', 'read', 'update', 'delete', 'approve', 'validate', 'review', 'reassign', 'export'];

  const moduleLabels: Record<CapabilityModule, string> = {
    gate_pass: 'Gate Pass',
    inspection: 'Inspection',
    expense: 'Expense',
    user_management: 'User Management',
    reports: 'Reports',
  };

  const actionLabels: Record<CapabilityAction, string> = {
    create: 'Create',
    read: 'Read',
    update: 'Update',
    delete: 'Delete',
    approve: 'Approve',
    validate: 'Validate',
    review: 'Review',
    reassign: 'Reassign',
    export: 'Export',
  };

  const addCapability = () => {
    const newCap: EnhancedCapability = {
      module: 'gate_pass',
      action: 'read',
    };
    onChange([...capabilities, newCap]);
    setExpandedIndex(capabilities.length);
  };

  const removeCapability = (index: number) => {
    onChange(capabilities.filter((_, i) => i !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const updateCapability = (index: number, updates: Partial<EnhancedCapability>) => {
    const updated = [...capabilities];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const getCapabilitySummary = (cap: EnhancedCapability): string => {
    const parts: string[] = [];
    
    if (cap.scope) parts.push(`Scope: ${cap.scope.type}`);
    if (cap.time_restrictions) parts.push('Time-restricted');
    if (cap.conditions) parts.push('Conditional');
    if (cap.context_restrictions) parts.push('Context-restricted');
    if (cap.field_permissions && cap.field_permissions.length > 0) parts.push('Field-restricted');
    if (cap.expires_at) parts.push('Temporary');
    
    return parts.length > 0 ? parts.join(' • ') : 'No restrictions';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <div>
          <div style={{ ...typography.label, marginBottom: spacing.xs }}>
            Enhanced Capabilities
          </div>
          <div style={{ ...typography.caption, color: colors.neutral[600] }}>
            Fine-grained permissions with scope, conditions, and time restrictions
          </div>
        </div>
        {!readonly && (
          <Button onClick={addCapability} variant="secondary" size="sm">
            <Plus size={16} style={{ marginRight: spacing.xs }} />
            Add Capability
          </Button>
        )}
      </div>

      {capabilities.length === 0 ? (
        <div style={{
          ...cardStyles.card,
          textAlign: 'center',
          padding: spacing.xl,
          color: colors.neutral[600]
        }}>
          No enhanced capabilities defined. Click "Add Capability" to start.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {capabilities.map((cap, index) => (
            <div
              key={index}
              style={{
                ...cardStyles.card,
                border: `2px solid ${expandedIndex === index ? colors.primary : colors.neutral[200]}`,
                transition: 'border-color 0.2s'
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: spacing.md
                }}
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1 }}>
                  <Shield size={20} color={colors.primary} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...typography.body, fontWeight: 600 }}>
                      {moduleLabels[cap.module]} • {actionLabels[cap.action]}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      {getCapabilitySummary(cap)}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
                  {expandedIndex === index ? (
                    <ChevronUp size={20} color={colors.neutral[600]} />
                  ) : (
                    <ChevronDown size={20} color={colors.neutral[600]} />
                  )}
                  {!readonly && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCapability(index);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedIndex === index && (
                <div style={{
                  borderTop: `1px solid ${colors.neutral[200]}`,
                  padding: spacing.md
                }}>
                  {/* Basic Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md, marginBottom: spacing.lg }}>
                    <div>
                      <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                        Module
                      </label>
                      <select
                        value={cap.module}
                        onChange={(e) => updateCapability(index, { module: e.target.value as CapabilityModule })}
                        disabled={readonly}
                        style={{
                          width: '100%',
                          padding: spacing.sm,
                          border: `1px solid ${colors.neutral[300]}`,
                          borderRadius: borderRadius.sm,
                          ...typography.body,
                          backgroundColor: readonly ? colors.neutral[100] : 'white'
                        }}
                      >
                        {modules.map(m => (
                          <option key={m} value={m}>{moduleLabels[m]}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                        Action
                      </label>
                      <select
                        value={cap.action}
                        onChange={(e) => updateCapability(index, { action: e.target.value as CapabilityAction })}
                        disabled={readonly}
                        style={{
                          width: '100%',
                          padding: spacing.sm,
                          border: `1px solid ${colors.neutral[300]}`,
                          borderRadius: borderRadius.sm,
                          ...typography.body,
                          backgroundColor: readonly ? colors.neutral[100] : 'white'
                        }}
                      >
                        {actions.map(a => (
                          <option key={a} value={a}>{actionLabels[a]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scope Configuration */}
                  <ScopeEditor
                    scope={cap.scope}
                    onChange={(scope) => updateCapability(index, { scope })}
                    readonly={readonly}
                  />

                  {/* Time Restrictions */}
                  <TimeRestrictionsEditor
                    restrictions={cap.time_restrictions}
                    onChange={(time_restrictions) => updateCapability(index, { time_restrictions })}
                    readonly={readonly}
                  />

                  {/* Conditions */}
                  <ConditionsEditor
                    conditions={cap.conditions}
                    onChange={(conditions) => updateCapability(index, { conditions })}
                    readonly={readonly}
                  />

                  {/* Context Restrictions */}
                  <ContextRestrictionsEditor
                    restrictions={cap.context_restrictions}
                    onChange={(context_restrictions) => updateCapability(index, { context_restrictions })}
                    readonly={readonly}
                  />

                  {/* Field Permissions */}
                  <FieldPermissionsEditor
                    fieldPermissions={cap.field_permissions}
                    onChange={(field_permissions) => updateCapability(index, { field_permissions })}
                    module={cap.module}
                    action={cap.action}
                    readonly={readonly}
                  />

                  {/* Metadata */}
                  <div style={{ marginTop: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.md }}>
                    <div>
                      <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                        Reason / Justification
                      </label>
                      <textarea
                        value={cap.reason || ''}
                        onChange={(e) => updateCapability(index, { reason: e.target.value })}
                        disabled={readonly}
                        placeholder="Why is this capability being granted?"
                        style={{
                          width: '100%',
                          padding: spacing.sm,
                          border: `1px solid ${colors.neutral[300]}`,
                          borderRadius: borderRadius.sm,
                          ...typography.body,
                          minHeight: '60px',
                          resize: 'vertical',
                          backgroundColor: readonly ? colors.neutral[100] : 'white'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                        Expires At (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={cap.expires_at ? cap.expires_at.substring(0, 16) : ''}
                        onChange={(e) => updateCapability(index, { expires_at: e.target.value ? `${e.target.value}:00` : undefined })}
                        disabled={readonly}
                        style={{
                          width: '100%',
                          padding: spacing.sm,
                          border: `1px solid ${colors.neutral[300]}`,
                          borderRadius: borderRadius.sm,
                          ...typography.body,
                          backgroundColor: readonly ? colors.neutral[100] : 'white'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ========================================
// Sub-Components
// ========================================

// Scope Editor Component
interface ScopeEditorProps {
  scope?: any;
  onChange: (scope: any) => void;
  readonly?: boolean;
}

const ScopeEditor: React.FC<ScopeEditorProps> = ({ scope, onChange, readonly = false }) => {
  const scopeTypes = [
    { value: 'all', label: 'All Records' },
    { value: 'own_only', label: 'Own Records Only' },
    { value: 'yard_only', label: 'Yard Records Only' },
    { value: 'department_only', label: 'Department Records Only' },
    { value: 'assigned_only', label: 'Assigned Records Only' },
    { value: 'custom', label: 'Custom Filter' },
  ];

  return (
    <div style={{ marginBottom: spacing.lg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
        <Filter size={18} color={colors.primary} />
        <label style={{ ...typography.label }}>Record Scope</label>
      </div>
      <select
        value={scope?.type || 'all'}
        onChange={(e) => onChange({ type: e.target.value as any, custom_filter: scope?.custom_filter })}
        disabled={readonly}
        style={{
          width: '100%',
          padding: spacing.sm,
          border: `1px solid ${colors.neutral[300]}`,
          borderRadius: borderRadius.sm,
          ...typography.body,
          backgroundColor: readonly ? colors.neutral[100] : 'white'
        }}
      >
        {scopeTypes.map(st => (
          <option key={st.value} value={st.value}>{st.label}</option>
        ))}
      </select>
      {scope?.type === 'custom' && (
        <input
          type="text"
          value={scope.custom_filter || ''}
          onChange={(e) => onChange({ ...scope, custom_filter: e.target.value })}
          disabled={readonly}
          placeholder="Custom filter expression (e.g., user.id == record.created_by)"
          style={{
            width: '100%',
            marginTop: spacing.sm,
            padding: spacing.sm,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.sm,
            ...typography.body,
            backgroundColor: readonly ? colors.neutral[100] : 'white'
          }}
        />
      )}
    </div>
  );
};

// Time Restrictions Editor Component
interface TimeRestrictionsEditorProps {
  restrictions?: any;
  onChange: (restrictions: any) => void;
  readonly?: boolean;
}

const TimeRestrictionsEditor: React.FC<TimeRestrictionsEditorProps> = ({ restrictions, onChange, readonly = false }) => {
  const [enabled, setEnabled] = useState(!!restrictions);

  const toggleEnabled = () => {
    if (enabled) {
      onChange(undefined);
      setEnabled(false);
    } else {
      onChange({});
      setEnabled(true);
    }
  };

  if (!enabled && !restrictions) {
    return (
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <Clock size={18} color={colors.primary} />
          <label style={{ ...typography.label }}>Time Restrictions</label>
        </div>
        {!readonly && (
          <Button onClick={toggleEnabled} variant="secondary" size="sm">
            Add Time Restrictions
          </Button>
        )}
      </div>
    );
  }

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  return (
    <div style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Clock size={18} color={colors.primary} />
          <label style={{ ...typography.label }}>Time Restrictions</label>
        </div>
        {!readonly && (
          <Button onClick={toggleEnabled} variant="destructive" size="sm">
            Remove
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
          <div>
            <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
              Valid From
            </label>
            <input
              type="datetime-local"
              value={restrictions?.valid_from ? restrictions.valid_from.substring(0, 16) : ''}
              onChange={(e) => onChange({ ...restrictions, valid_from: e.target.value ? `${e.target.value}:00` : undefined })}
              disabled={readonly}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
                backgroundColor: readonly ? colors.neutral[100] : 'white'
              }}
            />
          </div>
          <div>
            <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
              Valid Until
            </label>
            <input
              type="datetime-local"
              value={restrictions?.valid_until ? restrictions.valid_until.substring(0, 16) : ''}
              onChange={(e) => onChange({ ...restrictions, valid_until: e.target.value ? `${e.target.value}:00` : undefined })}
              disabled={readonly}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
                backgroundColor: readonly ? colors.neutral[100] : 'white'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
            Days of Week
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
            {daysOfWeek.map(day => (
              <label
                key={day.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: restrictions?.days_of_week?.includes(day.value) ? colors.primary + '20' : 'white',
                  border: `1px solid ${restrictions?.days_of_week?.includes(day.value) ? colors.primary : colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  cursor: readonly ? 'default' : 'pointer',
                  fontSize: '12px',
                }}
              >
                <input
                  type="checkbox"
                  checked={restrictions?.days_of_week?.includes(day.value) || false}
                  onChange={(e) => {
                    const current = restrictions?.days_of_week || [];
                    const updated = e.target.checked
                      ? [...current, day.value]
                      : current.filter((d: number) => d !== day.value);
                    onChange({ ...restrictions, days_of_week: updated });
                  }}
                  disabled={readonly}
                  style={{ cursor: readonly ? 'default' : 'pointer' }}
                />
                {day.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
          <div>
            <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
              Start Time (HH:MM)
            </label>
            <input
              type="time"
              value={restrictions?.time_of_day?.start || ''}
              onChange={(e) => onChange({
                ...restrictions,
                time_of_day: { ...restrictions?.time_of_day, start: e.target.value }
              })}
              disabled={readonly}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
                backgroundColor: readonly ? colors.neutral[100] : 'white'
              }}
            />
          </div>
          <div>
            <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
              End Time (HH:MM)
            </label>
            <input
              type="time"
              value={restrictions?.time_of_day?.end || ''}
              onChange={(e) => onChange({
                ...restrictions,
                time_of_day: { ...restrictions?.time_of_day, end: e.target.value }
              })}
              disabled={readonly}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
                backgroundColor: readonly ? colors.neutral[100] : 'white'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Conditions Editor Component
interface ConditionsEditorProps {
  conditions?: any;
  onChange: (conditions: any) => void;
  readonly?: boolean;
}

const ConditionsEditor: React.FC<ConditionsEditorProps> = ({ conditions, onChange, readonly = false }) => {
  const [enabled, setEnabled] = useState(!!conditions);

  const toggleEnabled = () => {
    if (enabled) {
      onChange(undefined);
      setEnabled(false);
    } else {
      onChange({ conditions: [], combine_with: 'AND' });
      setEnabled(true);
    }
  };

  if (!enabled && !conditions) {
    return (
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <Filter size={18} color={colors.primary} />
          <label style={{ ...typography.label }}>Conditions</label>
        </div>
        {!readonly && (
          <Button onClick={toggleEnabled} variant="secondary" size="sm">
            Add Conditions
          </Button>
        )}
      </div>
    );
  }

  const operators = [
    { value: '==', label: 'Equals (==)' },
    { value: '!=', label: 'Not Equals (!=)' },
    { value: '>', label: 'Greater Than (>)' },
    { value: '<', label: 'Less Than (<)' },
    { value: '>=', label: 'Greater or Equal (>=)' },
    { value: '<=', label: 'Less or Equal (<=)' },
    { value: 'in', label: 'In Array' },
    { value: 'not_in', label: 'Not In Array' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts With' },
  ];

  const addCondition = () => {
    onChange({
      ...conditions,
      conditions: [...(conditions?.conditions || []), { field: '', operator: '==', value: '' }]
    });
  };

  const updateCondition = (index: number, updates: any) => {
    const updated = [...(conditions?.conditions || [])];
    updated[index] = { ...updated[index], ...updates };
    onChange({ ...conditions, conditions: updated });
  };

  const removeCondition = (index: number) => {
    const updated = (conditions?.conditions || []).filter((_: any, i: number) => i !== index);
    onChange({ ...conditions, conditions: updated });
  };

  return (
    <div style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Filter size={18} color={colors.primary} />
          <label style={{ ...typography.label }}>Conditions</label>
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          {!readonly && (
            <>
              <Button onClick={addCondition} variant="secondary" size="sm">
                <Plus size={14} style={{ marginRight: spacing.xs }} />
                Add Condition
              </Button>
              <Button onClick={toggleEnabled} variant="destructive" size="sm">
                Remove
              </Button>
            </>
          )}
        </div>
      </div>

      <div style={{ marginBottom: spacing.md }}>
        <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
          Combine With
        </label>
        <select
          value={conditions?.combine_with || 'AND'}
          onChange={(e) => onChange({ ...conditions, combine_with: e.target.value as 'AND' | 'OR' })}
          disabled={readonly}
          style={{
            width: '100%',
            padding: spacing.sm,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.sm,
            ...typography.body,
            backgroundColor: readonly ? colors.neutral[100] : 'white'
          }}
        >
          <option value="AND">AND (All conditions must pass)</option>
          <option value="OR">OR (At least one condition must pass)</option>
        </select>
      </div>

      {(conditions?.conditions || []).map((condition: any, index: number) => (
        <div key={index} style={{
          padding: spacing.md,
          backgroundColor: 'white',
          borderRadius: borderRadius.sm,
          border: `1px solid ${colors.neutral[200]}`,
          marginBottom: spacing.sm
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.sm }}>
            <div style={{ ...typography.caption, fontWeight: 600 }}>Condition {index + 1}</div>
            {!readonly && (
              <Button
                onClick={() => removeCondition(index)}
                variant="destructive"
                size="sm"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr', gap: spacing.sm }}>
            <input
              type="text"
              value={condition.field || ''}
              onChange={(e) => updateCondition(index, { field: e.target.value })}
              disabled={readonly}
              placeholder="Field path (e.g., amount, status)"
              style={{
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
                backgroundColor: readonly ? colors.neutral[100] : 'white'
              }}
            />
            <select
              value={condition.operator || '=='}
              onChange={(e) => updateCondition(index, { operator: e.target.value })}
              disabled={readonly}
              style={{
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
                backgroundColor: readonly ? colors.neutral[100] : 'white'
              }}
            >
              {operators.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={condition.value || ''}
              onChange={(e) => updateCondition(index, { value: e.target.value })}
              disabled={readonly}
              placeholder="Value"
              style={{
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
                backgroundColor: readonly ? colors.neutral[100] : 'white'
              }}
            />
          </div>
        </div>
      ))}

      {conditions?.error_message && (
        <div style={{ marginTop: spacing.md }}>
          <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
            Custom Error Message
          </label>
          <input
            type="text"
            value={conditions.error_message}
            onChange={(e) => onChange({ ...conditions, error_message: e.target.value })}
            disabled={readonly}
            placeholder="Message shown when condition fails"
            style={{
              width: '100%',
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.sm,
              ...typography.body,
              backgroundColor: readonly ? colors.neutral[100] : 'white'
            }}
          />
        </div>
      )}
    </div>
  );
};

// Context Restrictions Editor Component
interface ContextRestrictionsEditorProps {
  restrictions?: any;
  onChange: (restrictions: any) => void;
  readonly?: boolean;
}

const ContextRestrictionsEditor: React.FC<ContextRestrictionsEditorProps> = ({ restrictions, onChange, readonly = false }) => {
  const [enabled, setEnabled] = useState(!!restrictions);

  const toggleEnabled = () => {
    if (enabled) {
      onChange(undefined);
      setEnabled(false);
    } else {
      onChange({});
      setEnabled(true);
    }
  };

  if (!enabled && !restrictions) {
    return (
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <Shield size={18} color={colors.primary} />
          <label style={{ ...typography.label }}>Context Restrictions</label>
        </div>
        {!readonly && (
          <Button onClick={toggleEnabled} variant="secondary" size="sm">
            Add Context Restrictions
          </Button>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Shield size={18} color={colors.primary} />
          <label style={{ ...typography.label }}>Context Restrictions</label>
        </div>
        {!readonly && (
          <Button onClick={toggleEnabled} variant="destructive" size="sm">
            Remove
          </Button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: readonly ? 'default' : 'pointer' }}>
          <input
            type="checkbox"
            checked={restrictions?.require_mfa || false}
            onChange={(e) => onChange({ ...restrictions, require_mfa: e.target.checked })}
            disabled={readonly}
            style={{ cursor: readonly ? 'default' : 'pointer' }}
          />
          <span style={typography.body}>Require Multi-Factor Authentication</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: readonly ? 'default' : 'pointer' }}>
          <input
            type="checkbox"
            checked={restrictions?.require_approval || false}
            onChange={(e) => onChange({ ...restrictions, require_approval: e.target.checked })}
            disabled={readonly}
            style={{ cursor: readonly ? 'default' : 'pointer' }}
          />
          <span style={typography.body}>Require Approval</span>
        </label>

        {restrictions?.require_approval && (
          <div>
            <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
              Approval From Roles (comma-separated)
            </label>
            <input
              type="text"
              value={restrictions?.approval_from_role?.join(', ') || ''}
              onChange={(e) => onChange({
                ...restrictions,
                approval_from_role: e.target.value.split(',').map((r: string) => r.trim()).filter(Boolean)
              })}
              disabled={readonly}
              placeholder="admin, supervisor"
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
                backgroundColor: readonly ? colors.neutral[100] : 'white'
              }}
            />
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, cursor: readonly ? 'default' : 'pointer' }}>
          <input
            type="checkbox"
            checked={restrictions?.require_reason || false}
            onChange={(e) => onChange({ ...restrictions, require_reason: e.target.checked })}
            disabled={readonly}
            style={{ cursor: readonly ? 'default' : 'pointer' }}
          />
          <span style={typography.body}>Require Justification</span>
        </label>

        <div>
          <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
            IP Whitelist (one per line or CIDR)
          </label>
          <textarea
            value={restrictions?.ip_whitelist?.join('\n') || ''}
            onChange={(e) => onChange({
              ...restrictions,
              ip_whitelist: e.target.value.split('\n').map((ip: string) => ip.trim()).filter(Boolean)
            })}
            disabled={readonly}
            placeholder="192.168.1.1&#10;10.0.0.0/8"
            style={{
              width: '100%',
              padding: spacing.sm,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.sm,
              ...typography.body,
              minHeight: '80px',
              backgroundColor: readonly ? colors.neutral[100] : 'white'
            }}
          />
        </div>

        <div>
          <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
            Allowed Device Types
          </label>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            {['mobile', 'desktop', 'tablet'].map(device => (
              <label
                key={device}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs,
                  cursor: readonly ? 'default' : 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={restrictions?.device_types?.includes(device) || false}
                  onChange={(e) => {
                    const current = restrictions?.device_types || [];
                    const updated = e.target.checked
                      ? [...current, device]
                      : current.filter((d: string) => d !== device);
                    onChange({ ...restrictions, device_types: updated });
                  }}
                  disabled={readonly}
                  style={{ cursor: readonly ? 'default' : 'pointer' }}
                />
                <span style={typography.body}>{device.charAt(0).toUpperCase() + device.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Field Permissions Editor Component
interface FieldPermissionsEditorProps {
  fieldPermissions?: any[];
  onChange: (fieldPermissions: any[]) => void;
  module: CapabilityModule;
  action: CapabilityAction;
  readonly?: boolean;
}

const FieldPermissionsEditor: React.FC<FieldPermissionsEditorProps> = ({
  fieldPermissions,
  onChange,
  module,
  action,
  readonly = false
}) => {
  const [enabled, setEnabled] = useState(!!fieldPermissions && fieldPermissions.length > 0);

  const toggleEnabled = () => {
    if (enabled) {
      onChange([]);
      setEnabled(false);
    } else {
      onChange([{ module, action: 'read', mode: 'whitelist', fields: [] }]);
      setEnabled(true);
    }
  };

  if (!enabled && (!fieldPermissions || fieldPermissions.length === 0)) {
    return (
      <div style={{ marginBottom: spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <Eye size={18} color={colors.primary} />
          <label style={{ ...typography.label }}>Field Permissions</label>
        </div>
        {!readonly && (
          <Button onClick={toggleEnabled} variant="secondary" size="sm">
            Add Field Permissions
          </Button>
        )}
      </div>
    );
  }

  const updateFieldPermission = (index: number, updates: any) => {
    const updated = [...(fieldPermissions || [])];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeFieldPermission = (index: number) => {
    const updated = (fieldPermissions || []).filter((_: any, i: number) => i !== index);
    onChange(updated);
    if (updated.length === 0) {
      setEnabled(false);
    }
  };

  const addFieldPermission = () => {
    onChange([...(fieldPermissions || []), { module, action: 'read', mode: 'whitelist', fields: [] }]);
  };

  return (
    <div style={{ marginBottom: spacing.lg, padding: spacing.md, backgroundColor: colors.neutral[50], borderRadius: borderRadius.sm }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <Eye size={18} color={colors.primary} />
          <label style={{ ...typography.label }}>Field Permissions</label>
        </div>
        {!readonly && (
          <Button onClick={addFieldPermission} variant="secondary" size="sm">
            <Plus size={14} style={{ marginRight: spacing.xs }} />
            Add Rule
          </Button>
        )}
      </div>

      {(fieldPermissions || []).map((fp: any, index: number) => (
        <div key={index} style={{
          padding: spacing.md,
          backgroundColor: 'white',
          borderRadius: borderRadius.sm,
          border: `1px solid ${colors.neutral[200]}`,
          marginBottom: spacing.sm
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: spacing.sm }}>
            <div style={{ ...typography.caption, fontWeight: 600 }}>Field Rule {index + 1}</div>
            {!readonly && (
              <Button
                onClick={() => removeFieldPermission(index)}
                variant="destructive"
                size="sm"
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.sm, marginBottom: spacing.sm }}>
            <div>
              <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
                Action
              </label>
              <select
                value={fp.action || 'read'}
                onChange={(e) => updateFieldPermission(index, { action: e.target.value })}
                disabled={readonly}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                  backgroundColor: readonly ? colors.neutral[100] : 'white'
                }}
              >
                <option value="read">Read</option>
                <option value="update">Update</option>
              </select>
            </div>
            <div>
              <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
                Mode
              </label>
              <select
                value={fp.mode || 'whitelist'}
                onChange={(e) => updateFieldPermission(index, { mode: e.target.value })}
                disabled={readonly}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.sm,
                  ...typography.body,
                  backgroundColor: readonly ? colors.neutral[100] : 'white'
                }}
              >
                <option value="whitelist">Whitelist (Only these fields)</option>
                <option value="blacklist">Blacklist (Exclude these fields)</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ ...typography.caption, display: 'block', marginBottom: spacing.xs }}>
              Fields (comma-separated)
            </label>
            <input
              type="text"
              value={fp.fields?.join(', ') || ''}
              onChange={(e) => updateFieldPermission(index, {
                fields: e.target.value.split(',').map((f: string) => f.trim()).filter(Boolean)
              })}
              disabled={readonly}
              placeholder="amount, status, notes"
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.sm,
                ...typography.body,
                backgroundColor: readonly ? colors.neutral[100] : 'white'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};








