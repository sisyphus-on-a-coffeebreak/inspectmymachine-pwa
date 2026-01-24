/**
 * Employee Ledger Detail View
 * 
 * Shows complete ledger transaction history with:
 * - Opening balance
 * - All transactions (CR/DR) with running balance
 * - Search and filters
 * - CR/DR color coding
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExpenses, useFloatBalance, useLedgerTransactions } from '../../lib/queries';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { LedgerBalanceCard } from '../../components/ui/LedgerBalanceCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { WideGrid } from '../../components/ui/ResponsiveGrid';
import { LoadingError } from '../../components/ui/LoadingError';
import { LedgerTimeline } from '../../components/ui/LedgerTimeline';

interface LedgerTransaction {
  id: string;
  type: 'CR' | 'DR' | 'OPENING';
  amount: number;
  description: string;
  date: string;
  category?: string;
  reference_id?: string;
  reference_type?: 'expense' | 'advance' | 'reimbursement' | 'cash_return' | 'advance_return';
  running_balance: number;
}

const exportToCSV = (transactions: LedgerTransaction[]) => {
  const headers = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Running Balance', 'Reference Type'];
  const rows = transactions.map(tx => [
    new Date(tx.date).toLocaleDateString('en-IN'),
    tx.type,
    tx.description,
    tx.category || '',
    tx.amount.toString(),
    tx.running_balance.toString(),
    tx.reference_type || '',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  return csvContent;
};

export const EmployeeLedger: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'CR' | 'DR'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  // Fetch ledger transactions and balance
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useLedgerTransactions(
    { 
      type: typeFilter !== 'all' ? typeFilter : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      search: searchTerm || undefined,
      per_page: 100,
    }
  );
  const { data: floatData, isLoading: balanceLoading, error: balanceError } = useFloatBalance();

  const loading = transactionsLoading || balanceLoading;
  const error = transactionsError || balanceError;
  const currentBalance = Number(floatData?.balance ?? 0);
  
  // Transform API transactions to our format
  const ledgerTransactions = useMemo(() => {
    const apiTransactions = transactionsData?.data || [];
    return apiTransactions.map((tx: any) => ({
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
  }, [transactionsData]);

  // Transactions are already filtered by the API, but we can apply additional client-side filters if needed
  const filteredTransactions = ledgerTransactions;

  // Calculate summary
  const summary = useMemo(() => {
    const crTotal = filteredTransactions
      .filter(t => t.type === 'CR')
      .reduce((sum, t) => sum + t.amount, 0);
    const drTotal = filteredTransactions
      .filter(t => t.type === 'DR')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      crTotal,
      drTotal,
      netBalance: crTotal - drTotal,
      transactionCount: filteredTransactions.length - 1, // Exclude opening balance
    };
  }, [filteredTransactions]);

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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CR': return '📈';
      case 'DR': return '📉';
      case 'OPENING': return '⚖️';
      default: return '💰';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'CR': return colors.status.normal;
      case 'DR': return colors.status.error;
      case 'OPENING': return colors.neutral[500];
      default: return colors.neutral[400];
    }
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📊</div>
        <div style={{ color: colors.neutral[600] }}>Loading ledger...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <LoadingError
          resource="Ledger"
          error={error instanceof Error ? error : new Error('Failed to load ledger')}
          onRetry={() => { refetchTransactions(); }}
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
        title="My Ledger"
        subtitle="Complete transaction history with running balance"
        icon="📊"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Expenses', path: '/app/expenses' },
          { label: 'Ledger' }
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/app/expenses')}
            icon="⬅️"
          >
            Back
          </Button>
        }
      />

      {/* Current Balance Card */}
      <div style={{ marginBottom: spacing.xl }}>
        <LedgerBalanceCard
          balance={currentBalance}
          label="Current Ledger Balance"
          variant="detailed"
          onClick={() => navigate('/app/expenses/analytics?tab=reconciliation')}
        />
      </div>

      {/* Summary Cards */}
      <WideGrid gap="lg" style={{ marginBottom: spacing.xl }}>
        <div style={{
          ...cardStyles.base,
          padding: spacing.lg,
          backgroundColor: 'white',
          border: `2px solid ${colors.status.normal}`,
          borderRadius: borderRadius.md,
        }}>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Total Credits (CR)
          </div>
          <div style={{ ...typography.header, color: colors.status.normal, fontWeight: 700 }}>
            {formatCurrency(summary.crTotal)}
          </div>
        </div>

        <div style={{
          ...cardStyles.base,
          padding: spacing.lg,
          backgroundColor: 'white',
          border: `2px solid ${colors.status.error}`,
          borderRadius: borderRadius.md,
        }}>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Total Debits (DR)
          </div>
          <div style={{ ...typography.header, color: colors.status.error, fontWeight: 700 }}>
            {formatCurrency(summary.drTotal)}
          </div>
        </div>

        <div style={{
          ...cardStyles.base,
          padding: spacing.lg,
          backgroundColor: 'white',
          border: `2px solid ${colors.primary}`,
          borderRadius: borderRadius.md,
        }}>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Net Balance
          </div>
          <div style={{
            ...typography.header,
            color: summary.netBalance >= 0 ? colors.status.normal : colors.status.error,
            fontWeight: 700
          }}>
            {formatCurrency(summary.netBalance)}
          </div>
        </div>

        <div style={{
          ...cardStyles.base,
          padding: spacing.lg,
          backgroundColor: 'white',
          border: `2px solid ${colors.neutral[300]}`,
          borderRadius: borderRadius.md,
        }}>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Transactions
          </div>
          <div style={{ ...typography.header, color: colors.neutral[900], fontWeight: 700 }}>
            {summary.transactionCount}
          </div>
        </div>
      </WideGrid>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <WideGrid gap="lg">
          <div>
            <Label>Search</Label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              style={{ marginTop: spacing.xs }}
            />
          </div>

          <div>
            <Label>Type</Label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                marginTop: spacing.xs
              }}
            >
              <option value="all">All Types</option>
              <option value="CR">Credits (CR)</option>
              <option value="DR">Debits (DR)</option>
            </select>
          </div>

          <div>
            <Label>Date From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ marginTop: spacing.xs }}
            />
          </div>

          <div>
            <Label>Date To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ marginTop: spacing.xs }}
            />
          </div>
        </WideGrid>
      </div>

      {/* Transactions List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <h3 style={{ ...typography.subheader, margin: 0, color: colors.neutral[900] }}>
            Transaction History ({filteredTransactions.length})
          </h3>
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            {/* View Mode Toggle */}
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
            {/* Export Button */}
            <Button
              variant="secondary"
              onClick={() => {
                const csv = exportToCSV(filteredTransactions);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ledger-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              icon="📥"
            >
              Export CSV
            </Button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No Transactions Found"
            description="No transactions match your filters. Try adjusting your search criteria."
          />
        ) : viewMode === 'timeline' ? (
          <LedgerTimeline
            transactions={filteredTransactions}
            showBalance={true}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {filteredTransactions.map((transaction) => {
              const isOpening = transaction.type === 'OPENING';
              const transactionColor = getTransactionColor(transaction.type);

              return (
                <div
                  key={transaction.id}
                  style={{
                    padding: spacing.lg,
                    border: `1px solid ${isOpening ? colors.neutral[300] : colors.neutral[200]}`,
                    borderRadius: borderRadius.md,
                    backgroundColor: isOpening ? colors.neutral[50] : 'white',
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto',
                    gap: spacing.md,
                    alignItems: 'center',
                  }}
                >
                  {/* Icon */}
                  <div style={{ fontSize: '1.5rem' }}>
                    {getTransactionIcon(transaction.type)}
                  </div>

                  {/* Description */}
                  <div>
                    <div style={{
                      ...typography.subheader,
                      marginBottom: spacing.xs,
                      color: colors.neutral[900]
                    }}>
                      {transaction.description}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: spacing.md,
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        {formatDate(transaction.date)}
                      </span>
                      {transaction.category && (
                        <span style={{
                          ...typography.bodySmall,
                          color: colors.neutral[500],
                          fontSize: '12px'
                        }}>
                          {transaction.category}
                        </span>
                      )}
                      {transaction.reference_type && (
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: transactionColor + '20',
                          color: transactionColor,
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                        }}>
                          {(transaction.reference_type === 'advance_return' || transaction.reference_type === 'cash_return') && (
                            <span style={{ fontSize: '10px' }}>↩️</span>
                          )}
                          {transaction.reference_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs,
                      justifyContent: 'flex-end'
                    }}>
                      {!isOpening && (
                        <span style={{
                          padding: '2px 6px',
                          backgroundColor: transactionColor + '20',
                          color: transactionColor,
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}>
                          {transaction.type}
                        </span>
                      )}
                      <div style={{
                        ...typography.subheader,
                        color: transactionColor,
                        fontWeight: 700,
                        fontSize: isOpening ? '20px' : '18px'
                      }}>
                        {isOpening ? formatCurrency(transaction.amount) : 
                         transaction.type === 'CR' 
                           ? `+${formatCurrency(transaction.amount)}`
                           : `-${formatCurrency(transaction.amount)}`}
                      </div>
                    </div>
                  </div>

                  {/* Running Balance */}
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ ...typography.label, color: colors.neutral[600], fontSize: '11px', marginBottom: spacing.xs }}>
                      Balance
                    </div>
                    <div style={{
                      ...typography.subheader,
                      color: transaction.running_balance >= 0 ? colors.status.normal : colors.status.error,
                      fontWeight: 600,
                      fontSize: '16px'
                    }}>
                      {formatCurrency(transaction.running_balance)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

