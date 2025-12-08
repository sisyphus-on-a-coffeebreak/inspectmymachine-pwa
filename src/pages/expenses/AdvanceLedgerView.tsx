/**
 * Advance-Specific Ledger View
 * 
 * Shows ledger transactions filtered by a specific advance
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLedgerTransactions, useFloatBalance, useAdvances } from '../../lib/queries';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { LedgerBalanceCard } from '../../components/ui/LedgerBalanceCard';
import { LedgerTimeline } from '../../components/ui/LedgerTimeline';
import { AdvanceUtilizationBar } from '../../components/ui/AdvanceUtilizationBar';
import { LoadingError } from '../../components/ui/LoadingError';
import { EmptyState } from '../../components/ui/EmptyState';

export const AdvanceLedgerView: React.FC = () => {
  const { advanceId } = useParams<{ advanceId: string }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');

  // Fetch advance details
  const { data: advancesData } = useAdvances();
  const advance = advancesData?.data?.find((a: any) => a.id === advanceId);

  // Fetch all transactions and filter by advance
  const { data: transactionsData, isLoading, error } = useLedgerTransactions({ per_page: 1000 });
  const { data: floatData } = useFloatBalance();

  const currentBalance = Number(floatData?.balance ?? 0);

  // Filter transactions related to this advance
  const advanceTransactions = useMemo(() => {
    if (!transactionsData?.data || !advanceId) return [];
    
    return transactionsData.data
      .filter((tx: any) => 
        tx.reference_type === 'advance' && tx.reference_id === advanceId ||
        tx.reference_type === 'advance_return' && tx.reference_id === advanceId
      )
      .map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        date: tx.date,
        category: tx.category,
        reference_id: tx.reference_id,
        reference_type: tx.reference_type,
        running_balance: tx.running_balance,
      }));
  }, [transactionsData, advanceId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>⏳</div>
        <div style={{ color: colors.neutral[600] }}>Loading advance ledger...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <LoadingError
          resource="Advance Ledger"
          error={error instanceof Error ? error : new Error('Failed to load advance ledger')}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (!advance) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <EmptyState
          icon="💳"
          title="Advance Not Found"
          description="The requested advance could not be found."
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
        title={`Advance: ${advance.purpose}`}
        subtitle="Transaction history for this advance"
        icon="💳"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Expenses', path: '/app/expenses' },
          { label: 'Ledger', path: '/app/expenses/ledger' },
          { label: 'Advance Ledger' }
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

      {/* Advance Details Card */}
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{
          ...cardStyles.base,
          padding: spacing.xl,
          backgroundColor: 'white',
          border: `2px solid ${colors.status.normal}`,
          borderRadius: borderRadius.lg,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.xl }}>
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                Purpose
              </div>
              <div style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.md }}>
                {advance.purpose}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.md }}>
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Issued Date
                  </div>
                  <div style={{ ...typography.body, color: colors.neutral[700] }}>
                    {new Date(advance.issued_date).toLocaleDateString('en-IN')}
                  </div>
                </div>
                {advance.expiry_date && (
                  <div>
                    <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      Expiry Date
                    </div>
                    <div style={{ ...typography.body, color: colors.neutral[700] }}>
                      {new Date(advance.expiry_date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.md }}>
                Utilization
              </div>
              <AdvanceUtilizationBar
                amount={advance.amount}
                used={advance.used}
                remaining={advance.remaining}
                showLabels={true}
                showPercentage={true}
                size="large"
                showWarning={true}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: spacing.md, marginTop: spacing.lg }}>
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Total
                  </div>
                  <div style={{ ...typography.subheader, color: colors.neutral[900], fontWeight: 600 }}>
                    {formatCurrency(advance.amount)}
                  </div>
                </div>
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Used
                  </div>
                  <div style={{ ...typography.subheader, color: colors.status.error, fontWeight: 600 }}>
                    {formatCurrency(advance.used)}
                  </div>
                </div>
                <div>
                  <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
                    Remaining
                  </div>
                  <div style={{ ...typography.subheader, color: colors.status.normal, fontWeight: 600 }}>
                    {formatCurrency(advance.remaining)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <h3 style={{ ...typography.subheader, margin: 0, color: colors.neutral[900] }}>
            Transactions ({advanceTransactions.length})
          </h3>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <div style={{ display: 'flex', gap: spacing.xs, border: `1px solid ${colors.neutral[300]}`, borderRadius: borderRadius.sm, padding: '2px' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  border: 'none',
                  borderRadius: borderRadius.xs,
                  backgroundColor: viewMode === 'list' ? colors.primary : 'transparent',
                  color: viewMode === 'list' ? 'white' : colors.neutral[700],
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                style={{
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  border: 'none',
                  borderRadius: borderRadius.xs,
                  backgroundColor: viewMode === 'timeline' ? colors.primary : 'transparent',
                  color: viewMode === 'timeline' ? 'white' : colors.neutral[700],
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Timeline
              </button>
            </div>
          </div>
        </div>

        {advanceTransactions.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No Transactions"
            description="No transactions found for this advance."
          />
        ) : viewMode === 'timeline' ? (
          <LedgerTimeline
            transactions={advanceTransactions}
            showBalance={true}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {advanceTransactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  padding: spacing.md,
                  border: `1px solid ${colors.neutral[200]}`,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.neutral[50],
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.xs }}>
                      {tx.description}
                    </div>
                    <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                      {new Date(tx.date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      ...typography.subheader,
                      color: tx.type === 'CR' ? colors.status.normal : colors.status.error,
                      fontWeight: 700,
                    }}>
                      {tx.type === 'CR' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


