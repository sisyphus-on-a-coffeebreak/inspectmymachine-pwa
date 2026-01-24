/**
 * Bulk Pass Creation Grid Component
 * 
 * Simplified table view with modal editing for better UX
 * Solves dropdown clipping issues and provides more space for complex fields
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { validateMobileNumber, formatMobileNumber } from '@/lib/validation';
import { BulkPassRowModal } from './BulkPassRowModal';
import type { GatePassType } from '../gatePassTypes';
import { CheckCircle, XCircle, Plus, Trash2, Copy, Edit2 } from 'lucide-react';

interface BulkPassRow {
  id: string;
  data: Record<string, any>;
  validation: {
    isValid: boolean;
    errors: Record<string, string>;
    touched: Set<string>;
  };
}

interface BulkPassCreationGridProps {
  passType: GatePassType;
  yardId?: string;
  onValidate?: (rows: BulkPassRow[]) => void;
  onSubmit?: (rows: BulkPassRow[]) => Promise<void>;
}

// Get display fields for simplified table view
const getDisplayFields = (passType: GatePassType) => {
  if (passType === 'visitor') {
    return [
      { key: 'visitor_name', label: 'Visitor Name' },
      { key: 'visitor_phone', label: 'Phone' },
      { key: 'purpose', label: 'Purpose' },
    ];
  } else if (passType === 'vehicle_inbound') {
    return [
      { key: 'vehicle_registration', label: 'Vehicle Reg' },
      { key: 'purpose', label: 'Purpose' },
    ];
  } else { // vehicle_outbound
    return [
      { key: 'vehicle_id', label: 'Vehicle' },
      { key: 'driver_name', label: 'Driver' },
      { key: 'destination', label: 'Destination' },
    ];
  }
};

export const BulkPassCreationGrid: React.FC<BulkPassCreationGridProps> = ({
  passType,
  yardId,
  onValidate,
  onSubmit,
}) => {
  const displayFields = getDisplayFields(passType);
  const [rows, setRows] = useState<BulkPassRow[]>([
    {
      id: `row-${Date.now()}`,
      data: {},
      validation: { isValid: false, errors: {}, touched: new Set() },
    },
  ]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationSummary, setValidationSummary] = useState<{ valid: number; invalid: number }>({ valid: 0, invalid: 0 });

  // Validate a single row
  const validateRow = useCallback((row: BulkPassRow): BulkPassRow => {
    const errors: Record<string, string> = {};
    const touched = new Set<string>();

    // Required fields based on pass type
    const requiredFields: string[] = [];
    if (passType === 'visitor') {
      requiredFields.push('visitor_name', 'visitor_phone', 'referred_by', 'purpose', 'valid_from', 'valid_to');
    } else if (passType === 'vehicle_outbound') {
      requiredFields.push('vehicle_id', 'driver_name', 'driver_contact', 'destination', 'purpose', 'valid_from', 'valid_to');
    } else if (passType === 'vehicle_inbound') {
      requiredFields.push('vehicle_registration', 'purpose', 'valid_from', 'valid_to');
    }

    requiredFields.forEach((field) => {
      const value = row.data[field];
      if (field === 'vehicle_id') {
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors[field] = `${field.replace(/_/g, ' ')} is required`;
          touched.add(field);
        }
      } else if (field === 'vehicles_to_view') {
        const vehicles = Array.isArray(value) ? value : (value ? [value] : []);
        if (vehicles.length === 0) {
          errors[field] = `${field.replace(/_/g, ' ')} is required`;
          touched.add(field);
        }
      } else if (!value || (typeof value === 'string' && !value.trim())) {
        errors[field] = `${field.replace(/_/g, ' ')} is required`;
        touched.add(field);
      } else {
        // Specific validations
        if (field === 'visitor_phone' || field === 'driver_contact') {
          const cleanValue = String(value).replace(/\D/g, '');
          const validation = validateMobileNumber(cleanValue);
          if (!validation.isValid) {
            errors[field] = validation.error || 'Phone must be 10 digits between 6000000000 and 9999999999';
            touched.add(field);
          }
        }
        if (field === 'valid_to' && row.data.valid_from) {
          const fromDate = new Date(row.data.valid_from);
          const toDate = new Date(value);
          if (toDate < fromDate) {
            errors[field] = 'Valid To must be after Valid From';
            touched.add(field);
          }
        }
      }
    });

    return {
      ...row,
      validation: {
        isValid: Object.keys(errors).length === 0,
        errors,
        touched,
      },
    };
  }, [passType]);

  // Validate all rows
  const validateAll = useCallback(() => {
    setRows((prevRows) => {
      const validatedRows = prevRows.map(validateRow);
      
      const valid = validatedRows.filter(r => r.validation.isValid).length;
      const invalid = validatedRows.length - valid;
      setValidationSummary({ valid, invalid });
      
      // Don't call onValidate here - it will be called in useEffect after state updates
      
      return validatedRows;
    });
  }, [validateRow]);

  // Update row data
  const updateRow = useCallback((rowId: string, data: Record<string, any>) => {
    setRows((prevRows) => {
      const newRows = prevRows.map((row) => {
        if (row.id === rowId) {
          const updatedRow = { ...row, data };
          return validateRow(updatedRow);
        }
        return row;
      });
      
      // Update validation summary
      const valid = newRows.filter(r => r.validation.isValid).length;
      const invalid = newRows.length - valid;
      setValidationSummary({ valid, invalid });
      
      // Don't call onValidate here - it will be called in useEffect after state updates
      
      return newRows;
    });
  }, [validateRow]);

  // Add new row
  const addRow = useCallback(() => {
    setRows((prevRows) => [
      ...prevRows,
      {
        id: `row-${Date.now()}-${Math.random()}`,
        data: {},
        validation: { isValid: false, errors: {}, touched: new Set() },
      },
    ]);
  }, []);

  // Remove row
  const removeRow = useCallback((rowId: string) => {
    setRows((prevRows) => prevRows.filter((r) => r.id !== rowId));
  }, []);

  // Duplicate row
  const duplicateRow = useCallback((rowId: string) => {
    setRows((prevRows) => {
      const rowToDuplicate = prevRows.find((r) => r.id === rowId);
      if (!rowToDuplicate) return prevRows;
      
      return [
        ...prevRows,
        {
          id: `row-${Date.now()}-${Math.random()}`,
          data: { ...rowToDuplicate.data },
          validation: { isValid: false, errors: {}, touched: new Set() },
        },
      ];
    });
  }, []);

  // Clear all rows
  const clearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all rows?')) {
      setRows([
        {
          id: `row-${Date.now()}`,
          data: {},
          validation: { isValid: false, errors: {}, touched: new Set() },
        },
      ]);
      setValidationSummary({ valid: 0, invalid: 0 });
    }
  }, []);

  // Submit all valid rows
  const handleSubmit = useCallback(async () => {
    // Get current valid rows directly from state
    let validRows: BulkPassRow[] = [];
    
    setRows((prevRows) => {
      const validatedRows = prevRows.map(validateRow);
      validRows = validatedRows.filter(r => r.validation.isValid);
      
      if (validRows.length === 0) {
        alert('Please fix errors before submitting');
        return prevRows;
      }
      
      return validatedRows;
    });
    
    // Call onSubmit after render completes to avoid render-phase updates
    if (validRows.length > 0 && onSubmit) {
      // Use setTimeout to defer the call until after render
      setTimeout(async () => {
        try {
          setSubmitting(true);
          await onSubmit(validRows);
        } catch (error) {
          console.error('Submit error:', error);
        } finally {
          setSubmitting(false);
        }
      }, 0);
    }
  }, [validateRow, onSubmit]);

  // Call onValidate after rows change (but not during render)
  useEffect(() => {
    if (onValidate && rows.length > 0) {
      // Use setTimeout to ensure this runs after render
      const timeoutId = setTimeout(() => {
        onValidate(rows);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [rows, onValidate]);

  // Get display value for a field
  const getDisplayValue = (row: BulkPassRow, fieldKey: string): string => {
    const value = row.data[fieldKey];
    if (!value) return '-';
    
    if (fieldKey === 'visitor_phone' || fieldKey === 'driver_contact') {
      return formatMobileNumber(String(value));
    }
    
    if (fieldKey === 'vehicle_id') {
      // For vehicle_id, we'd need to fetch vehicle name, but for now show ID
      return value ? `Vehicle Selected` : '-';
    }
    
    if (fieldKey === 'purpose') {
      return String(value).charAt(0).toUpperCase() + String(value).slice(1).replace('_', ' ');
    }
    
    return String(value);
  };

  const editingRow = rows.find(r => r.id === editingRowId);
  const editingRowIndex = editingRow ? rows.findIndex(r => r.id === editingRowId) : -1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md }}>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <Button variant="secondary" onClick={addRow} icon={<Plus size={16} />}>
            Add Row
          </Button>
          <Button variant="secondary" onClick={clearAll} disabled={rows.length === 0}>
            Clear All
          </Button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
            Valid: <strong style={{ color: colors.success[600] }}>{validationSummary.valid}</strong> | 
            Invalid: <strong style={{ color: colors.error[600] }}>{validationSummary.invalid}</strong>
          </span>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting || validationSummary.valid === 0}
            icon={submitting ? '⏳' : '🚀'}
          >
            {submitting ? 'Submitting...' : `Submit ${validationSummary.valid} Pass${validationSummary.valid !== 1 ? 'es' : ''}`}
          </Button>
        </div>
      </div>

      {/* Simplified Table */}
      <div
        style={{
          border: `1px solid ${colors.neutral[200]}`,
          borderRadius: borderRadius.lg,
          overflow: 'auto',
          maxHeight: '600px',
          backgroundColor: 'white',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: colors.neutral[50] }}>
            <tr>
              <th style={{ padding: spacing.sm, textAlign: 'left', borderBottom: `2px solid ${colors.neutral[300]}`, minWidth: '50px' }}>
                #
              </th>
              {displayFields.map((field) => (
                <th
                  key={field.key}
                  style={{
                    padding: spacing.sm,
                    textAlign: 'left',
                    borderBottom: `2px solid ${colors.neutral[300]}`,
                    fontWeight: 600,
                    color: colors.neutral[700],
                  }}
                >
                  {field.label}
                </th>
              ))}
              <th style={{ padding: spacing.sm, textAlign: 'center', borderBottom: `2px solid ${colors.neutral[300]}`, minWidth: '120px' }}>
                Status
              </th>
              <th style={{ padding: spacing.sm, textAlign: 'center', borderBottom: `2px solid ${colors.neutral[300]}`, minWidth: '150px' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={displayFields.length + 3} style={{ padding: spacing.xl, textAlign: 'center', color: colors.neutral[500] }}>
                  No rows yet. Click "Add Row" to get started.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: row.validation.isValid ? colors.success[50] : (Object.keys(row.validation.errors).length > 0 ? colors.error[50] : 'white'),
                    borderBottom: `1px solid ${colors.neutral[200]}`,
                    cursor: 'pointer',
                  }}
                  onClick={() => setEditingRowId(row.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = row.validation.isValid 
                      ? colors.success[100] 
                      : (Object.keys(row.validation.errors).length > 0 ? colors.error[100] : colors.neutral[50]);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = row.validation.isValid 
                      ? colors.success[50] 
                      : (Object.keys(row.validation.errors).length > 0 ? colors.error[50] : 'white');
                  }}
                >
                  <td style={{ padding: spacing.sm, textAlign: 'center', color: colors.neutral[600], fontWeight: 600 }}>
                    {rowIndex + 1}
                  </td>
                  {displayFields.map((field) => (
                    <td
                      key={field.key}
                      style={{
                        padding: spacing.sm,
                        color: colors.neutral[700],
                      }}
                    >
                      {getDisplayValue(row, field.key)}
                    </td>
                  ))}
                  <td style={{ padding: spacing.sm, textAlign: 'center' }}>
                    {row.validation.isValid ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, color: colors.success[600] }}>
                        <CheckCircle size={16} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Valid</span>
                      </div>
                    ) : Object.keys(row.validation.errors).length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, color: colors.error[600] }}>
                        <XCircle size={16} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                          {Object.keys(row.validation.errors).length} error(s)
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: colors.neutral[500] }}>Incomplete</span>
                    )}
                  </td>
                  <td 
                    style={{ padding: spacing.sm, textAlign: 'center' }}
                    onClick={(e) => e.stopPropagation()} // Prevent row click
                  >
                    <div style={{ display: 'flex', gap: spacing.xs, justifyContent: 'center' }}>
                      <button
                        onClick={() => setEditingRowId(row.id)}
                        style={{
                          padding: '6px 12px',
                          border: `1px solid ${colors.primary[300]}`,
                          backgroundColor: colors.primary[50],
                          cursor: 'pointer',
                          borderRadius: borderRadius.md,
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          color: colors.primary[700],
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.primary[100];
                          e.currentTarget.style.borderColor = colors.primary[400];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.primary[50];
                          e.currentTarget.style.borderColor = colors.primary[300];
                        }}
                        title="Edit row"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => duplicateRow(row.id)}
                        style={{
                          padding: '6px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          borderRadius: borderRadius.md,
                          display: 'flex',
                          alignItems: 'center',
                          color: colors.neutral[600],
                        }}
                        title="Duplicate row"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => removeRow(row.id)}
                        style={{
                          padding: '6px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          borderRadius: borderRadius.md,
                          display: 'flex',
                          alignItems: 'center',
                          color: colors.error[600],
                        }}
                        title="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Instructions */}
      <div style={{ ...typography.caption, color: colors.neutral[600], padding: spacing.sm, backgroundColor: colors.neutral[50], borderRadius: borderRadius.md }}>
        <strong>💡 Tip:</strong> Click on any row or the "Edit" button to open a full form modal with all fields. This provides more space for complex fields like vehicle selection.
      </div>

      {/* Edit Modal */}
      {editingRow && (
        <BulkPassRowModal
          isOpen={!!editingRowId}
          onClose={() => setEditingRowId(null)}
          rowData={editingRow.data}
          passType={passType}
          yardId={yardId}
          errors={editingRow.validation.errors}
          touched={editingRow.validation.touched}
          onSave={(data) => {
            updateRow(editingRowId!, data);
            setEditingRowId(null);
          }}
          rowIndex={editingRowIndex}
        />
      )}
    </div>
  );
};
