import React, { useState } from 'react';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { useLedger } from '../../lib/queries';
import { LedgerTransactionRow } from './LedgerTransactionRow';
import { NetworkError } from '../ui/NetworkError';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/button';
import type { LedgerEntry, TransactionType } from '../../types/ledger';

/**
 * Employee Ledger Component
 *
 * Displays complete ledger history with:
 * - Filters (date range, transaction type, CR/DR)
 * - Pagination
 * - Running balance for each transaction
 * - Export capability
 */

interface EmployeeLedgerProps {
  employeeId?: string;
  showFilters?: boolean;
  pageSize?: number;
  onTransactionClick?: (entry: LedgerEntry) => void;
}

export const EmployeeLedger: React.FC<EmployeeLedgerProps> = ({
  employeeId,
  showFilters = true,
  pageSize = 50,
  onTransactionClick,
}) => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{
    transaction_types?: TransactionType[];
    date_from?: string;
    date_to?: string;
    is_credit?: boolean;
    is_debit?: boolean;
  }>({});

  const { data, isLoading, error, refetch } = useLedger(
    {
      employee_id: employeeId,
      ...filters,
      page,
      per_page: pageSize,
    }
  );

  if (error) {
    return <NetworkError message="Failed to load ledger" onRetry={refetch} />;
  }

  const entries: LedgerEntry[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.md,
        }}
      >
        <div>
          <h2 style={{ ...typography.h2, margin: 0 }}>Ledger Transactions</h2>
          <p style={{ color: colors.neutral[600], fontSize: '0.875rem', margin: 0 }}>
            {total} transaction{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              // TODO: Implement export
              alert('Export functionality coming soon!');
            }}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{ ...cardStyles.base, padding: spacing.md }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: spacing.md,
              marginBottom: spacing.sm,
            }}
          >
            {/* Transaction Type Filter */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: spacing.xs,
                  color: colors.neutral[700],
                }}
              >
                Transaction Type
              </label>
              <select
                value={filters.transaction_types?.[0] || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange(
                    'transaction_types',
                    value ? [value as TransactionType] : undefined
                  );
                }}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">All Types</option>
                <option value="ADVANCE_ISSUE">Advance Issue</option>
                <option value="EXPENSE">Expense</option>
                <option value="CASH_RETURN">Cash Return</option>
                <option value="REIMBURSEMENT">Reimbursement</option>
                <option value="OPENING_BALANCE">Opening Balance</option>
              </select>
            </div>

            {/* CR/DR Filter */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: spacing.xs,
                  color: colors.neutral[700],
                }}
              >
                CR/DR Filter
              </label>
              <select
                value={
                  filters.is_credit
                    ? 'credit'
                    : filters.is_debit
                    ? 'debit'
                    : ''
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'credit') {
                    handleFilterChange('is_credit', true);
                    handleFilterChange('is_debit', undefined);
                  } else if (value === 'debit') {
                    handleFilterChange('is_debit', true);
                    handleFilterChange('is_credit', undefined);
                  } else {
                    handleFilterChange('is_credit', undefined);
                    handleFilterChange('is_debit', undefined);
                  }
                }}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">All Transactions</option>
                <option value="credit">Credits Only (CR)</option>
                <option value="debit">Debits Only (DR)</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: spacing.xs,
                  color: colors.neutral[700],
                }}
              >
                From Date
              </label>
              <input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Date To */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: spacing.xs,
                  color: colors.neutral[700],
                }}
              >
                To Date
              </label>
              <input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>

          {/* Clear Filters */}
          {Object.keys(filters).length > 0 && (
            <div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Ledger Table */}
      <div style={{ ...cardStyles.base, padding: 0, overflow: 'hidden' }}>
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto auto auto',
            gap: spacing.md,
            padding: spacing.md,
            backgroundColor: colors.neutral[50],
            borderBottom: `2px solid ${colors.neutral[200]}`,
            fontSize: '0.75rem',
            fontWeight: 700,
            color: colors.neutral[600],
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          <div>Type</div>
          <div>Description</div>
          <div style={{ textAlign: 'right' }}>Amount</div>
          <div style={{ textAlign: 'right' }}>Running Balance</div>
          <div></div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.neutral[500] }}>
            Loading transactions...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && entries.length === 0 && (
          <div style={{ padding: spacing.xl }}>
            <EmptyState
              message="No transactions found"
              description={
                Object.keys(filters).length > 0
                  ? 'Try adjusting your filters'
                  : 'No ledger entries yet'
              }
            />
          </div>
        )}

        {/* Transaction Rows */}
        {!isLoading &&
          entries.map((entry) => (
            <LedgerTransactionRow
              key={entry.id}
              entry={entry}
              showBalance={true}
              onClick={onTransactionClick ? () => onTransactionClick(entry) : undefined}
            />
          ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: spacing.md,
            ...cardStyles.base,
          }}
        >
          <div style={{ fontSize: '0.875rem', color: colors.neutral[600] }}>
            Page {page} of {totalPages} (Showing {entries.length} of {total} transactions)
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
