/**
 * DataTable Component
 * 
 * Reusable table component for displaying lists of data
 * Supports sorting, row selection, click handlers, and accessibility
 */

import React, { useState, useMemo, useCallback } from 'react';
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

function DataTableComponent<T extends Record<string, any>>({
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

  // Handle row selection - memoized with useCallback
  const handleRowSelect = useCallback((row: T, checked: boolean) => {
    const rowId = getRowId(row);
    setSelectedRowIds((prev) => {
      const newSelectedIds = new Set(prev);
      
      if (checked) {
        newSelectedIds.add(rowId);
      } else {
        newSelectedIds.delete(rowId);
      }
      
      if (onRowSelect) {
        const selected = data.filter((r) => newSelectedIds.has(getRowId(r)));
        onRowSelect(selected);
      }
      
      return newSelectedIds;
    });
  }, [data, getRowId, onRowSelect]);

  // Handle select all - memoized with useCallback
  const handleSelectAll = useCallback((checked: boolean) => {
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
  }, [data, getRowId, onRowSelect]);

  // Handle sorting - memoized with useCallback
  const handleSort = useCallback((key: string) => {
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
  }, [sortable, columns]);

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

  // Memoize selection state
  const allSelected = useMemo(() => 
    data.length > 0 && selectedRowIds.size === data.length,
    [data.length, selectedRowIds.size]
  );
  const someSelected = useMemo(() => 
    selectedRowIds.size > 0 && selectedRowIds.size < data.length,
    [selectedRowIds.size, data.length]
  );

  if (loading) {
    return (
      <div role="status" aria-live="polite" aria-busy="true">
        <SkeletonTable rows={5} columns={columns.length} />
      </div>
    );
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

  // Render mobile card view
  const renderMobileCard = (row: T, index: number) => {
    const rowId = getRowId(row);
    const isSelected = selectedRowIds.has(rowId);
    const rowClass = rowClassName ? rowClassName(row, index) : '';

    return (
      <div
        key={rowId}
        className={`data-table-mobile-card ${rowClass}`}
        onClick={() => onRowClick && onRowClick(row, index)}
        onKeyDown={(e) => {
          if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onRowClick(row, index);
          }
        }}
        tabIndex={onRowClick ? 0 : -1}
        role={onRowClick ? 'button' : 'article'}
        aria-label={onRowClick ? `Row ${index + 1}: Click to view details` : undefined}
        aria-selected={selectable ? isSelected : undefined}
        style={{
          ...cardStyles.base,
          padding: spacing.md,
          marginBottom: spacing.md,
          cursor: onRowClick ? 'pointer' : 'default',
          backgroundColor: isSelected ? colors.primary + '10' : 'white',
          border: `1px solid ${isSelected ? colors.primary : colors.neutral[200]}`,
          transition: 'all 0.2s ease',
        }}
      >
        {selectable && (
          <div 
            style={{ 
              marginBottom: spacing.sm,
              padding: '12px', // Add padding to create 44x44px touch target (20px + 12px*2 = 44px)
              margin: '-12px -12px 0 -12px', // Negative margin to maintain layout
            }}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleRowSelect(row, e.target.checked);
              }}
              aria-label={`Select row ${index + 1}`}
              style={{
                width: '20px',
                height: '20px',
                cursor: 'pointer',
                minWidth: '20px',
                minHeight: '20px',
              }}
            />
          </div>
        )}
        {columns.map((column) => {
          const value = row[column.key];
          const renderedValue = column.render
            ? column.render(value, row, index)
            : value;

          return (
            <div
              key={column.key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginBottom: spacing.sm,
                paddingBottom: spacing.sm,
                borderBottom: `1px solid ${colors.neutral[100]}`,
              }}
            >
              <div
                style={{
                  ...typography.label,
                  fontSize: '11px',
                  color: colors.neutral[600],
                  marginBottom: spacing.xs,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {column.label}
              </div>
              <div
                style={{
                  ...typography.body,
                  color: colors.neutral[900],
                  fontSize: '14px',
                }}
              >
                {renderedValue}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`data-table ${className}`}
      style={{
        ...cardStyles.base,
        overflow: 'hidden',
        padding: 0,
      }}
    >
      {/* Mobile Card View */}
      <div 
        className="data-table-mobile-view" 
        style={{ display: 'none' }}
        role="list"
        aria-label="Data table rows"
      >
        {sortedData.map((row, index) => renderMobileCard(row, index))}
      </div>

      {/* Desktop Table View */}
      <div className="data-table-desktop-view" style={{ overflowX: 'auto' }}>
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
              backgroundColor: colors.neutral[100],
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
                  <div style={{ padding: '12px', display: 'inline-block' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      aria-label="Select all rows"
                      style={{
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        minWidth: '20px',
                        minHeight: '20px',
                      }}
                    />
                  </div>
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
                                : colors.neutral[500], // Improved contrast for accessibility
                          }}
                        />
                        <ChevronDown
                          size={12}
                          style={{
                            color:
                              sortConfig?.key === column.key && sortConfig.direction === 'desc'
                                ? colors.primary
                                : colors.neutral[500], // Improved contrast for accessibility
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
                      : colors.neutral[100],
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.neutral[100];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? 'white' : colors.neutral[100];
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
      <style>{`
        /* Mobile: Show cards, hide table */
        @media (max-width: 767px) {
          .data-table-mobile-view {
            display: block !important;
            padding: ${spacing.md};
          }
          .data-table-desktop-view {
            display: none !important;
          }
        }
        
        /* Desktop: Show table, hide cards */
        @media (min-width: 768px) {
          .data-table-mobile-view {
            display: none !important;
          }
          .data-table-desktop-view {
            display: block !important;
          }
        }
        
        /* Mobile card hover effect */
        @media (max-width: 767px) {
          .data-table-mobile-card:hover {
            transform: translateY(-2px);
            box-shadow: ${shadows.md};
          }
        }
      `}</style>
    </div>
  );
}

// Memoize DataTable to prevent unnecessary re-renders
export const DataTable = React.memo(DataTableComponent) as typeof DataTableComponent;

export default DataTable;

