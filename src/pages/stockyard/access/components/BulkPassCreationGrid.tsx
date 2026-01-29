/**
 * Bulk Pass Creation Grid Component
 * 
 * Spreadsheet-like interface for efficient bulk pass creation
 * - Inline editing in table cells
 * - CSV import/export
 * - Bulk actions (fill down, apply to all)
 * - Keyboard navigation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { colors, spacing, typography, borderRadius } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { validateMobileNumber, formatMobileNumber } from '@/lib/validation';
import type { GatePassType, GatePassPurpose } from '../gatePassTypes';
import { CheckCircle, XCircle, Plus, Trash2, Copy, Download, Upload, ArrowDown, ArrowUp } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';

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

// Get all editable fields for the pass type
const getAllFields = (passType: GatePassType) => {
  if (passType === 'visitor') {
    return [
      { key: 'visitor_name', label: 'Visitor Name', type: 'text', required: true },
      { key: 'visitor_phone', label: 'Phone', type: 'tel', required: true },
      { key: 'visitor_company', label: 'Company', type: 'text', required: false },
      { key: 'referred_by', label: 'Referred By', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose', type: 'select', required: true, options: ['inspection', 'service', 'delivery', 'meeting', 'other'] },
      { key: 'valid_from', label: 'Valid From', type: 'datetime-local', required: true },
      { key: 'valid_to', label: 'Valid To', type: 'datetime-local', required: true },
      { key: 'vehicles_to_view', label: 'Vehicles (IDs)', type: 'text', required: false, placeholder: 'Comma-separated IDs' },
      { key: 'notes', label: 'Notes', type: 'textarea', required: false },
    ];
  } else if (passType === 'vehicle_outbound') {
    return [
      { key: 'vehicle_id', label: 'Vehicle ID', type: 'text', required: true },
      { key: 'driver_name', label: 'Driver Name', type: 'text', required: true },
      { key: 'driver_contact', label: 'Driver Contact', type: 'tel', required: true },
      { key: 'destination', label: 'Destination', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose', type: 'select', required: true, options: ['rto_work', 'sold', 'test_drive', 'service', 'auction', 'other'] },
      { key: 'valid_from', label: 'Valid From', type: 'datetime-local', required: true },
      { key: 'valid_to', label: 'Valid To', type: 'datetime-local', required: true },
      { key: 'expected_return_date', label: 'Return Date', type: 'date', required: false },
      { key: 'expected_return_time', label: 'Return Time', type: 'time', required: false },
      { key: 'notes', label: 'Notes', type: 'textarea', required: false },
    ];
  } else { // vehicle_inbound
    return [
      { key: 'vehicle_registration', label: 'Vehicle Reg', type: 'text', required: true },
      { key: 'driver_name', label: 'Driver Name', type: 'text', required: false },
      { key: 'driver_contact', label: 'Driver Contact', type: 'tel', required: false },
      { key: 'purpose', label: 'Purpose', type: 'select', required: true, options: ['service', 'delivery', 'inspection', 'other'] },
      { key: 'valid_from', label: 'Valid From', type: 'datetime-local', required: true },
      { key: 'valid_to', label: 'Valid To', type: 'datetime-local', required: true },
      { key: 'notes', label: 'Notes', type: 'textarea', required: false },
    ];
  }
};

// Format datetime-local input value
const formatForDateTimeLocal = (value: string | undefined): string => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

export const BulkPassCreationGrid: React.FC<BulkPassCreationGridProps> = ({
  passType,
  yardId,
  onValidate,
  onSubmit,
}) => {
  const { showToast } = useToast();
  const fields = getAllFields(passType);
  const [rows, setRows] = useState<BulkPassRow[]>([
    {
      id: `row-${Date.now()}`,
      data: {},
      validation: { isValid: false, errors: {}, touched: new Set() },
    },
  ]);
  const [editingCell, setEditingCell] = useState<{ rowId: string; fieldKey: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationSummary, setValidationSummary] = useState<{ valid: number; invalid: number }>({ valid: 0, invalid: 0 });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const tableRef = useRef<HTMLTableElement>(null);

  // Validate a single row
  const validateRow = useCallback((row: BulkPassRow): BulkPassRow => {
    const errors: Record<string, string> = {};
    const touched = new Set<string>();

    fields.forEach((field) => {
      if (field.required) {
        const value = row.data[field.key];
        if (field.key === 'vehicle_id' || field.key === 'vehicles_to_view') {
        if (!value || (typeof value === 'string' && !value.trim())) {
            errors[field.key] = `${field.label} is required`;
            touched.add(field.key);
        }
        } else if (field.key === 'vehicles_to_view') {
        const vehicles = Array.isArray(value) ? value : (value ? [value] : []);
          if (vehicles.length === 0 && field.required) {
            errors[field.key] = `${field.label} is required`;
            touched.add(field.key);
        }
      } else if (!value || (typeof value === 'string' && !value.trim())) {
          errors[field.key] = `${field.label} is required`;
          touched.add(field.key);
      } else {
        // Specific validations
          if (field.key === 'visitor_phone' || field.key === 'driver_contact') {
          const cleanValue = String(value).replace(/\D/g, '');
          const validation = validateMobileNumber(cleanValue);
          if (!validation.isValid) {
              errors[field.key] = validation.error || 'Phone must be 10 digits';
              touched.add(field.key);
            }
          }
          if (field.key === 'valid_to' && row.data.valid_from) {
          const fromDate = new Date(row.data.valid_from);
          const toDate = new Date(value);
          if (toDate < fromDate) {
              errors[field.key] = 'Valid To must be after Valid From';
              touched.add(field.key);
            }
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
  }, [fields]);

  // Validate all rows
  const validateAll = useCallback(() => {
    setRows((prevRows) => {
      const validatedRows = prevRows.map(validateRow);
      const valid = validatedRows.filter(r => r.validation.isValid).length;
      const invalid = validatedRows.length - valid;
      setValidationSummary({ valid, invalid });
      return validatedRows;
    });
  }, [validateRow]);

  // Update cell value
  const updateCell = useCallback((rowId: string, fieldKey: string, value: any) => {
    setRows((prevRows) => {
      const newRows = prevRows.map((row) => {
        if (row.id === rowId) {
          const updatedData = { ...row.data, [fieldKey]: value };
          const updatedRow = { ...row, data: updatedData };
          return validateRow(updatedRow);
        }
        return row;
      });
      
      const valid = newRows.filter(r => r.validation.isValid).length;
      const invalid = newRows.length - valid;
      setValidationSummary({ valid, invalid });
      
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

  // Remove row(s)
  const removeRows = useCallback((rowIds: string[]) => {
    setRows((prevRows) => prevRows.filter((r) => !rowIds.includes(r.id)));
    setSelectedRows(new Set());
  }, []);

  // Duplicate row(s)
  const duplicateRows = useCallback((rowIds: string[]) => {
    setRows((prevRows) => {
      const rowsToDuplicate = prevRows.filter((r) => rowIds.includes(r.id));
      const newRows = rowsToDuplicate.map((row) => ({
          id: `row-${Date.now()}-${Math.random()}`,
        data: { ...row.data },
          validation: { isValid: false, errors: {}, touched: new Set() },
      }));
      return [...prevRows, ...newRows];
    });
  }, []);

  // Fill down - copy value from selected cell to cells below
  const fillDown = useCallback((rowId: string, fieldKey: string) => {
    const rowIndex = rows.findIndex(r => r.id === rowId);
    if (rowIndex === -1) return;
    
    const value = rows[rowIndex].data[fieldKey];
    setRows((prevRows) => {
      const newRows = [...prevRows];
      for (let i = rowIndex + 1; i < newRows.length; i++) {
        newRows[i] = {
          ...newRows[i],
          data: { ...newRows[i].data, [fieldKey]: value },
        };
        newRows[i] = validateRow(newRows[i]);
      }
      return newRows;
    });
    validateAll();
  }, [rows, validateRow, validateAll]);

  // Apply to all - copy value to all rows
  const applyToAll = useCallback((fieldKey: string, value: any) => {
    setRows((prevRows) => {
      return prevRows.map((row) => {
        const updatedRow = {
          ...row,
          data: { ...row.data, [fieldKey]: value },
        };
        return validateRow(updatedRow);
      });
    });
    validateAll();
  }, [validateRow, validateAll]);

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
      setSelectedRows(new Set());
    }
  }, []);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = fields.map(f => f.label);
    const csvRows = rows.map(row => {
      return fields.map(field => {
        const value = row.data[field.key];
        if (value === null || value === undefined) return '';
        if (Array.isArray(value)) return value.join(';');
        return String(value).replace(/"/g, '""');
      });
    });

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-passes-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showToast({
      title: 'Exported',
      description: `Exported ${rows.length} rows to CSV`,
      variant: 'success',
    });
  }, [rows, fields, showToast]);

  // Import from CSV
  const importFromCSV = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        showToast({
          title: 'Import Error',
          description: 'CSV file must have at least a header row and one data row',
          variant: 'error',
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const fieldMap: Record<string, string> = {};
      fields.forEach(field => {
        const headerIndex = headers.findIndex(h => h.toLowerCase() === field.label.toLowerCase());
        if (headerIndex !== -1) {
          fieldMap[headers[headerIndex]] = field.key;
        }
      });

      const newRows: BulkPassRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rowData: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          const fieldKey = fieldMap[header];
          if (fieldKey && values[index]) {
            rowData[fieldKey] = values[index];
          }
        });

        newRows.push({
          id: `row-${Date.now()}-${i}-${Math.random()}`,
          data: rowData,
          validation: { isValid: false, errors: {}, touched: new Set() },
        });
      }

      setRows(newRows);
      validateAll();
      
      showToast({
        title: 'Imported',
        description: `Imported ${newRows.length} rows from CSV`,
        variant: 'success',
      });
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  }, [fields, validateAll, showToast]);

  // Submit all valid rows
  const handleSubmit = useCallback(async () => {
    const validatedRows = rows.map(validateRow);
    const validRows = validatedRows.filter(r => r.validation.isValid);
      
      if (validRows.length === 0) {
      showToast({
        title: 'Validation Error',
        description: 'Please fix errors before submitting',
        variant: 'error',
      });
      return;
    }
    
    if (onSubmit) {
        try {
          setSubmitting(true);
          await onSubmit(validRows);
        } catch (error) {
          console.error('Submit error:', error);
        } finally {
          setSubmitting(false);
        }
    }
  }, [rows, validateRow, onSubmit, showToast]);

  // Call onValidate after rows change
  useEffect(() => {
    if (onValidate && rows.length > 0) {
      const timeoutId = setTimeout(() => {
        onValidate(rows);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [rows, onValidate]);

  // Validate on mount and when fields change
  useEffect(() => {
    validateAll();
  }, [validateAll]);

  // Render cell editor
  const renderCellEditor = (row: BulkPassRow, field: typeof fields[0]) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.fieldKey === field.key;
    const value = row.data[field.key] || '';
    const error = row.validation.errors[field.key];
    const hasError = !!error;

    if (!isEditing) {
      // Display mode
      let displayValue = '';
      if (field.type === 'tel' && value) {
        displayValue = formatMobileNumber(String(value));
      } else if (field.type === 'datetime-local' && value) {
        displayValue = new Date(value).toLocaleString();
      } else if (field.type === 'textarea' && value) {
        displayValue = String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '');
      } else {
        displayValue = value ? String(value) : '';
      }

      return (
        <div
          onClick={() => setEditingCell({ rowId: row.id, fieldKey: field.key })}
          style={{
            padding: spacing.xs,
            minHeight: '32px',
            cursor: 'text',
            border: hasError ? `2px solid ${colors.error[500]}` : '1px solid transparent',
            borderRadius: borderRadius.sm,
            backgroundColor: hasError ? colors.error[50] : 'transparent',
          }}
          title={error || field.label}
        >
          {displayValue || <span style={{ color: colors.neutral[400], fontStyle: 'italic' }}>{field.placeholder || 'Click to edit'}</span>}
        </div>
      );
    }

    // Edit mode
    if (field.type === 'select') {
      return (
        <select
          autoFocus
          value={String(value)}
          onChange={(e) => {
            updateCell(row.id, field.key, e.target.value);
            setEditingCell(null);
          }}
          onBlur={() => setEditingCell(null)}
          style={{
            width: '100%',
            padding: spacing.xs,
            border: hasError ? `2px solid ${colors.error[500]}` : `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.sm,
            fontSize: '14px',
          }}
        >
          <option value="">Select...</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          autoFocus
          value={String(value)}
          onChange={(e) => updateCell(row.id, field.key, e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              setEditingCell(null);
            }
          }}
          style={{
            width: '100%',
            padding: spacing.xs,
            border: hasError ? `2px solid ${colors.error[500]}` : `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.sm,
            fontSize: '14px',
            minHeight: '60px',
            resize: 'vertical',
          }}
        />
      );
    }

    return (
      <input
        autoFocus
        type={field.type}
        value={String(value)}
        onChange={(e) => updateCell(row.id, field.key, e.target.value)}
        onBlur={() => setEditingCell(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            setEditingCell(null);
            // Move to next cell
            const currentFieldIndex = fields.findIndex(f => f.key === field.key);
            if (currentFieldIndex < fields.length - 1) {
              setEditingCell({ rowId: row.id, fieldKey: fields[currentFieldIndex + 1].key });
            } else {
              // Move to next row, first field
              const currentRowIndex = rows.findIndex(r => r.id === row.id);
              if (currentRowIndex < rows.length - 1) {
                setEditingCell({ rowId: rows[currentRowIndex + 1].id, fieldKey: fields[0].key });
              }
            }
          }
          if (e.key === 'Escape') {
            setEditingCell(null);
          }
        }}
        placeholder={field.placeholder}
        style={{
          width: '100%',
          padding: spacing.xs,
          border: hasError ? `2px solid ${colors.error[500]}` : `1px solid ${colors.neutral[300]}`,
          borderRadius: borderRadius.sm,
          fontSize: '14px',
        }}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md }}>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={addRow} icon={<Plus size={16} />}>
            Add Row
          </Button>
          <Button 
            variant="secondary" 
            onClick={clearAll} 
            disabled={rows.length === 0}
          >
            Clear All
          </Button>
          <label style={{ cursor: 'pointer' }}>
            <input
              type="file"
              accept=".csv"
              onChange={importFromCSV}
              style={{ display: 'none' }}
            />
            <Button variant="secondary" icon={<Upload size={16} />} as="span">
              Import CSV
            </Button>
          </label>
          <Button variant="secondary" onClick={exportToCSV} icon={<Download size={16} />}>
            Export CSV
          </Button>
          {selectedRows.size > 0 && (
            <>
              <Button 
                variant="secondary" 
                onClick={() => duplicateRows(Array.from(selectedRows))}
                icon={<Copy size={16} />}
              >
                Duplicate ({selectedRows.size})
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => removeRows(Array.from(selectedRows))}
                icon={<Trash2 size={16} />}
              >
                Delete ({selectedRows.size})
              </Button>
            </>
          )}
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

      {/* Spreadsheet Table */}
      <div
        style={{
          border: `1px solid ${colors.neutral[200]}`,
          borderRadius: borderRadius.lg,
          overflow: 'auto',
          maxHeight: '70vh',
          backgroundColor: 'white',
        }}
        ref={tableRef}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', minWidth: '1200px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: colors.neutral[50] }}>
            <tr>
              <th style={{ padding: spacing.sm, textAlign: 'center', borderBottom: `2px solid ${colors.neutral[300]}`, minWidth: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedRows.size === rows.length && rows.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(rows.map(r => r.id)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                />
              </th>
              <th style={{ padding: spacing.sm, textAlign: 'left', borderBottom: `2px solid ${colors.neutral[300]}`, minWidth: '50px' }}>
                #
              </th>
              {fields.map((field) => (
                <th
                  key={field.key}
                  style={{
                    padding: spacing.sm,
                    textAlign: 'left',
                    borderBottom: `2px solid ${colors.neutral[300]}`,
                    fontWeight: 600,
                    color: colors.neutral[700],
                    minWidth: field.type === 'textarea' ? '200px' : '150px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <span>{field.label}</span>
                    {field.required && <span style={{ color: colors.error[500] }}>*</span>}
                    <button
                      onClick={() => {
                        const value = prompt(`Enter value to apply to all rows for "${field.label}":`);
                        if (value !== null) {
                          applyToAll(field.key, value);
                        }
                      }}
                      style={{
                        padding: '2px 6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: '10px',
                        color: colors.primary[600],
                      }}
                      title={`Apply to all rows`}
                    >
                      All
                    </button>
                  </div>
                </th>
              ))}
              <th style={{ padding: spacing.sm, textAlign: 'center', borderBottom: `2px solid ${colors.neutral[300]}`, minWidth: '100px' }}>
                Status
              </th>
              <th style={{ padding: spacing.sm, textAlign: 'center', borderBottom: `2px solid ${colors.neutral[300]}`, minWidth: '80px' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={fields.length + 4} style={{ padding: spacing.xl, textAlign: 'center', color: colors.neutral[500] }}>
                  No rows yet. Click "Add Row" to get started.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: selectedRows.has(row.id) 
                      ? colors.primary[50] 
                      : (row.validation.isValid ? colors.success[50] : (Object.keys(row.validation.errors).length > 0 ? colors.error[50] : 'white')),
                    borderBottom: `1px solid ${colors.neutral[200]}`,
                  }}
                >
                  <td style={{ padding: spacing.xs, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.target.checked) {
                          newSelected.add(row.id);
                        } else {
                          newSelected.delete(row.id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    />
                  </td>
                  <td style={{ padding: spacing.sm, textAlign: 'center', color: colors.neutral[600], fontWeight: 600 }}>
                    {rowIndex + 1}
                  </td>
                  {fields.map((field) => (
                    <td
                      key={field.key}
                      style={{
                        padding: spacing.xs,
                        verticalAlign: 'top',
                      }}
                    >
                      {renderCellEditor(row, field)}
                      {row.validation.errors[field.key] && (
                        <div style={{ fontSize: '11px', color: colors.error[600], marginTop: '2px' }}>
                          {row.validation.errors[field.key]}
                        </div>
                      )}
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
                  <td style={{ padding: spacing.sm, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: spacing.xs, justifyContent: 'center' }}>
                      <button
                        onClick={() => duplicateRows([row.id])}
                        style={{
                          padding: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          color: colors.neutral[600],
                        }}
                        title="Duplicate row"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => removeRows([row.id])}
                        style={{
                          padding: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
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
        <strong>💡 Tips:</strong> Click any cell to edit inline. Press Enter/Tab to move to next cell. Press Escape to cancel editing. 
        Use "All" button in column headers to apply a value to all rows. Select multiple rows with checkboxes for bulk operations.
      </div>
    </div>
  );
};
