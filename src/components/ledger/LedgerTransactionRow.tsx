import React from 'react';
import { colors, spacing } from '../../lib/theme';
import type { LedgerEntry, TransactionType } from '../../types/ledger';

/**
 * Ledger Transaction Row Component
 *
 * Displays a single ledger entry with:
 * - Transaction type badge
 * - CR/DR color coding (green for credits, red for debits)
 * - Running balance
 * - Related information
 */

interface LedgerTransactionRowProps {
  entry: LedgerEntry;
  showBalance?: boolean;
  showEmployee?: boolean;
  onClick?: () => void;
}

// Transaction type display configuration
const TRANSACTION_CONFIG: Record<
  TransactionType,
  {
    label: string;
    color: string;
    icon: string;
    bgColor: string;
  }
> = {
  ADVANCE_ISSUE: {
    label: 'Advance',
    color: colors.status.success,
    icon: '↑',
    bgColor: colors.status.success + '15',
  },
  EXPENSE: {
    label: 'Expense',
    color: colors.status.critical,
    icon: '↓',
    bgColor: colors.status.critical + '15',
  },
  CASH_RETURN: {
    label: 'Cash Return',
    color: colors.status.critical,
    icon: '↓',
    bgColor: colors.status.critical + '15',
  },
  REIMBURSEMENT: {
    label: 'Reimbursement',
    color: colors.status.success,
    icon: '↑',
    bgColor: colors.status.success + '15',
  },
  OPENING_BALANCE: {
    label: 'Opening',
    color: colors.neutral[600],
    icon: '○',
    bgColor: colors.neutral[200],
  },
};

export const LedgerTransactionRow: React.FC<LedgerTransactionRowProps> = ({
  entry,
  showBalance = true,
  showEmployee = false,
  onClick,
}) => {
  const config = TRANSACTION_CONFIG[entry.transaction_type];
  const isCredit = entry.credit_amount > 0;
  const isDebit = entry.debit_amount > 0;
  const amount = isCredit ? entry.credit_amount : entry.debit_amount;
  const amountColor = isCredit ? colors.status.success : colors.status.critical;
  const balanceColor =
    entry.running_balance < 0
      ? colors.status.critical
      : entry.running_balance > 0
      ? colors.status.success
      : colors.neutral[600];

  const formatCurrency = (amount: number) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: showBalance
          ? 'auto 1fr auto auto auto'
          : 'auto 1fr auto auto',
        gap: spacing.md,
        alignItems: 'center',
        padding: spacing.sm,
        borderBottom: `1px solid ${colors.neutral[200]}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = colors.neutral[50];
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {/* Transaction Type Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: spacing.xs,
          padding: `${spacing.xs} ${spacing.sm}`,
          borderRadius: '4px',
          backgroundColor: config.bgColor,
          fontSize: '0.75rem',
          fontWeight: 600,
          color: config.color,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '0.875rem' }}>{config.icon}</span>
        {config.label}
      </div>

      {/* Description and Details */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: colors.neutral[800],
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.description}
        </div>
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            fontSize: '0.75rem',
            color: colors.neutral[500],
            marginTop: '2px',
          }}
        >
          <span>{formatDate(entry.transaction_date)}</span>
          {showEmployee && entry.employee_name && <span>• {entry.employee_name}</span>}
          {entry.project_name && <span>• {entry.project_name}</span>}
          {entry.asset_name && <span>• {entry.asset_name}</span>}
          {entry.category && <span>• {entry.category}</span>}
        </div>
      </div>

      {/* CR/DR Amount */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          minWidth: '100px',
        }}
      >
        <div
          style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            color: amountColor,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          {isCredit && <span style={{ fontSize: '0.75rem' }}>CR</span>}
          {isDebit && <span style={{ fontSize: '0.75rem' }}>DR</span>}
          <span>{formatCurrency(amount)}</span>
        </div>
        {entry.approved_at && (
          <div style={{ fontSize: '0.6875rem', color: colors.neutral[500] }}>
            ✓ Approved
          </div>
        )}
        {!entry.approved_at && (
          <div style={{ fontSize: '0.6875rem', color: colors.status.warning }}>
            ⏳ Pending
          </div>
        )}
      </div>

      {/* Running Balance */}
      {showBalance && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            minWidth: '100px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: colors.neutral[500], marginBottom: '2px' }}>
            Balance
          </div>
          <div
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: balanceColor,
            }}
          >
            {formatCurrency(entry.running_balance)}
          </div>
        </div>
      )}

      {/* Chevron for clickable rows */}
      {onClick && (
        <div
          style={{
            fontSize: '1.25rem',
            color: colors.neutral[400],
            marginLeft: spacing.xs,
          }}
        >
          ›
        </div>
      )}
    </div>
  );
};
