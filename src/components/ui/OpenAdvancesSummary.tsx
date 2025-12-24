/**
 * Open Advances Summary Component
 * 
 * Shows all open advances with remaining balance
 * Utilization bar and advance-specific ledger view
 */

import React from 'react';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from './button';
import { EmptyState } from './EmptyState';
import { AdvanceUtilizationBar } from './AdvanceUtilizationBar';
import { StatsGrid } from './ResponsiveGrid';

export interface Advance {
  id: string;
  amount: number;
  remaining: number;
  used: number;
  purpose: string;
  issued_date: string;
  expiry_date?: string;
  status: 'open' | 'closed' | 'expired';
}

export interface OpenAdvancesSummaryProps {
  advances?: Advance[];
  onViewLedger?: (advanceId: string) => void;
  onReturn?: (advance: Advance) => void;
  loading?: boolean;
}

export const OpenAdvancesSummary: React.FC<OpenAdvancesSummaryProps> = ({
  advances = [],
  onViewLedger,
  onReturn,
  loading = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUtilizationPercentage = (advance: Advance) => {
    if (advance.amount === 0) return 0;
    return Math.round((advance.used / advance.amount) * 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return colors.status.error;
    if (percentage >= 70) return colors.status.warning;
    return colors.status.normal;
  };

  const totalRemaining = advances.reduce((sum, adv) => sum + adv.remaining, 0);
  const totalAmount = advances.reduce((sum, adv) => sum + adv.amount, 0);
  const totalUsed = advances.reduce((sum, adv) => sum + adv.used, 0);

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ color: colors.neutral[600] }}>Loading advances...</div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <h3 style={{ 
          ...typography.subheader,
          margin: 0,
          color: colors.neutral[900]
        }}>
          💳 Open Advances ({advances.length})
        </h3>
        {advances.length > 0 && (
          <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
            Total Remaining: <strong>{formatCurrency(totalRemaining)}</strong>
          </div>
        )}
      </div>

      {advances.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No Open Advances"
          description="You don't have any open advances. Request an advance to get started."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {advances.map((advance) => {
            const utilization = getUtilizationPercentage(advance);
            const utilizationColor = getUtilizationColor(utilization);
            const isExpired = advance.expiry_date && new Date(advance.expiry_date) < new Date();

            return (
              <div
                key={advance.id}
                style={{
                  padding: spacing.lg,
                  border: `1px solid ${isExpired ? colors.status.error : colors.neutral[200]}`,
                  borderRadius: borderRadius.md,
                  backgroundColor: isExpired ? colors.status.error + '05' : colors.neutral[50],
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: spacing.md
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      marginBottom: spacing.xs
                    }}>
                      <div style={{ ...typography.subheader, color: colors.neutral[900] }}>
                        {advance.purpose}
                      </div>
                      {isExpired && (
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: colors.status.error + '20',
                          color: colors.status.error,
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}>
                          EXPIRED
                        </span>
                      )}
                    </div>
                    <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Issued: {formatDate(advance.issued_date)}
                      {advance.expiry_date && ` • Expires: ${formatDate(advance.expiry_date)}`}
                    </div>

                    {/* Utilization Bar */}
                    <div style={{ marginTop: spacing.md }}>
                      <AdvanceUtilizationBar
                        amount={advance.amount}
                        used={advance.used}
                        remaining={advance.remaining}
                        showLabels={true}
                        showPercentage={true}
                        size="medium"
                        showWarning={true}
                      />
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: spacing.sm,
                    marginLeft: spacing.lg
                  }}>
                    <div style={{
                      ...typography.subheader,
                      color: colors.status.normal,
                      fontWeight: 700
                    }}>
                      {formatCurrency(advance.remaining)}
                    </div>
                    <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                      Remaining
                    </div>
                    <div style={{ display: 'flex', gap: spacing.xs, marginTop: spacing.xs }}>
                      {onViewLedger ? (
                        <Button
                          variant="secondary"
                          onClick={() => onViewLedger(advance.id)}
                          style={{ padding: `${spacing.xs}px ${spacing.sm}px`, fontSize: '12px' }}
                        >
                          View Ledger
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => window.location.href = `/app/expenses/advances/${advance.id}/ledger`}
                          style={{ padding: `${spacing.xs}px ${spacing.sm}px`, fontSize: '12px' }}
                        >
                          View Ledger
                        </Button>
                      )}
                      {onReturn && advance.remaining > 0 && (
                        <Button
                          variant="primary"
                          onClick={() => onReturn(advance)}
                          style={{ padding: `${spacing.xs}px ${spacing.sm}px`, fontSize: '12px' }}
                        >
                          Return
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {advances.length > 0 && (
        <StatsGrid
          gap="md"
          style={{
            marginTop: spacing.xl,
            padding: spacing.lg,
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.neutral[200]}`
          }}
        >
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Total Advances
            </div>
            <div style={{ ...typography.subheader, color: colors.neutral[900], fontWeight: 600 }}>
              {formatCurrency(totalAmount)}
            </div>
          </div>
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Total Used
            </div>
            <div style={{ ...typography.subheader, color: colors.status.error, fontWeight: 600 }}>
              {formatCurrency(totalUsed)}
            </div>
          </div>
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Total Remaining
            </div>
            <div style={{ ...typography.subheader, color: colors.status.normal, fontWeight: 600 }}>
              {formatCurrency(totalRemaining)}
            </div>
          </div>
        </StatsGrid>
      )}
    </div>
  );
};

