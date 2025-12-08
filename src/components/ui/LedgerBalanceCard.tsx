/**
 * LedgerBalanceCard Component
 * 
 * Displays current ledger balance with CR/DR indicators
 * Shows balance status, tooltip, and visual indicators
 */

import React from 'react';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Tooltip } from './Tooltip';

export interface LedgerBalanceCardProps {
  balance: number;
  label?: string;
  showTooltip?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const LedgerBalanceCard: React.FC<LedgerBalanceCardProps> = ({
  balance,
  label = 'Ledger Balance',
  showTooltip = true,
  onClick,
  variant = 'default',
  className = '',
}) => {
  const isPositive = balance >= 0;
  const isNegative = balance < 0;
  const isZero = balance === 0;

  // Determine color based on balance
  const balanceColor = isNegative 
    ? colors.status.error 
    : isZero 
    ? colors.neutral[500]
    : colors.status.normal;

  // Determine border color
  const borderColor = isNegative
    ? colors.status.error
    : isZero
    ? colors.neutral[300]
    : colors.status.normal;

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const tooltipContent = (
    <div style={{ maxWidth: '250px' }}>
      <div style={{ fontWeight: 600, marginBottom: spacing.xs }}>
        Ledger Balance Explanation
      </div>
      <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
        {isNegative ? (
          <>
            <strong>Deficit Balance:</strong> You owe ₹{Math.abs(balance).toLocaleString('en-IN')}.
            <br />
            This means your expenses exceed your advances. Consider requesting reimbursement.
          </>
        ) : isZero ? (
          <>
            <strong>Zero Balance:</strong> Your advances and expenses are balanced.
            <br />
            No outstanding amount.
          </>
        ) : (
          <>
            <strong>Surplus Balance:</strong> You have ₹{balance.toLocaleString('en-IN')} available.
            <br />
            This is the difference between advances (CR) and expenses (DR).
          </>
        )}
      </div>
    </div>
  );

  const cardContent = (
    <div
      style={{
        ...cardStyles.base,
        padding: variant === 'compact' ? spacing.md : spacing.xl,
        backgroundColor: 'white',
        border: `2px solid ${borderColor}`,
        borderRadius: borderRadius.lg,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...(onClick && {
          ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
          },
        }),
      }}
      onClick={onClick}
      className={className}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: variant === 'compact' ? spacing.xs : spacing.sm,
      }}>
        <div style={{
          ...typography.label,
          color: colors.neutral[600],
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
        }}>
          <span style={{ fontSize: '1.2rem' }}>
            {isNegative ? '📉' : isZero ? '⚖️' : '📈'}
          </span>
          {label}
          {showTooltip && (
            <Tooltip content={tooltipContent}>
              <span style={{ 
                cursor: 'help', 
                color: colors.neutral[400],
                fontSize: '14px',
                marginLeft: spacing.xs,
              }}>
                ℹ️
              </span>
            </Tooltip>
          )}
        </div>
        {variant === 'detailed' && (
          <div style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            backgroundColor: isNegative 
              ? colors.status.error + '20'
              : isZero
              ? colors.neutral[100]
              : colors.status.normal + '20',
            borderRadius: borderRadius.sm,
            fontSize: '11px',
            fontWeight: 600,
            color: balanceColor,
            textTransform: 'uppercase',
          }}>
            {isNegative ? 'DR (Deficit)' : isZero ? 'Balanced' : 'CR (Surplus)'}
          </div>
        )}
      </div>

      <div style={{
        ...typography.header,
        fontSize: variant === 'compact' ? '24px' : '32px',
        color: balanceColor,
        fontWeight: 700,
        marginBottom: variant === 'detailed' ? spacing.xs : 0,
      }}>
        {formatBalance(balance)}
      </div>

      {variant === 'detailed' && (
        <div style={{
          ...typography.bodySmall,
          color: colors.neutral[500],
          fontSize: '12px',
          marginTop: spacing.xs,
        }}>
          {isNegative 
            ? `Deficit of ₹${Math.abs(balance).toLocaleString('en-IN')}`
            : isZero
            ? 'No outstanding balance'
            : `Available balance: ₹${balance.toLocaleString('en-IN')}`
          }
        </div>
      )}
    </div>
  );

  return cardContent;
};

export default LedgerBalanceCard;


