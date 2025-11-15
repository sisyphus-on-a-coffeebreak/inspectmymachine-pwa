/**
 * DataTable Component
 * 
 * Reusable table component for displaying lists of data
 * Supports sorting, row selection, click handlers, and accessibility
 */

import React, { useState, useMemo } from 'react';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { SkeletonTable } from './SkeletonLoader';
import { EmptyState } from './EmptyState';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string | number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  onRowClick?: (row: T, index: number) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  selectable?: boolean;
  selectedRows?: T[];
  getRowId?: (row: T) => string | number;
  sortable?: boolean;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
  className?: string;
  rowClassName?: (row: T, index: number) => string;
  stickyHeader?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  emptyIcon = '📋',
  onRowClick,
  onRowSelect,
  selectable = false,
  selectedRows = [],
  getRowId = (row) => row.id || row.key || JSON.stringify(row),
  sortable = true,
  defaultSort,
  className = '',
  rowClassName,
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(
    defaultSort || null
  );
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(
    new Set(selectedRows.map(getRowId))
  );

  // Handle row selection
  const handleRowSelect = (row: T, checked: boolean) => {
    const rowId = getRowId(row);
    const newSelectedIds = new Set(selectedRowIds);
    
    if (checked) {
      newSelectedIds.add(rowId);
    } else {
      newSelectedIds.delete(rowId);
    }
    
    setSelectedRowIds(newSelectedIds);
    
    if (onRowSelect) {
      const selected = data.filter((r) => newSelectedIds.has(getRowId(r)));
      onRowSelect(selected);
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map(getRowId));
      setSelectedRowIds(allIds);
      if (onRowSelect) {
        onRowSelect(data);
      }
    } else {
      setSelectedRowIds(new Set());
      if (onRowSelect) {
        onRowSelect([]);
      }
    }
  };

  // Handle sorting
  const handleSort = (key: string) => {
    if (!sortable) return;
    
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const column = columns.find((col) => col.key === sortConfig.key);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig, columns]);

  const allSelected = data.length > 0 && selectedRowIds.size === data.length;
  const someSelected = selectedRowIds.size > 0 && selectedRowIds.size < data.length;

  if (loading) {
    return <SkeletonTable rows={5} columns={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyMessage}
        description="Try adjusting your filters or search criteria"
      />
    );
  }

  return (
    <div
      className={`data-table ${className}`}
      style={{
        ...cardStyles.base,
        overflow: 'hidden',
        padding: 0,
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
          role="table"
          aria-label="Data table"
        >
          <thead
            style={{
              backgroundColor: colors.neutral[50],
              borderBottom: `1px solid ${colors.neutral[200]}`,
              position: stickyHeader ? 'sticky' : 'static',
              top: 0,
              zIndex: 10,
            }}
          >
            <tr>
              {selectable && (
                <th
                  style={{
                    padding: spacing.md,
                    textAlign: 'center',
                    width: '48px',
                    ...typography.label,
                    color: colors.neutral[600],
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all rows"
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                    }}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: spacing.md,
                    textAlign: column.align || 'left',
                    width: column.width,
                    ...typography.label,
                    color: colors.neutral[600],
                    fontWeight: 600,
                    cursor: column.sortable && sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => column.sortable && sortable && handleSort(column.key)}
                  onKeyDown={(e) => {
                    if (
                      column.sortable &&
                      sortable &&
                      (e.key === 'Enter' || e.key === ' ')
                    ) {
                      e.preventDefault();
                      handleSort(column.key);
                    }
                  }}
                  tabIndex={column.sortable && sortable ? 0 : -1}
                  role={column.sortable && sortable ? 'button' : undefined}
                  aria-label={
                    column.sortable && sortable
                      ? `Sort by ${column.label}${
                          sortConfig?.key === column.key
                            ? ` (${sortConfig.direction === 'asc' ? 'ascending' : 'descending'})`
                            : ''
                        }`
                      : column.label
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                    }}
                  >
                    {column.label}
                    {column.sortable && sortable && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <ChevronUp
                          size={12}
                          style={{
                            color:
                              sortConfig?.key === column.key && sortConfig.direction === 'asc'
                                ? colors.primary
                                : colors.neutral[400],
                          }}
                        />
                        <ChevronDown
                          size={12}
                          style={{
                            color:
                              sortConfig?.key === column.key && sortConfig.direction === 'desc'
                                ? colors.primary
                                : colors.neutral[400],
                          }}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              const rowId = getRowId(row);
              const isSelected = selectedRowIds.has(rowId);
              const rowClass = rowClassName ? rowClassName(row, index) : '';

              return (
                <tr
                  key={rowId}
                  className={rowClass}
                  onClick={() => onRowClick && onRowClick(row, index)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(row, index);
                    }
                  }}
                  tabIndex={onRowClick ? 0 : -1}
                  role={onRowClick ? 'button' : 'row'}
                  aria-label={onRowClick ? `Row ${index + 1}: Click to view details` : undefined}
                  aria-selected={selectable ? isSelected : undefined}
                  style={{
                    borderBottom: `1px solid ${colors.neutral[200]}`,
                    transition: 'background-color 0.2s ease',
                    cursor: onRowClick ? 'pointer' : 'default',
                    backgroundColor: isSelected
                      ? colors.primary + '10'
                      : index % 2 === 0
                      ? 'white'
                      : colors.neutral[50],
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.neutral[100];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? 'white' : colors.neutral[50];
                    }
                  }}
                >
                  {selectable && (
                    <td
                      style={{
                        padding: spacing.md,
                        textAlign: 'center',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowSelect(row, e.target.checked)}
                        aria-label={`Select row ${index + 1}`}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                        }}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = row[column.key];
                    const renderedValue = column.render
                      ? column.render(value, row, index)
                      : value;

                    return (
                      <td
                        key={column.key}
                        style={{
                          padding: spacing.md,
                          textAlign: column.align || 'left',
                          ...typography.body,
                          color: colors.neutral[900],
                        }}
                      >
                        {renderedValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;

