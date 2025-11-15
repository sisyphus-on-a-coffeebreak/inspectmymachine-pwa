/**
 * Reusable Pagination Component
 * 
 * Provides consistent pagination UI across all list pages
 * Supports page navigation, per-page selection, and displays current page info
 */

import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Button } from './button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  showPerPageSelector?: boolean;
  showTotal?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50, 100],
  showPerPageSelector = true,
  showTotal = true,
  className = '',
}) => {
  // Generate a unique ID for this Pagination instance to avoid key conflicts when multiple instances exist
  const instanceId = React.useId();
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1 && !showPerPageSelector) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.md,
        padding: spacing.md,
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.neutral[200]}`,
        marginTop: spacing.lg,
      }}
    >
      {/* Left side: Total items and per-page selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
        {showTotal && (
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
            Showing {startItem} to {endItem} of {totalItems} items
          </div>
        )}
        
        {showPerPageSelector && onPerPageChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <label style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
              Per page:
            </label>
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: typography.bodySmall.fontSize,
                color: colors.neutral[900],
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              {perPageOptions.map((option) => (
                <option key={`${instanceId}-perpage-${option}`} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Page navigation */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          {/* First page button */}
          <Button
            variant="secondary"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            icon={<ChevronsLeft size={16} />}
            style={{ minWidth: 'auto', padding: `${spacing.xs} ${spacing.sm}` }}
          />

          {/* Previous page button */}
          <Button
            variant="secondary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            icon={<ChevronLeft size={16} />}
            style={{ minWidth: 'auto', padding: `${spacing.xs} ${spacing.sm}` }}
          />

          {/* Page numbers */}
          <div style={{ display: 'flex', gap: spacing.xs }}>
            {(() => {
              const pageNumbers = getPageNumbers();
              let ellipsisCount = 0;
              return pageNumbers.map((page, index) => {
                if (page === '...') {
                  // Use a unique key that includes position and a counter for multiple ellipsis
                  ellipsisCount++;
                  const prevPage = index > 0 ? pageNumbers[index - 1] : null;
                  const nextPage = index < pageNumbers.length - 1 ? pageNumbers[index + 1] : null;
                  return (
                    <span
                      key={`${instanceId}-ellipsis-${ellipsisCount}-${prevPage}-${nextPage}`}
                      style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        color: colors.neutral[600],
                        ...typography.bodySmall,
                      }}
                    >
                      ...
                    </span>
                  );
                }

                const pageNum = page as number;
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={`${instanceId}-page-${pageNum}`}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isActive}
                    style={{
                      minWidth: '36px',
                      height: '36px',
                      padding: `0 ${spacing.sm}`,
                      border: `1px solid ${isActive ? colors.primary : colors.neutral[300]}`,
                      borderRadius: borderRadius.md,
                      backgroundColor: isActive ? colors.primary : 'white',
                      color: isActive ? 'white' : colors.neutral[900],
                      ...typography.bodySmall,
                      fontWeight: isActive ? 600 : 400,
                      cursor: isActive ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = colors.neutral[100];
                        e.currentTarget.style.borderColor = colors.primary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = colors.neutral[300];
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              });
            })()}
          </div>

          {/* Next page button */}
          <Button
            variant="secondary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            icon={<ChevronRight size={16} />}
            style={{ minWidth: 'auto', padding: `${spacing.xs} ${spacing.sm}` }}
          />

          {/* Last page button */}
          <Button
            variant="secondary"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            icon={<ChevronsRight size={16} />}
            style={{ minWidth: 'auto', padding: `${spacing.xs} ${spacing.sm}` }}
          />
        </div>
      )}
    </div>
  );
};

