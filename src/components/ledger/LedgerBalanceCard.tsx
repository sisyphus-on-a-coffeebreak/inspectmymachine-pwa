import React from 'react';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { NetworkError } from '../ui/NetworkError';
import { useBalanceSummary } from '../../lib/queries';
import type { BalanceSummary } from '../../types/ledger';

/**
 * Ledger Balance Card
 *
 * Displays employee's current ledger balance with CR/DR breakdown
 * Color-coded: Green for surplus, Red for deficit
 * Shows detailed breakdown of credits, debits, and open advances
 */

interface LedgerBalanceCardProps {
  employeeId?: string;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const LedgerBalanceCard: React.FC<LedgerBalanceCardProps> = ({
  employeeId,
  showDetails = true,
  compact = false,
  className = '',
}) => {
  const { data, isLoading, error, refetch } = useBalanceSummary(employeeId);

  if (error) {
    return (
      <NetworkError
        message="Failed to load ledger balance"
        onRetry={refetch}
      />
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          ...cardStyles.base,
          padding: compact ? spacing.md : spacing.lg,
          textAlign: 'center',
        }}
        className={className}
      >
        <div style={{ color: colors.neutral[500] }}>Loading balance...</div>
      </div>
    );
  }

  const summary: BalanceSummary | undefined = data?.data || data;

  if (!summary) {
    return (
      <div
        style={{
          ...cardStyles.base,
          padding: compact ? spacing.md : spacing.lg,
        }}
        className={className}
      >
        <div style={{ color: colors.neutral[500], textAlign: 'center' }}>
          No balance data available
        </div>
      </div>
    );
  }

  const balance = summary.current_balance || 0;
  const isDeficit = balance < 0;
  const isSurplus = balance > 0;
  const balanceColor = isDeficit
    ? colors.status.critical
    : isSurplus
    ? colors.status.success
    : colors.neutral[600];

  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div
      style={{
        ...cardStyles.base,
        padding: compact ? spacing.md : spacing.lg,
        borderLeft: `4px solid ${balanceColor}`,
      }}
      className={className}
    >
      {/* Header */}
      <div style={{ marginBottom: compact ? spacing.sm : spacing.md }}>
        <h3
          style={{
            ...typography.h3,
            margin: 0,
            marginBottom: spacing.xs,
            color: colors.neutral[700],
          }}
        >
          {summary.employee_name ? `${summary.employee_name}'s Ledger` : 'Your Ledger Balance'}
        </h3>
        {summary.last_transaction_date && (
          <div style={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
            Last updated: {new Date(summary.last_transaction_date).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        )}
      </div>

      {/* Main Balance */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: spacing.sm,
          marginBottom: compact ? spacing.md : spacing.lg,
        }}
      >
        <div style={{ fontSize: compact ? '2rem' : '2.5rem', fontWeight: 700, color: balanceColor }}>
          {formatCurrency(balance)}
        </div>
        {isDeficit && (
          <span style={{ fontSize: '0.875rem', color: colors.status.critical, fontWeight: 600 }}>
            DEFICIT
          </span>
        )}
        {isSurplus && (
          <span style={{ fontSize: '0.875rem', color: colors.status.success, fontWeight: 600 }}>
            SURPLUS
          </span>
        )}
        {balance === 0 && (
          <span style={{ fontSize: '0.875rem', color: colors.neutral[600], fontWeight: 600 }}>
            BALANCED
          </span>
        )}
      </div>

      {/* Detailed Breakdown */}
      {showDetails && !compact && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: spacing.md,
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.neutral[200]}`,
          }}
        >
          {/* Opening Balance */}
          <div>
            <div style={{ fontSize: '0.75rem', color: colors.neutral[500], marginBottom: spacing.xs }}>
              Opening Balance
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[700] }}>
              {formatCurrency(summary.opening_balance || 0)}
            </div>
          </div>

          {/* Total Credits */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: colors.status.success,
                marginBottom: spacing.xs,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <span style={{ fontSize: '1rem' }}>↑</span>
              Total CR
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: colors.status.success }}>
              +{formatCurrency(summary.total_credits || 0)}
            </div>
          </div>

          {/* Total Debits */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: colors.status.critical,
                marginBottom: spacing.xs,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <span style={{ fontSize: '1rem' }}>↓</span>
              Total DR
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: colors.status.critical }}>
              -{formatCurrency(summary.total_debits || 0)}
            </div>
          </div>

          {/* Open Advances */}
          {summary.open_advances && summary.open_advances.length > 0 && (
            <div>
              <div style={{ fontSize: '0.75rem', color: colors.neutral[500], marginBottom: spacing.xs }}>
                Open Advances
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[700] }}>
                {summary.open_advances.length} ({formatCurrency(summary.total_open_advances || 0)})
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compact Details */}
      {showDetails && compact && (
        <div style={{ display: 'flex', gap: spacing.md, fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: colors.status.success }}>↑ CR:</span>{' '}
            {formatCurrency(summary.total_credits || 0)}
          </div>
          <div>
            <span style={{ color: colors.status.critical }}>↓ DR:</span>{' '}
            {formatCurrency(summary.total_debits || 0)}
          </div>
        </div>
      )}

      {/* Pending Items Alert */}
      {summary.pending_expenses > 0 && (
        <div
          style={{
            marginTop: spacing.md,
            padding: spacing.sm,
            backgroundColor: colors.status.warning + '15',
            borderRadius: '4px',
            fontSize: '0.875rem',
            color: colors.status.warning,
          }}
        >
          ⚠️ {formatCurrency(summary.pending_expenses)} pending approval
        </div>
      )}

      {/* Open Advances Details */}
      {showDetails &&
        !compact &&
        summary.open_advances &&
        summary.open_advances.length > 0 && (
          <div style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTop: `1px solid ${colors.neutral[200]}` }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: spacing.sm, color: colors.neutral[700] }}>
              Open Advances:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {summary.open_advances.slice(0, 3).map((advance) => (
                <div
                  key={advance.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8125rem',
                    padding: spacing.xs,
                    backgroundColor: colors.neutral[50],
                    borderRadius: '4px',
                  }}
                >
                  <div>
                    <span style={{ color: colors.neutral[600] }}>{advance.purpose}</span>
                    {advance.is_expired && (
                      <span style={{ color: colors.status.critical, marginLeft: spacing.xs }}>
                        (EXPIRED)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ fontWeight: 600, color: colors.neutral[700] }}>
                      {formatCurrency(advance.remaining_balance)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                      {advance.utilization_percentage.toFixed(0)}% used
                    </div>
                  </div>
                </div>
              ))}
              {summary.open_advances.length > 3 && (
                <div style={{ fontSize: '0.75rem', color: colors.neutral[500], textAlign: 'center' }}>
                  +{summary.open_advances.length - 3} more advances
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};
