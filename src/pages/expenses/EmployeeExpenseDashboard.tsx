import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses, useFloatBalance } from '../../lib/queries';
import { colors, typography, spacing, cardStyles, shadows, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { LedgerBalanceCard } from '../../components/ui/LedgerBalanceCard';
import { OpenAdvancesSummary } from '../../components/ui/OpenAdvancesSummary';
import { Card } from '../../components/ui/card';
import { PageTitle, SectionTitle } from '../../components/ui/Heading';
import { useAuth } from '../../providers/useAuth';
import { useAdvances } from '../../lib/queries';

// 💰 Employee Expense Dashboard
// Personal expense management for employees
// Shows spending overview, recent expenses, budget tracking, and quick actions

interface ExpenseSummary {
  total_spent: number;
  // Using remaining_budget field to display Advance Balance for employees
  remaining_budget: number;
  pending_approval: number;
  // Using approved_this_month field to display Approved This Period
  approved_this_month: number;
  category_breakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  recent_trends: Array<{
    date: string;
    amount: number;
  }>;
}

interface RecentExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt_url?: string;
  project_name?: string;
  asset_name?: string;
}

interface BudgetAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  percentage: number;
}

export const EmployeeExpenseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'quarter'>('month');
  
  // Check role at the start - structure by role immediately
  const isAdmin = user ? ['admin', 'supervisor', 'super_admin'].includes(user.role) : false;
  
  // Use React Query for expenses, float balance, and advances
  const { data: expensesData, isLoading: expensesLoading, error: expensesError, refetch: refetchExpenses } = useExpenses(
    { mine: true }
  );
  const { data: floatData, isLoading: floatLoading, error: floatError } = useFloatBalance();
  const { data: advancesData, isLoading: advancesLoading } = useAdvances({ status: 'open' });
  
  const loading = expensesLoading || floatLoading;
  const error = expensesError || floatError;
  
  // Process expenses data
  type ApiExpense = { id?: string|number; amount?: number; category?: string; notes?: string; ts?: string|Date; status?: string };
  const raw = expensesData?.data || [];
  const expenses = useMemo(() => raw.map((e: ApiExpense) => ({
    id: String(e.id ?? ''),
    amount: Number(e.amount ?? 0),
    category: String(e.category ?? 'OTHER'),
    description: String(e.notes ?? e.category ?? 'Expense'),
    date: (e.ts ? new Date(e.ts).toISOString() : new Date().toISOString()),
    status: (String(e.status ?? 'pending') as 'pending'|'approved'|'rejected'),
  })), [raw]);
  
  // Compute summary from expenses and float balance
  const { summary, recentExpenses, budgetAlerts } = useMemo(() => {
    // Filter by selected period (client-side)
    const now = new Date();
    const start = new Date(now);
    if (selectedPeriod === 'day') start.setDate(now.getDate() - 1);
    if (selectedPeriod === 'week') start.setDate(now.getDate() - 7);
    if (selectedPeriod === 'month') start.setMonth(now.getMonth() - 1);
    if (selectedPeriod === 'quarter') start.setMonth(now.getMonth() - 3);

    const inPeriod = expenses.filter(e => new Date(e.date) >= start);

    const total_spent = inPeriod.reduce((s, e) => s + (e.amount || 0), 0);
    const pending_approval = inPeriod.filter(e => e.status === 'pending')
      .reduce((s, e) => s + (e.amount || 0), 0);
    const approved_this_period = inPeriod.filter(e => e.status === 'approved')
      .reduce((s, e) => s + (e.amount || 0), 0);

    // Category breakdown
    const byCat: Record<string, number> = {};
    inPeriod.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    const catEntries = Object.entries(byCat);
    const catTotal = Math.max(1, catEntries.reduce((s, [, v]) => s + v, 0));
    const colorsList = [colors.primary, colors.status.normal, colors.status.warning, colors.status.critical, colors.neutral[500]];
    const category_breakdown = catEntries.map(([category, amount], idx) => ({
      category,
      amount,
      percentage: Math.round((amount / catTotal) * 1000) / 10,
      color: colorsList[idx % colorsList.length]
    }));

    // Recent trends (last 5 days)
    const recent_trends = Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (4 - i));
      const dayTotal = inPeriod.filter(e => new Date(e.date).toDateString() === d.toDateString())
        .reduce((s, e) => s + e.amount, 0);
      return { date: d.toISOString().slice(0, 10), amount: dayTotal };
    });

    // Float balance → show as Advance Balance (remaining_budget field)
    const advanceBalance = Number(floatData?.balance ?? 0);

    const summary: ExpenseSummary = {
      total_spent,
      remaining_budget: advanceBalance,
      pending_approval,
      approved_this_month: approved_this_period,
      category_breakdown,
      recent_trends,
    };

    // Recent expenses list (top 10)
    const recentExpenses: RecentExpense[] = inPeriod
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    // Alerts: pending items and low advance balance
    const alerts: BudgetAlert[] = [];
    const pendingCount = inPeriod.filter(e => e.status === 'pending').length;
    if (pendingCount > 0) alerts.push({ type: 'info', message: `${pendingCount} expenses are pending approval`, percentage: 0 });
    if (advanceBalance < 1000) alerts.push({ type: 'warning', message: 'Advance balance is running low', percentage: 0 });
    
    return { summary, recentExpenses, budgetAlerts: alerts };
  }, [expenses, selectedPeriod, floatData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.status.warning;
      case 'approved': return colors.status.normal;
      case 'rejected': return colors.status.critical;
      default: return colors.neutral[400];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return colors.status.warning;
      case 'danger': return colors.status.critical;
      case 'info': return colors.primary;
      default: return colors.neutral[400];
    }
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>💰</div>
        <div style={{ color: colors.neutral[600] }}>Loading expense dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <NetworkError
          error={error}
          onRetry={() => refetchExpenses()}
          onGoBack={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: spacing.xl,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Card variant="elevated" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.xl,
      }}>
        <div>
          <PageTitle style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            My Expenses
          </PageTitle>
          <p style={{ ...typography.bodySmall, color: colors.neutral[600], marginTop: spacing.xs }}>
            Manage your expenses, track spending, and monitor your budget
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/home')}
            icon="⬅️"
          >
            Back
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/expenses/record-advance')}
            icon="💰"
          >
            Record Advance
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/app/expenses/create')}
            icon="➕"
          >
            Add Expense
          </Button>
        </div>
      </Card>


      {/* Budget Alerts (only info-level) */}
      {budgetAlerts.filter(a => a.type === 'info').length > 0 && (
        <div style={{ marginBottom: spacing.xl }}>
          {budgetAlerts.filter(a => a.type === 'info').map((alert, index) => (
            <div
              key={`budget-alert-${alert.category || index}`}
              style={{
                padding: spacing.lg,
                backgroundColor: colors.info[50],
                border: `2px solid ${colors.info[200]}`,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.sm,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>
                {'ℹ️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  ...typography.subheader,
                  color: colors.info[800],
                  marginBottom: spacing.xs
                }}>
                  {alert.message}
                </div>
                {alert.percentage > 0 && (
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    backgroundColor: colors.neutral[200], 
                    borderRadius: borderRadius.sm,
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${alert.percentage}%`, 
                      height: '100%', 
                      backgroundColor: colors.info[500],
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Period Selector */}
      <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <span style={{ ...typography.label, color: colors.neutral[600] }}>View Period:</span>
          {['day', 'week', 'month', 'quarter'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'primary' : 'secondary'}
              onClick={() => setSelectedPeriod(period as 'day' | 'week' | 'month' | 'quarter')}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Key Statistics */}
      <div style={{ marginBottom: spacing.xl }}>
        <StatsGrid gap="lg">
          <Card variant="elevated" style={{ 
            border: `2px solid ${colors.primary}`,
            padding: spacing.xl,
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-primary" />
              💰 Total Spent
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: 'clamp(28px, 5vw, 32px)',
              color: colors.primary,
              fontWeight: 700
            }}>
              ₹{summary?.total_spent?.toLocaleString('en-IN') || 0}
            </div>
          </Card>

          <LedgerBalanceCard
            balance={summary?.remaining_budget || 0}
            label="Advance Balance"
            variant="default"
            onClick={() => navigate('/app/expenses/ledger')}
            showTooltip={true}
          />

          <div style={{ 
            ...cardStyles.base,
            padding: spacing.xl,
            backgroundColor: colors.background.white,
            border: `2px solid ${colors.status.warning}`,
            borderRadius: borderRadius.lg,
            boxShadow: shadows.card
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-warning" />
              ⏳ Pending Approval
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: 'clamp(28px, 5vw, 32px)',
              color: colors.status.warning,
              fontWeight: 700
            }}>
              ₹{summary?.pending_approval?.toLocaleString('en-IN') || 0}
            </div>
          </div>

          <div style={{ 
            ...cardStyles.base,
            padding: spacing.xl,
            backgroundColor: colors.background.white,
            border: `2px solid ${colors.status.normal}`,
            borderRadius: borderRadius.lg,
            boxShadow: shadows.card
          }}>
            <div style={{ 
              ...typography.label,
              color: colors.neutral[600], 
              marginBottom: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span className="status-dot status-dot-normal" />
              ✅ Approved This Period
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: 'clamp(28px, 5vw, 32px)',
              color: colors.status.normal,
              fontWeight: 700
            }}>
              ₹{summary?.approved_this_month?.toLocaleString('en-IN') || 0}
            </div>
          </div>
        </StatsGrid>
      </div>

      {/* Quick Actions */}
      <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
        <SectionTitle>
          Quick Actions
        </SectionTitle>
        
        <ActionGrid gap="md">
          <div
            onClick={() => navigate('/app/expenses/create')}
            style={{
              ...cardStyles.base,
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.primary}`,
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>➕</div>
            <div style={{ 
              ...typography.subheader,
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              Add Expense
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              Create new expense
            </div>
          </div>

          <div
            onClick={() => navigate('/app/expenses/history')}
            style={{
              ...cardStyles.base,
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.status.normal}`,
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📊</div>
            <div style={{ 
              ...typography.subheader,
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              Expense History
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              View all expenses
            </div>
          </div>

          <div
            onClick={() => navigate('/app/expenses/analytics?tab=by-category')}
            style={{
              ...cardStyles.base,
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.status.warning}`,
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📈</div>
            <div style={{ 
              ...typography.subheader,
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              Category Analytics
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              View by category
            </div>
          </div>

          <div
            onClick={() => navigate('/app/expenses/receipts')}
            style={{
              ...cardStyles.base,
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.status.warning}`,
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📄</div>
            <div style={{ 
              ...typography.subheader,
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              Receipts
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              Manage receipts
            </div>
          </div>

          <div
            onClick={() => navigate('/app/expenses/ledger')}
            style={{
              ...cardStyles.base,
              padding: spacing.lg,
              cursor: 'pointer',
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column' as const,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center' as const,
              border: `2px solid ${colors.primary}`,
              position: 'relative' as const
            }}
            className="card-hover touch-feedback"
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📊</div>
            <div style={{ 
              ...typography.subheader,
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              My Ledger
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              View transaction history
            </div>
          </div>
        </ActionGrid>
      </Card>

      {/* Admin-only section - only rendered for admins */}
      {isAdmin && (
        <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
          <SectionTitle>
            Admin Actions
          </SectionTitle>
          
          <ActionGrid gap="md">
            <div
              onClick={() => navigate('/app/approvals?tab=expense')}
              style={{
                ...cardStyles.base,
                padding: spacing.lg,
                cursor: 'pointer',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center' as const,
                border: `2px solid ${colors.status.warning}`,
                position: 'relative' as const
              }}
              className="card-hover touch-feedback"
            >
              <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>✅</div>
              <div style={{ 
                ...typography.subheader,
                color: colors.neutral[900],
                marginBottom: spacing.xs
              }}>
                Pending Approvals
              </div>
              <div style={{ 
                ...typography.bodySmall,
                color: colors.neutral[600]
              }}>
                Review expenses
              </div>
            </div>

            <div
              onClick={() => navigate('/app/expenses/reports')}
              style={{
                ...cardStyles.base,
                padding: spacing.lg,
                cursor: 'pointer',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center' as const,
                border: `2px solid ${colors.primary}`,
                position: 'relative' as const
              }}
              className="card-hover touch-feedback"
            >
              <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📊</div>
              <div style={{ 
                ...typography.subheader,
                color: colors.neutral[900],
                marginBottom: spacing.xs
              }}>
                Reports
              </div>
              <div style={{ 
                ...typography.bodySmall,
                color: colors.neutral[600]
              }}>
                Analytics & insights
              </div>
            </div>

            <div
              onClick={() => navigate('/app/expenses/analytics?tab=by-account')}
              style={{
                ...cardStyles.base,
                padding: spacing.lg,
                cursor: 'pointer',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center' as const,
                border: `2px solid ${colors.status.normal}`,
                position: 'relative' as const
              }}
              className="card-hover touch-feedback"
            >
              <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>👥</div>
              <div style={{ 
                ...typography.subheader,
                color: colors.neutral[900],
                marginBottom: spacing.xs
              }}>
                Accounts
              </div>
              <div style={{ 
                ...typography.bodySmall,
                color: colors.neutral[600]
              }}>
                Manage accounts
              </div>
            </div>

            <div
              onClick={() => navigate('/app/expenses/analytics?tab=cashflow')}
              style={{
                ...cardStyles.base,
                padding: spacing.lg,
                cursor: 'pointer',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center' as const,
                border: `2px solid ${colors.status.warning}`,
                position: 'relative' as const
              }}
              className="card-hover touch-feedback"
            >
              <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>💰</div>
              <div style={{ 
                ...typography.subheader,
                color: colors.neutral[900],
                marginBottom: spacing.xs
              }}>
                Cashflow
              </div>
              <div style={{ 
                ...typography.bodySmall,
                color: colors.neutral[600]
              }}>
                Cash flow analysis
              </div>
            </div>
          </ActionGrid>
        </Card>
      )}

      {/* Ledger Actions - Everyone sees these */}
      <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
        <SectionTitle>
          Ledger Actions
        </SectionTitle>
        
        <ActionGrid gap="md">
          <Card
            variant="interactive"
            onClick={() => navigate('/app/expenses/analytics?tab=reconciliation')}
            style={{
              padding: spacing.lg,
              minHeight: '100px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              border: `2px solid ${colors.primary}`,
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>⚖️</div>
            <div style={{ 
              ...typography.subheader,
              color: colors.neutral[900],
              marginBottom: spacing.xs
            }}>
              Reconciliation
            </div>
            <div style={{ 
              ...typography.bodySmall,
              color: colors.neutral[600]
            }}>
              CR-DR summary
            </div>
          </Card>
        </ActionGrid>
      </Card>

      {/* Category Breakdown */}
      {summary && (
        <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
          <SectionTitle>
            Spending by Category
          </SectionTitle>
          
          <div style={{ display: 'grid', gap: spacing.md }}>
            {summary.category_breakdown.map((category, index) => (
              <div key={`category-${category.category || index}`} style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.sm,
                backgroundColor: colors.neutral[50],
                borderRadius: borderRadius.md
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: category.color,
                  borderRadius: borderRadius.sm
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ 
                  ...typography.subheader,
                  color: colors.neutral[900],
                  marginBottom: spacing.xs
                  }}>
                  {category.category}
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  backgroundColor: colors.neutral[200], 
                  borderRadius: borderRadius.sm,
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${category.percentage}%`, 
                    height: '100%', 
                    backgroundColor: category.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
            ))}
          </div>
        </Card>
      )}

      {/* Open Advances */}
      {!isAdmin && (
        <Card variant="elevated" style={{ marginBottom: spacing.xl }}>
          <SectionTitle style={{ margin: 0 }}>
            Open Advances
          </SectionTitle>
          <OpenAdvancesSummary
            advances={advancesData?.data?.map((adv: any) => ({
              id: String(adv.id),
              amount: Number(adv.amount || 0),
              remaining: Number(adv.remaining || 0),
              used: Number(adv.used || 0),
              purpose: String(adv.purpose || ''),
              issued_date: adv.created_at || new Date().toISOString(),
              expiry_date: adv.expiry_date || undefined,
              status: (adv.status || 'open') as 'open' | 'closed' | 'expired',
            })) || []}
            loading={advancesLoading}
            onViewLedger={(advanceId) => navigate(`/app/expenses/advances/${advanceId}/ledger`)}
            onReturn={(advance) => {
              // Navigate to ledger with return action
              navigate('/app/expenses/ledger', {
                state: {
                  action: 'return_advance',
                  advanceId: advance.id,
                  advanceAmount: advance.remaining
                }
              });
            }}
          />
        </Card>
      )}

      {/* Recent Expenses */}
      <Card variant="elevated">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: spacing.lg
        }}>
          <SectionTitle style={{ margin: 0 }}>
            Recent Expenses
          </SectionTitle>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/expenses/history')}
            icon="👁️"
          >
            View All
          </Button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {recentExpenses.map((expense) => (
            <div
              key={expense.id}
              style={{
                padding: spacing.lg,
                border: '1px solid #E5E7EB',
                borderRadius: borderRadius.lg,
                backgroundColor: '#F9FAFB',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: spacing.sm
              }}>
                <div>
                  <h4 style={{ 
                    ...typography.subheader,
                    marginBottom: spacing.xs,
                    color: colors.neutral[900]
                  }}>
                    {expense.description}
                  </h4>
                  <p style={{ 
                    ...typography.bodySmall,
                    color: colors.neutral[600],
                    marginBottom: spacing.xs
                  }}>
                    {expense.category} • {new Date(expense.date).toLocaleDateString('en-IN')}
                  </p>
                  {(expense.project_name || expense.asset_name) && (
                    <p style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[500],
                    }}>
                      {expense.project_name && `Project: ${expense.project_name}`}
                      {expense.project_name && expense.asset_name && ' • '}
                      {expense.asset_name && `Asset: ${expense.asset_name}`}
                    </p>
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: spacing.xs
                }}>
                  <div style={{ 
                    ...typography.subheader,
                    color: colors.neutral[900],
                    fontWeight: 700
                  }}>
                    ₹{expense.amount.toLocaleString('en-IN')}
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: getStatusColor(expense.status),
                    color: 'white',
                    borderRadius: borderRadius.lg,
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {getStatusText(expense.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {recentExpenses.length === 0 && (
          <EmptyState
            icon="📋"
            title="No Recent Expenses"
            description="You haven't recorded any expenses yet. Start tracking your spending by adding your first expense."
            action={{
              label: "Add Expense",
              onClick: () => navigate('/app/expenses/create'),
              icon: "➕"
            }}
          />
        )}
      </Card>

    </div>
  );
};