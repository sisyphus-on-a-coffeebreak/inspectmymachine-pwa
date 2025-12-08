/**
 * Ledger Timeline Component
 * 
 * Displays ledger transactions in a visual timeline format
 */

import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { ArrowDownCircle, ArrowUpCircle, Wallet, Calendar, FileText, CreditCard, DollarSign } from 'lucide-react';

export interface LedgerTransaction {
  id: string;
  type: 'CR' | 'DR' | 'OPENING';
  amount: number;
  description: string;
  date: string | Date;
  category?: string;
  reference_type?: string;
  reference_id?: string;
  running_balance: number;
  created_by?: {
    name: string;
  };
}

export interface LedgerTimelineProps {
  transactions: LedgerTransaction[];
  className?: string;
  showBalance?: boolean;
}

const transactionConfig = {
  CR: {
    icon: ArrowUpCircle,
    color: colors.status.normal,
    label: 'Credit',
    bgColor: colors.status.normal + '15',
  },
  DR: {
    icon: ArrowDownCircle,
    color: colors.status.error,
    label: 'Debit',
    bgColor: colors.status.error + '15',
  },
  OPENING: {
    icon: Wallet,
    color: colors.neutral[600],
    label: 'Opening Balance',
    bgColor: colors.neutral[100],
  },
};

const referenceTypeIcons: Record<string, any> = {
  expense: FileText,
  advance: CreditCard,
  advance_return: DollarSign,
  reimbursement: ArrowUpCircle,
  cash_return: DollarSign,
};

export const LedgerTimeline: React.FC<LedgerTimelineProps> = ({
  transactions,
  className = '',
  showBalance = true,
}) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div
        className={`ledger-timeline ${className}`}
        style={{
          padding: spacing.lg,
          backgroundColor: colors.neutral[50],
          borderRadius: borderRadius.md,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📊</div>
        <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
          No transactions available
        </div>
      </div>
    );
  }

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Descending order
  });

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Yesterday at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getReferenceIcon = (referenceType?: string) => {
    if (!referenceType) return null;
    const Icon = referenceTypeIcons[referenceType];
    return Icon ? <Icon size={14} color={colors.neutral[500]} /> : null;
  };

  return (
    <div
      className={`ledger-timeline ${className}`}
      style={{
        position: 'relative',
        paddingLeft: spacing.xl,
      }}
    >
      {/* Timeline line */}
      <div
        style={{
          position: 'absolute',
          left: '20px',
          top: 0,
          bottom: 0,
          width: '2px',
          backgroundColor: colors.neutral[200],
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {sortedTransactions.map((transaction, index) => {
          const config = transactionConfig[transaction.type] || transactionConfig.DR;
          const Icon = config.icon;
          const isLast = index === sortedTransactions.length - 1;
          const isCredit = transaction.type === 'CR';
          const isDebit = transaction.type === 'DR';
          const isOpening = transaction.type === 'OPENING';

          return (
            <div
              key={transaction.id}
              style={{
                position: 'relative',
                marginBottom: isLast ? 0 : spacing.lg,
              }}
            >
              {/* Timeline dot */}
              <div
                style={{
                  position: 'absolute',
                  left: '-28px',
                  top: '4px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  border: `3px solid ${config.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <Icon size={12} color={config.color} />
              </div>

              {/* Transaction card */}
              <div
                style={{
                  backgroundColor: isOpening ? config.bgColor : 'white',
                  border: `1px solid ${config.color}${isOpening ? '40' : '30'}`,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  boxShadow: isOpening ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
                      <span
                        style={{
                          ...typography.label,
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: config.bgColor,
                          color: config.color,
                          fontWeight: 600,
                        }}
                      >
                        {config.label}
                      </span>
                      {transaction.reference_type && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          {getReferenceIcon(transaction.reference_type)}
                          <span style={{ ...typography.bodySmall, color: colors.neutral[500], fontSize: '11px' }}>
                            {transaction.reference_type.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.xs }}>
                      {transaction.description}
                    </div>
                    {transaction.category && (
                      <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.xs }}>
                        Category: {transaction.category}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs }}>
                      <Calendar size={12} color={colors.neutral[400]} />
                      <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                        {formatDate(transaction.date)}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: spacing.md }}>
                    <div
                      style={{
                        ...typography.subheader,
                        color: isCredit ? colors.status.normal : isDebit ? colors.status.error : colors.neutral[700],
                        fontWeight: 700,
                        marginBottom: spacing.xs,
                      }}
                    >
                      {isCredit ? '+' : isDebit ? '-' : ''}{formatCurrency(transaction.amount)}
                    </div>
                    {showBalance && (
                      <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        Balance: {formatCurrency(transaction.running_balance)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


