/**
 * Ledger Reconciliation View
 * 
 * Full reconciliation view showing CR-DR summary
 * Balance verification and transaction breakdown
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses, useFloatBalance, useReconciliation } from '../../lib/queries';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { LedgerBalanceCard } from '../../components/ui/LedgerBalanceCard';
import { LoadingError } from '../../components/ui/LoadingError';

export const LedgerReconciliation: React.FC = () => {
  const navigate = useNavigate();

  // Fetch reconciliation data
  const { data: reconciliationData, isLoading: reconciliationLoading, error: reconciliationError, refetch: refetchReconciliation } = useReconciliation();
  const { data: floatData, isLoading: balanceLoading, error: balanceError } = useFloatBalance();

  const loading = reconciliationLoading || balanceLoading;
  const error = reconciliationError || balanceError;
  const currentBalance = Number(floatData?.balance ?? 0);

  // Use reconciliation data from API
  const reconciliation = reconciliationData || {
    opening_balance: 0,
    total_credits: 0,
    total_debits: 0,
    net_balance: 0,
    current_balance: currentBalance,
    calculated_balance: currentBalance,
    balance_matches: true,
    transaction_count: 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>⚖️</div>
        <div style={{ color: colors.neutral[600] }}>Loading reconciliation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <LoadingError
          resource="Reconciliation"
          error={error instanceof Error ? error : new Error('Failed to load reconciliation')}
          onRetry={() => { refetchReconciliation(); }}
        />
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: spacing.xl,
      fontFamily: typography.body.fontFamily,
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      <PageHeader
        title="Ledger Reconciliation"
        subtitle="Complete CR-DR summary and balance verification"
        icon="⚖️"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Expenses', path: '/app/expenses' },
          { label: 'Reconciliation' }
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/app/expenses/ledger')}
            icon="⬅️"
          >
            Back to Ledger
          </Button>
        }
      />

      {/* Current Balance Card */}
      <div style={{ marginBottom: spacing.xl }}>
        <LedgerBalanceCard
          balance={reconciliation.current_balance || currentBalance}
          label="Current Ledger Balance"
          variant="detailed"
        />
      </div>

      {/* Reconciliation Summary */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, color: colors.neutral[900] }}>
          Reconciliation Summary
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing.lg }}>
          {/* Opening Balance */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.neutral[200]}`,
          }}>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Opening Balance
            </div>
            <div style={{ ...typography.header, color: colors.neutral[900], fontWeight: 700 }}>
              {formatCurrency(reconciliation.opening_balance || 0)}
            </div>
          </div>

          {/* Total Credits */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.status.normal + '10',
            borderRadius: borderRadius.md,
            border: `2px solid ${colors.status.normal}`,
          }}>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Total Credits (CR)
            </div>
            <div style={{ ...typography.header, color: colors.status.normal, fontWeight: 700 }}>
              {formatCurrency(reconciliation.total_credits || 0)}
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
              Advances, Reimbursements
            </div>
          </div>

          {/* Total Debits */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.status.error + '10',
            borderRadius: borderRadius.md,
            border: `2px solid ${colors.status.error}`,
          }}>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Total Debits (DR)
            </div>
            <div style={{ ...typography.header, color: colors.status.error, fontWeight: 700 }}>
              {formatCurrency(reconciliation.total_debits || 0)}
            </div>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
              Expenses, Returns
            </div>
          </div>

          {/* Net Balance */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: (reconciliation.net_balance || 0) >= 0 
              ? colors.status.normal + '10'
              : colors.status.error + '10',
            borderRadius: borderRadius.md,
            border: `2px solid ${(reconciliation.net_balance || 0) >= 0 
              ? colors.status.normal
              : colors.status.error}`,
          }}>
            <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
              Net Balance (CR - DR)
            </div>
            <div style={{
              ...typography.header,
              color: (reconciliation.net_balance || 0) >= 0 
                ? colors.status.normal
                : colors.status.error,
              fontWeight: 700
            }}>
              {formatCurrency(reconciliation.net_balance || 0)}
            </div>
          </div>
        </div>

        {/* Balance Verification */}
        <div style={{
          marginTop: spacing.xl,
          padding: spacing.lg,
          backgroundColor: reconciliation.balance_matches 
            ? colors.status.normal + '10'
            : colors.status.warning + '20',
          border: `2px solid ${reconciliation.balance_matches 
            ? colors.status.normal
            : colors.status.warning}`,
          borderRadius: borderRadius.md,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <span style={{ fontSize: '1.5rem' }}>
              {reconciliation.balance_matches ? '✅' : '⚠️'}
            </span>
            <div style={{ ...typography.subheader, color: colors.neutral[900] }}>
              Balance Verification
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                Calculated Balance
              </div>
              <div style={{ ...typography.body, color: colors.neutral[900] }}>
                {formatCurrency(reconciliation.calculated_balance || 0)}
              </div>
            </div>
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                Current Balance
              </div>
              <div style={{ ...typography.body, color: colors.neutral[900] }}>
                {formatCurrency(reconciliation.current_balance || currentBalance)}
              </div>
            </div>
          </div>
          {reconciliation.balance_matches ? (
            <div style={{
              ...typography.bodySmall,
              color: colors.status.normal,
              marginTop: spacing.md,
              fontWeight: 600
            }}>
              ✓ Balances match! Reconciliation is correct.
            </div>
          ) : (
            <div style={{
              ...typography.bodySmall,
              color: colors.status.warning,
              marginTop: spacing.md,
              fontWeight: 600
            }}>
              ⚠️ Balance mismatch detected. Please review transactions.
            </div>
          )}
        </div>
      </div>

      {/* Transaction Count */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ ...typography.body, color: colors.neutral[700] }}>
          Total Transactions: <strong>{reconciliation.transaction_count || 0}</strong>
        </div>
        <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
          This includes all expenses (DR), advances (CR), reimbursements (CR), and returns (DR).
        </div>
      </div>
    </div>
  );
};

