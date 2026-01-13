import React from 'react';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderTop: `1px solid ${colors.neutral[200]}`,
        flexWrap: 'wrap',
        gap: spacing.md,
      }}
    >
      {/* Items per page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Show:</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            fontSize: '14px',
            cursor: 'pointer',
          }}
          aria-label="Items per page"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
          Showing {startItem}-{endItem} of {totalItems}
        </span>
      </div>

      {/* Page controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{
            padding: spacing.sm,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            background: 'white',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            minHeight: '44px',
          }}
          aria-label="First page"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: spacing.sm,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            background: 'white',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            minHeight: '44px',
          }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        <span style={{ ...typography.body, padding: `0 ${spacing.md}` }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: spacing.sm,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            background: 'white',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            minHeight: '44px',
          }}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            padding: spacing.sm,
            border: `1px solid ${colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            background: 'white',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            minHeight: '44px',
          }}
          aria-label="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
