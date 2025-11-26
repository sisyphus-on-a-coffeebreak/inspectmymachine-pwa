import React from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { LedgerBalanceCard, EmployeeLedger } from '../../components/ledger';
import { spacing } from '../../lib/theme';

/**
 * Employee Ledger Page
 *
 * Main ledger view for employees showing:
 * - Current balance with CR/DR breakdown
 * - Full transaction history
 * - Filters and search
 */

export const LedgerPage: React.FC = () => {
  return (
    <div style={{ padding: spacing.lg }}>
      <PageHeader
        title="My Ledger"
        subtitle="View your account balance and transaction history"
        breadcrumbs={[
          { label: 'Dashboard', path: '/app' },
          { label: 'Ledger', path: '/app/ledger' },
        ]}
      />

      <div style={{ marginTop: spacing.lg, display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
        {/* Balance Card */}
        <LedgerBalanceCard />

        {/* Transaction History */}
        <EmployeeLedger />
      </div>
    </div>
  );
};
