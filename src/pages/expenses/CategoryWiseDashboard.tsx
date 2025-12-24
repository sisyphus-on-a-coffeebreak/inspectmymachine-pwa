/**
 * Category-Wise Expense Dashboard
 * 
 * Dedicated dashboard for analyzing expenses by category
 * Shows trends, comparisons, and detailed breakdowns
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExpenses } from '../../lib/queries';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { WideGrid } from '../../components/ui/ResponsiveGrid';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingError } from '../../components/ui/LoadingError';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface CategoryData {
  category: string;
  count: number;
  total_amount: number;
  average_amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  last_month_amount?: number;
}

interface CategoryExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  status: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'LOCAL_TRANSPORT': colors.primary,
  'INTERCITY_TRAVEL': colors.status.normal,
  'LODGING': colors.status.warning,
  'FOOD': colors.status.error,
  'TOLLS_PARKING': colors.neutral[500],
  'FUEL': colors.status.critical,
  'PARTS_REPAIR': '#8B5CF6',
  'RTO_COMPLIANCE': '#06B6D4',
  'DRIVER_PAYMENT': '#F59E0B',
  'RECHARGE': '#10B981',
  'CONSUMABLES_MISC': '#EC4899',
  'VENDOR_AGENT_FEE': '#6366F1',
  'MISC': colors.neutral[400],
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'LOCAL_TRANSPORT': 'Local Transport',
    'INTERCITY_TRAVEL': 'Intercity Travel',
    'LODGING': 'Lodging',
    'FOOD': 'Food',
    'TOLLS_PARKING': 'Tolls & Parking',
    'FUEL': 'Fuel',
    'PARTS_REPAIR': 'Parts & Repair',
    'RTO_COMPLIANCE': 'RTO Compliance',
    'DRIVER_PAYMENT': 'Driver Payment',
    'RECHARGE': 'Recharge',
    'CONSUMABLES_MISC': 'Consumables & Misc',
    'VENDOR_AGENT_FEE': 'Vendor/Agent Fee',
    'MISC': 'Miscellaneous',
  };
  return labels[category] || category.replace(/_/g, ' ');
};

export const CategoryWiseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'trends' | 'details'>('overview');

  // Fetch expenses
  const { data: expensesData, isLoading, error } = useExpenses({ mine: false });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Process expenses by category
  const categoryData = useMemo(() => {
    if (!expensesData?.data) return [];

    const expenses: CategoryExpense[] = expensesData.data.map((e: any) => ({
      id: String(e.id || ''),
      amount: Number(e.amount || 0),
      category: String(e.category || 'MISC'),
      description: String(e.description || e.notes || 'Expense'),
      date: e.date || e.ts || new Date().toISOString(),
      status: String(e.status || 'pending'),
    }));

    // Filter by date range
    const now = new Date();
    const startDate = new Date(now);
    if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
    else if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (dateRange === 'quarter') startDate.setMonth(now.getMonth() - 3);
    else if (dateRange === 'year') startDate.setFullYear(now.getFullYear() - 1);

    const filteredExpenses = dateRange === 'all' 
      ? expenses 
      : expenses.filter(e => new Date(e.date) >= startDate);

    // Calculate previous period for trend
    const prevStartDate = new Date(startDate);
    const periodDays = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : dateRange === 'quarter' ? 90 : dateRange === 'year' ? 365 : 0;
    if (periodDays > 0) {
      prevStartDate.setDate(prevStartDate.getDate() - periodDays);
    }
    const prevPeriodExpenses = dateRange === 'all' 
      ? [] 
      : expenses.filter(e => {
          const expDate = new Date(e.date);
          return expDate >= prevStartDate && expDate < startDate;
        });

    // Group by category
    const categoryMap: Record<string, { expenses: CategoryExpense[]; prevAmount: number }> = {};
    
    filteredExpenses.forEach(exp => {
      if (!categoryMap[exp.category]) {
        categoryMap[exp.category] = { expenses: [], prevAmount: 0 };
      }
      categoryMap[exp.category].expenses.push(exp);
    });

    // Calculate previous period amounts
    prevPeriodExpenses.forEach(exp => {
      if (categoryMap[exp.category]) {
        categoryMap[exp.category].prevAmount += exp.amount;
      }
    });

    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    const result: CategoryData[] = Object.entries(categoryMap).map(([category, data]) => {
      const total_amount = data.expenses.reduce((sum, e) => sum + e.amount, 0);
      const count = data.expenses.length;
      const average_amount = count > 0 ? total_amount / count : 0;
      const percentage = total > 0 ? (total_amount / total) * 100 : 0;
      
      // Calculate trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (data.prevAmount > 0) {
        const change = ((total_amount - data.prevAmount) / data.prevAmount) * 100;
        if (change > 5) trend = 'up';
        else if (change < -5) trend = 'down';
      }

      return {
        category,
        count,
        total_amount,
        average_amount,
        percentage,
        trend,
        last_month_amount: data.prevAmount,
      };
    });

    return result.sort((a, b) => b.total_amount - a.total_amount);
  }, [expensesData, dateRange]);

  // Get expenses for selected category
  const categoryExpenses = useMemo(() => {
    if (!selectedCategory || !expensesData?.data) return [];

    const expenses: CategoryExpense[] = expensesData.data.map((e: any) => ({
      id: String(e.id || ''),
      amount: Number(e.amount || 0),
      category: String(e.category || 'MISC'),
      description: String(e.description || e.notes || 'Expense'),
      date: e.date || e.ts || new Date().toISOString(),
      status: String(e.status || 'pending'),
    }));

    return expenses
      .filter(e => e.category === selectedCategory)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedCategory, expensesData]);

  // Chart data for pie chart
  const pieChartData = useMemo(() => {
    return categoryData.map(cat => ({
      name: getCategoryLabel(cat.category),
      value: cat.total_amount,
      category: cat.category,
    }));
  }, [categoryData]);

  // Chart data for bar chart
  const barChartData = useMemo(() => {
    return categoryData.map(cat => ({
      name: getCategoryLabel(cat.category),
      amount: cat.total_amount,
      count: cat.count,
      average: cat.average_amount,
      category: cat.category,
    }));
  }, [categoryData]);

  // Daily trends by category
  const dailyTrends = useMemo(() => {
    if (!expensesData?.data || !selectedCategory) return [];

    const expenses: CategoryExpense[] = expensesData.data
      .filter((e: any) => String(e.category || 'MISC') === selectedCategory)
      .map((e: any) => ({
        id: String(e.id || ''),
        amount: Number(e.amount || 0),
        category: String(e.category || 'MISC'),
        description: String(e.description || e.notes || 'Expense'),
        date: e.date || e.ts || new Date().toISOString(),
        status: String(e.status || 'pending'),
      }));

    // Group by date
    const dateMap: Record<string, number> = {};
    expenses.forEach(exp => {
      const date = new Date(exp.date).toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + exp.amount;
    });

    return Object.entries(dateMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }, [expensesData, selectedCategory]);

  if (isLoading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>⏳</div>
        <div style={{ color: colors.neutral[600] }}>Loading category analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: spacing.xl }}>
        <LoadingError
          resource="Category Analytics"
          error={error instanceof Error ? error : new Error('Failed to load category data')}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const totalAmount = categoryData.reduce((sum, cat) => sum + cat.total_amount, 0);
  const totalCount = categoryData.reduce((sum, cat) => sum + cat.count, 0);

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
        title="Category-Wise Expense Analytics"
        subtitle="Analyze expenses by category with detailed insights"
        icon="📊"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Expenses', path: '/app/expenses' },
          { label: 'Category Analytics' }
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/app/expenses')}
            icon="⬅️"
          >
            Back to Expenses
          </Button>
        }
      />

      {/* Date Range & View Mode Selector */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.md,
      }}>
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <label style={{ ...typography.label, color: colors.neutral[700] }}>Date Range:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            style={{
              padding: `${spacing.xs}px ${spacing.sm}px`,
              border: `1px solid ${colors.neutral[300]}`,
              borderRadius: borderRadius.sm,
              fontSize: '14px',
            }}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: spacing.xs, border: `1px solid ${colors.neutral[300]}`, borderRadius: borderRadius.sm, padding: '2px' }}>
          <button
            onClick={() => setViewMode('overview')}
            style={{
              padding: `${spacing.xs}px ${spacing.sm}px`,
              border: 'none',
              borderRadius: borderRadius.xs,
              backgroundColor: viewMode === 'overview' ? colors.primary : 'transparent',
              color: viewMode === 'overview' ? 'white' : colors.neutral[700],
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('trends')}
            style={{
              padding: `${spacing.xs}px ${spacing.sm}px`,
              border: 'none',
              borderRadius: borderRadius.xs,
              backgroundColor: viewMode === 'trends' ? colors.primary : 'transparent',
              color: viewMode === 'trends' ? 'white' : colors.neutral[700],
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Trends
          </button>
          <button
            onClick={() => setViewMode('details')}
            style={{
              padding: `${spacing.xs}px ${spacing.sm}px`,
              border: 'none',
              borderRadius: borderRadius.xs,
              backgroundColor: viewMode === 'details' ? colors.primary : 'transparent',
              color: viewMode === 'details' ? 'white' : colors.neutral[700],
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Details
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <WideGrid style={{ marginBottom: spacing.xl }}>
        <div style={{
          ...cardStyles.base,
          padding: spacing.lg,
          backgroundColor: 'white',
          border: `2px solid ${colors.primary}`,
        }}>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Total Categories
          </div>
          <div style={{ ...typography.header, color: colors.primary, fontWeight: 700 }}>
            {categoryData.length}
          </div>
        </div>

        <div style={{
          ...cardStyles.base,
          padding: spacing.lg,
          backgroundColor: 'white',
          border: `2px solid ${colors.status.normal}`,
        }}>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Total Expenses
          </div>
          <div style={{ ...typography.header, color: colors.status.normal, fontWeight: 700 }}>
            {formatCurrency(totalAmount)}
          </div>
        </div>

        <div style={{
          ...cardStyles.base,
          padding: spacing.lg,
          backgroundColor: 'white',
          border: `2px solid ${colors.status.warning}`,
        }}>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Expense Count
          </div>
          <div style={{ ...typography.header, color: colors.status.warning, fontWeight: 700 }}>
            {totalCount}
          </div>
        </div>

        <div style={{
          ...cardStyles.base,
          padding: spacing.lg,
          backgroundColor: 'white',
          border: `2px solid ${colors.neutral[300]}`,
        }}>
          <div style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>
            Avg per Expense
          </div>
          <div style={{ ...typography.header, color: colors.neutral[900], fontWeight: 700 }}>
            {formatCurrency(totalCount > 0 ? totalAmount / totalCount : 0)}
          </div>
        </div>
      </WideGrid>

      {/* Overview View */}
      {viewMode === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.xl, marginBottom: spacing.xl }}>
          {/* Pie Chart */}
          <div style={{
            ...cardStyles.base,
            padding: spacing.xl,
            backgroundColor: 'white',
          }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, color: colors.neutral[900] }}>
              Category Distribution
            </h3>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || colors.neutral[400]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon="📊" title="No Data" description="No expenses found for the selected period" />
            )}
          </div>

          {/* Bar Chart */}
          <div style={{
            ...cardStyles.base,
            padding: spacing.xl,
            backgroundColor: 'white',
          }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, color: colors.neutral[900] }}>
              Category Comparison
            </h3>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="amount" fill={colors.primary} name="Total Amount" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon="📊" title="No Data" description="No expenses found for the selected period" />
            )}
          </div>
        </div>
      )}

      {/* Trends View */}
      {viewMode === 'trends' && selectedCategory && (
        <div style={{
          ...cardStyles.base,
          padding: spacing.xl,
          backgroundColor: 'white',
          marginBottom: spacing.xl,
        }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, color: colors.neutral[900] }}>
            Daily Trends: {getCategoryLabel(selectedCategory)}
          </h3>
          {dailyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke={CATEGORY_COLORS[selectedCategory] || colors.primary} strokeWidth={2} name="Amount" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="📈" title="No Trends" description="Select a category to view trends" />
          )}
        </div>
      )}

      {/* Category List */}
      <div style={{
        ...cardStyles.base,
        padding: spacing.xl,
        backgroundColor: 'white',
      }}>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.lg, color: colors.neutral[900] }}>
          Category Breakdown
        </h3>
        {categoryData.length === 0 ? (
          <EmptyState icon="📊" title="No Categories" description="No expenses found for the selected period" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {categoryData.map((cat) => (
              <div
                key={cat.category}
                onClick={() => {
                  setSelectedCategory(cat.category);
                  setViewMode('details');
                }}
                style={{
                  padding: spacing.lg,
                  border: `2px solid ${selectedCategory === cat.category ? CATEGORY_COLORS[cat.category] || colors.primary : colors.neutral[200]}`,
                  borderRadius: borderRadius.md,
                  backgroundColor: selectedCategory === cat.category ? CATEGORY_COLORS[cat.category] + '10' : colors.neutral[50],
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: CATEGORY_COLORS[cat.category] || colors.neutral[400],
                    }} />
                    <div>
                      <div style={{ ...typography.subheader, color: colors.neutral[900], marginBottom: spacing.xs }}>
                        {getCategoryLabel(cat.category)}
                      </div>
                      <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        {cat.count} expenses • Avg: {formatCurrency(cat.average_amount)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      ...typography.subheader,
                      color: CATEGORY_COLORS[cat.category] || colors.neutral[900],
                      fontWeight: 700,
                      marginBottom: spacing.xs,
                    }}>
                      {formatCurrency(cat.total_amount)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                        {cat.percentage.toFixed(1)}% of total
                      </div>
                      {cat.trend === 'up' && <span style={{ color: colors.status.error }}>📈</span>}
                      {cat.trend === 'down' && <span style={{ color: colors.status.normal }}>📉</span>}
                      {cat.trend === 'stable' && <span style={{ color: colors.neutral[500] }}>➡️</span>}
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: colors.neutral[200],
                  borderRadius: borderRadius.sm,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${cat.percentage}%`,
                    height: '100%',
                    backgroundColor: CATEGORY_COLORS[cat.category] || colors.neutral[400],
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Details */}
      {viewMode === 'details' && selectedCategory && (
        <div style={{
          ...cardStyles.base,
          padding: spacing.xl,
          backgroundColor: 'white',
          marginTop: spacing.xl,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
            <h3 style={{ ...typography.subheader, margin: 0, color: colors.neutral[900] }}>
              Expenses: {getCategoryLabel(selectedCategory)}
            </h3>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedCategory(null);
                setViewMode('overview');
              }}
            >
              Close
            </Button>
          </div>
          {categoryExpenses.length === 0 ? (
            <EmptyState icon="📋" title="No Expenses" description="No expenses found for this category" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {categoryExpenses.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => navigate(`/app/expenses/${exp.id}`)}
                  style={{
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[200]}`,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.neutral[50],
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ ...typography.body, color: colors.neutral[900], marginBottom: spacing.xs }}>
                      {exp.description}
                    </div>
                    <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                      {new Date(exp.date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      ...typography.subheader,
                      color: colors.status.error,
                      fontWeight: 700,
                    }}>
                      {formatCurrency(exp.amount)}
                    </div>
                    <div style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                      {exp.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};


