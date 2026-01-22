/**
 * Expense Analytics Page
 * 
 * Unified analytics dashboard consolidating all expense analysis views:
 * - Overview (summary stats)
 * - By Account
 * - By Category
 * - By Project
 * - Cashflow
 * - Assets
 * - Reconciliation
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnalyticsProvider, useAnalytics } from '../../contexts/AnalyticsContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Button } from '../../components/ui/button';
import { colors, spacing, typography } from '../../lib/theme';
import { OverviewTab } from './analytics/OverviewTab';
import { AccountAnalyticsTab } from './analytics/AccountAnalyticsTab';
import { CategoryAnalyticsTab } from './analytics/CategoryAnalyticsTab';
import { ProjectAnalyticsTab } from './analytics/ProjectAnalyticsTab';
import { CashflowTab } from './analytics/CashflowTab';
import { AssetsTab } from './analytics/AssetsTab';
import { ReconciliationTab } from './analytics/ReconciliationTab';

type AnalyticsTab = 'overview' | 'by-account' | 'by-category' | 'by-project' | 'cashflow' | 'assets' | 'reconciliation';

const analyticsTabs: Array<{ id: AnalyticsTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'by-account', label: 'By Account' },
  { id: 'by-category', label: 'By Category' },
  { id: 'by-project', label: 'By Project' },
  { id: 'cashflow', label: 'Cashflow' },
  { id: 'assets', label: 'Assets' },
  { id: 'reconciliation', label: 'Reconciliation' },
];

function ExpenseAnalyticsContent() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, updateDateRange, clearFilters } = useAnalytics();

  // Get active tab from URL or default to overview
  const activeTab = (searchParams.get('tab') as AnalyticsTab) || 'overview';
  const [currentTab, setCurrentTab] = useState<AnalyticsTab>(activeTab);

  const handleTabChange = (tab: string) => {
    const tabId = tab as AnalyticsTab;
    setCurrentTab(tabId);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabId);
    setSearchParams(newParams, { replace: true });
  };

  const formatDateRange = () => {
    const start = filters.dateRange.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const end = filters.dateRange.end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewTab />;
      case 'by-account':
        return <AccountAnalyticsTab />;
      case 'by-category':
        return <CategoryAnalyticsTab />;
      case 'by-project':
        return <ProjectAnalyticsTab />;
      case 'cashflow':
        return <CashflowTab />;
      case 'assets':
        return <AssetsTab />;
      case 'reconciliation':
        return <ReconciliationTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: spacing.xl,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: colors.neutral[50],
        minHeight: '100vh',
      }}
    >
      <PageHeader
        title="Expense Analytics"
        subtitle="Comprehensive expense analysis and reporting"
        icon="📊"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Expenses', path: '/app/expenses' },
          { label: 'Analytics' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <select
              value={formatDateRange()}
              onChange={(e) => {
                const value = e.target.value;
                if (['Last 7 days', 'Last 30 days', 'Last 90 days', 'This Month', 'This Quarter', 'This Year', 'All Time'].includes(value)) {
                  if (value === 'Last 7 days') updateDateRange('week');
                  else if (value === 'Last 30 days' || value === 'This Month') updateDateRange('month');
                  else if (value === 'Last 90 days' || value === 'This Quarter') updateDateRange('quarter');
                  else if (value === 'This Year') updateDateRange('year');
                  else if (value === 'All Time') updateDateRange('all');
                }
              }}
              style={{
                padding: spacing.sm,
                borderRadius: '8px',
                border: `1px solid ${colors.neutral[300]}`,
                fontSize: '14px',
              }}
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
              <option>All Time</option>
            </select>
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button variant="secondary" onClick={() => navigate('/app/expenses')}>
              Back to Expenses
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: spacing.md,
          marginBottom: spacing.lg,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <SegmentedControl
          options={analyticsTabs.map((tab) => ({
            value: tab.id,
            label: tab.label,
          }))}
          value={currentTab}
          onChange={handleTabChange}
          fullWidth
        />
      </div>

      {/* Shared Filter Bar */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: spacing.lg,
          marginBottom: spacing.lg,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: spacing.md,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div style={{ ...typography.label, color: colors.neutral[600] }}>Filters:</div>
          <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
            <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>Date:</span>
            <span style={{ ...typography.body, fontWeight: 600 }}>{formatDateRange()}</span>
          </div>
          {(filters.accountIds.length > 0 ||
            filters.categoryIds.length > 0 ||
            filters.projectIds.length > 0 ||
            filters.employeeIds.length > 0) && (
            <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
              {filters.accountIds.length > 0 && (
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor: colors.primary + '20',
                    color: colors.primary,
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                >
                  {filters.accountIds.length} Account(s)
                </span>
              )}
              {filters.categoryIds.length > 0 && (
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor: colors.success[500] + '20',
                    color: colors.success[500],
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                >
                  {filters.categoryIds.length} Category(ies)
                </span>
              )}
              {filters.projectIds.length > 0 && (
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor: colors.warning[500] + '20',
                    color: colors.warning[500],
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                >
                  {filters.projectIds.length} Project(s)
                </span>
              )}
              {filters.employeeIds.length > 0 && (
                <span
                  style={{
                    padding: '4px 8px',
                    backgroundColor: colors.info[500] + '20' || colors.primary + '20',
                    color: colors.info[500] || colors.primary,
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                >
                  {filters.employeeIds.length} Employee(s)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: spacing.xl,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {renderTabContent()}
      </div>
    </div>
  );
}

export const ExpenseAnalytics: React.FC = () => {
  return (
    <AnalyticsProvider>
      <ExpenseAnalyticsContent />
    </AnalyticsProvider>
  );
};











