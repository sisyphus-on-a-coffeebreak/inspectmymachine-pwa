/**
 * Overview Tab
 * 
 * Summary statistics and high-level expense overview
 */

import React from 'react';
import { useAnalytics } from '../../../contexts/AnalyticsContext';
import { useExpenses } from '../../../lib/queries';
import { StatCard } from '../../../components/ui/StatCard';
import { colors, spacing } from '../../../lib/theme';
import { EmptyState } from '../../../components/ui/EmptyState';

export function OverviewTab() {
  const { filters } = useAnalytics();
  const { data: expensesData, isLoading } = useExpenses({ mine: false });

  const expenses = expensesData?.data || [];

  // Filter expenses based on analytics filters
  const filteredExpenses = expenses.filter((expense: any) => {
    // Date filter
    if (filters.dateRange) {
      const expenseDate = new Date(expense.date || expense.created_at);
      if (expenseDate < filters.dateRange.start || expenseDate > filters.dateRange.end) {
        return false;
      }
    }

    // Status filter
    if (filters.status && filters.status !== 'all' && expense.status !== filters.status) {
      return false;
    }

    // Category filter
    if (filters.categoryIds.length > 0 && !filters.categoryIds.includes(expense.category)) {
      return false;
    }

    // Project filter
    if (filters.projectIds.length > 0 && expense.project_id && !filters.projectIds.includes(expense.project_id)) {
      return false;
    }

    // Employee filter
    if (filters.employeeIds.length > 0 && expense.employee_id && !filters.employeeIds.includes(expense.employee_id)) {
      return false;
    }

    return true;
  });

  const stats = {
    total: filteredExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0),
    count: filteredExpenses.length,
    pending: filteredExpenses.filter((e: any) => e.status === 'pending').length,
    approved: filteredExpenses.filter((e: any) => e.status === 'approved').length,
    rejected: filteredExpenses.filter((e: any) => e.status === 'rejected').length,
    average: filteredExpenses.length > 0
      ? filteredExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0) / filteredExpenses.length
      : 0,
  };

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
        <div style={{ color: colors.neutral[600] }}>Loading overview...</div>
      </div>
    );
  }

  if (filteredExpenses.length === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No Expenses Found"
        description="No expenses match the current filters"
      />
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.lg,
          marginBottom: spacing.xl,
        }}
      >
        <StatCard
          label="Total Expenses"
          value={formatCurrency(stats.total)}
          color={colors.primary}
        />
        <StatCard
          label="Total Count"
          value={stats.count.toString()}
          color={colors.info[500] || colors.primary}
        />
        <StatCard
          label="Pending"
          value={stats.pending.toString()}
          color={colors.warning[500]}
        />
        <StatCard
          label="Approved"
          value={stats.approved.toString()}
          color={colors.success[500]}
        />
        <StatCard
          label="Rejected"
          value={stats.rejected.toString()}
          color={colors.error[500]}
        />
        <StatCard
          label="Average Amount"
          value={formatCurrency(stats.average)}
          color={colors.neutral[600]}
        />
      </div>

      <div
        style={{
          backgroundColor: colors.neutral[50],
          borderRadius: '12px',
          padding: spacing.lg,
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: spacing.md }}>
          Summary
        </h3>
        <p style={{ color: colors.neutral[600], lineHeight: 1.6 }}>
          Total expenses of {formatCurrency(stats.total)} across {stats.count} transactions.
          {stats.pending > 0 && ` ${stats.pending} expense(s) pending approval.`}
        </p>
      </div>
    </div>
  );
}



