import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../providers/ToastProvider';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { StatsGrid, CardGrid } from '../../components/ui/ResponsiveGrid';

// 📊 Expense Reports & Analytics
// Comprehensive reporting dashboard for expense analytics
// Shows statistics, trends, and detailed reports

interface ExpenseStats {
  total_expenses: number;
  pending: number;
  approved: number;
  rejected: number;
  approved_amount: number;
  pending_amount: number;
  total_amount: number;
  average_amount: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  total_amount: number;
  average_amount: number;
}

interface PaymentMethodBreakdown {
  payment_method: string;
  count: number;
  total_amount: number;
}

interface DailyTrend {
  date: string;
  count: number;
  total_amount: number;
}

interface TopSpender {
  employee_name: string;
  employee_id: string;
  expense_count: number;
  total_amount: number;
  average_amount: number;
}

interface ProjectExpense {
  project_name: string;
  project_code: string;
  expense_count: number;
  total_amount: number;
  average_amount: number;
}

interface AssetExpense {
  asset_name: string;
  asset_type: string;
  expense_count: number;
  total_amount: number;
  average_amount: number;
}

export const ExpenseReports: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = useState<PaymentMethodBreakdown[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [topSpenders, setTopSpenders] = useState<TopSpender[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [assetExpenses, setAssetExpenses] = useState<AssetExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedTab, setSelectedTab] = useState<'summary' | 'analytics' | 'cashflow'>('summary');

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);

      // Convert date range to days (backend expects number of days)
      const dateRangeDays: Record<string, number> = {
        'week': 7,
        'month': 30,
        'quarter': 90,
        'year': 365
      };
      const days = dateRangeDays[dateRange] || 30;

      // Fetch summary data
      const summaryResponse = await apiClient.get('/v1/expense-reports/summary', {
        params: { date_range: days }
      });

      // Fetch analytics data
      const analyticsResponse = await apiClient.get('/v1/expense-reports/analytics', {
        params: { date_range: days }
      });

      // Backend returns { success: true, data: { summary: ..., category_breakdown: ..., etc } }
      const summaryData = summaryResponse.data.data || summaryResponse.data;
      const analyticsData = analyticsResponse.data.data || analyticsResponse.data;

      setStats(summaryData.summary);
      setCategoryBreakdown(summaryData.category_breakdown || []);
      setPaymentMethodBreakdown(summaryData.payment_method_breakdown || []);
      setDailyTrends(summaryData.daily_trends || []);
      setTopSpenders(analyticsData.top_spenders || []);
      setProjectExpenses(analyticsData.project_expenses || []);
      setAssetExpenses(analyticsData.asset_expenses || []);

    } catch (error) {
      // Error is already handled by apiClient
      // Don't use mock data - show empty state instead
      // This ensures we know when the API is actually failing
      setStats({
        total_expenses: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        approved_amount: 0,
        pending_amount: 0,
        total_amount: 0,
        average_amount: 0
      });
      setCategoryBreakdown([]);
      setPaymentMethodBreakdown([]);
      setDailyTrends([]);
      setTopSpenders([]);
      setProjectExpenses([]);
      setAssetExpenses([]);
      
      // Keep old mock data code commented out for reference
      /*
      // Mock data for development
      setStats({
        total_expenses: 156,
        pending: 12,
        approved: 134,
        rejected: 10,
        approved_amount: 450000,
        pending_amount: 35000,
        total_amount: 485000,
        average_amount: 3109
      });
      setCategoryBreakdown([
        { category: 'fuel', count: 45, total_amount: 125000, average_amount: 2778 },
        { category: 'meals', count: 32, total_amount: 85000, average_amount: 2656 },
        { category: 'transport', count: 28, total_amount: 95000, average_amount: 3393 },
        { category: 'materials', count: 25, total_amount: 120000, average_amount: 4800 },
        { category: 'other', count: 26, total_amount: 60000, average_amount: 2308 }
      ]);
      setPaymentMethodBreakdown([
        { payment_method: 'cash', count: 78, total_amount: 245000 },
        { payment_method: 'card', count: 45, total_amount: 180000 },
        { payment_method: 'upi', count: 33, total_amount: 60000 }
      ]);
      setDailyTrends([
        { date: '2024-01-15', count: 8, total_amount: 25000 },
        { date: '2024-01-16', count: 12, total_amount: 35000 },
        { date: '2024-01-17', count: 6, total_amount: 18000 },
        { date: '2024-01-18', count: 15, total_amount: 42000 },
        { date: '2024-01-19', count: 9, total_amount: 28000 }
      ]);
      setTopSpenders([
        { employee_name: 'John Smith', employee_id: 'EMP001', expense_count: 15, total_amount: 45000, average_amount: 3000 },
        { employee_name: 'Jane Doe', employee_id: 'EMP002', expense_count: 12, total_amount: 38000, average_amount: 3167 },
        { employee_name: 'Mike Johnson', employee_id: 'EMP003', expense_count: 10, total_amount: 32000, average_amount: 3200 }
      ]);
      setProjectExpenses([
        { project_name: 'Project Alpha', project_code: 'PA001', expense_count: 45, total_amount: 180000, average_amount: 4000 },
        { project_name: 'Project Beta', project_code: 'PB002', expense_count: 32, total_amount: 125000, average_amount: 3906 },
        { project_name: 'Project Gamma', project_code: 'PG003', expense_count: 28, total_amount: 95000, average_amount: 3393 }
      ]);
      setAssetExpenses([
        { asset_name: 'Vehicle A', asset_type: 'vehicle', expense_count: 25, total_amount: 75000, average_amount: 3000 },
        { asset_name: 'Equipment B', asset_type: 'equipment', expense_count: 18, total_amount: 45000, average_amount: 2500 },
        { asset_name: 'Tool C', asset_type: 'tool', expense_count: 12, total_amount: 18000, average_amount: 1500 }
      ]);
      */
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const exportToCSV = async () => {
    try {
      const response = await apiClient.get('/v1/expense-reports/export', {
        params: { 
          date_range: dateRange,
          format: 'csv'
        }
      });

      const csvContent = response.data.csv_content;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to export data. Please try again.',
        variant: 'error',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading && !stats) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
        <div style={{ color: '#6B7280' }}>Loading expense reports...</div>
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
      <div style={{ 
        marginBottom: spacing.xl,
        padding: spacing.xl,
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: spacing.lg
        }}>
          <div>
            <h1 style={{ 
              ...typography.header, 
              margin: 0, 
              color: colors.neutral[900],
              fontSize: '2rem',
              fontWeight: 700
            }}>
              📊 Expense Reports
            </h1>
            <p style={{ 
              ...typography.body, 
              color: colors.neutral[600], 
              margin: 0,
              marginTop: spacing.sm
            }}>
              Comprehensive expense analytics and reporting
            </p>
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/app/expenses')}
            >
              ← Back to Expenses
            </Button>
            <Button
              variant="primary"
              onClick={exportToCSV}
            >
              📥 Export CSV
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div style={{ 
          display: 'flex', 
          gap: spacing.sm, 
          marginBottom: spacing.lg 
        }}>
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'primary' : 'secondary'}
              onClick={() => setDateRange(range as any)}
            >
              {range}
            </Button>
          ))}
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: spacing.sm, 
          borderBottom: `1px solid ${colors.neutral[200]}` 
        }}>
          {[
            { key: 'summary', label: 'Summary', icon: '📊' },
            { key: 'analytics', label: 'Analytics', icon: '📈' },
            { key: 'cashflow', label: 'Cashflow', icon: '💰' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              style={{
                padding: `${spacing.md} ${spacing.lg}`,
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom: selectedTab === tab.key ? `2px solid ${colors.primary}` : '2px solid transparent',
                color: selectedTab === tab.key ? colors.primary : colors.neutral[600],
                fontSize: '16px',
                fontWeight: selectedTab === tab.key ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Tab */}
      {selectedTab === 'summary' && stats && (
        <>
          {/* Key Statistics */}
          <StatsGrid gap="lg" style={{ marginBottom: spacing.xl }}>
            <div style={{ 
              padding: spacing.xl,
              backgroundColor: 'white',
              border: `2px solid ${colors.primary}`,
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{ 
                ...typography.label,
                color: colors.neutral[600], 
                marginBottom: spacing.xs,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}>
                💰 Total Expenses
              </div>
              <div style={{ 
                ...typography.header, 
                color: colors.primary, 
                margin: 0,
                fontSize: '2rem'
              }}>
                {stats.total_expenses}
              </div>
              <div style={{ 
                ...typography.caption, 
                color: colors.neutral[500], 
                margin: 0,
                marginTop: spacing.xs
              }}>
                {formatCurrency(stats.total_amount)}
              </div>
            </div>

            <div style={{ 
              padding: spacing.xl,
              backgroundColor: 'white',
              border: `2px solid ${colors.status.normal}`,
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{ 
                ...typography.label,
                color: colors.neutral[600], 
                marginBottom: spacing.xs,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}>
                ✅ Approved
              </div>
              <div style={{ 
                ...typography.header, 
                color: colors.status.normal, 
                margin: 0,
                fontSize: '2rem'
              }}>
                {stats.approved}
              </div>
              <div style={{ 
                ...typography.caption, 
                color: colors.neutral[500], 
                margin: 0,
                marginTop: spacing.xs
              }}>
                {formatCurrency(stats.approved_amount)}
              </div>
            </div>

            <div style={{ 
              padding: spacing.xl,
              backgroundColor: 'white',
              border: `2px solid ${colors.status.warning}`,
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{ 
                ...typography.label,
                color: colors.neutral[600], 
                marginBottom: spacing.xs,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}>
                ⏳ Pending
              </div>
              <div style={{ 
                ...typography.header, 
                color: colors.status.warning, 
                margin: 0,
                fontSize: '2rem'
              }}>
                {stats.pending}
              </div>
              <div style={{ 
                ...typography.caption, 
                color: colors.neutral[500], 
                margin: 0,
                marginTop: spacing.xs
              }}>
                {formatCurrency(stats.pending_amount)}
              </div>
            </div>

            <div style={{ 
              padding: spacing.xl,
              backgroundColor: 'white',
              border: `2px solid ${colors.status.critical}`,
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{ 
                ...typography.label,
                color: colors.neutral[600], 
                marginBottom: spacing.xs,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}>
                ❌ Rejected
              </div>
              <div style={{ 
                ...typography.header, 
                color: colors.status.critical, 
                margin: 0,
                fontSize: '2rem'
              }}>
                {stats.rejected}
              </div>
              <div style={{ 
                ...typography.caption, 
                color: colors.neutral[500], 
                margin: 0,
                marginTop: spacing.xs
              }}>
                {formatCurrency(stats.average_amount)} avg
              </div>
            </div>
          </StatsGrid>

          {/* Category Breakdown */}
          <div style={{ 
            marginBottom: spacing.xl,
            padding: spacing.xl,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              ...typography.header, 
              margin: 0, 
              marginBottom: spacing.lg,
              color: colors.neutral[900]
            }}>
              📊 Category Breakdown
            </h3>
            <CardGrid gap="md">
              {categoryBreakdown.map((category) => (
                <div
                  key={category.category}
                  onClick={() => {
                    // Navigate to history with filter applied
                    navigate('/app/expenses/history', {
                      state: {
                        filters: {
                          category: category.category,
                          dateRange: dateRange
                        }
                      }
                    });
                  }}
                  style={{
                    padding: spacing.lg,
                    backgroundColor: colors.neutral[50],
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.primary + '10';
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.neutral[50];
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: spacing.sm
                  }}>
                    <div style={{ 
                      ...typography.body, 
                      fontWeight: 600, 
                      color: colors.neutral[900],
                      textTransform: 'capitalize'
                    }}>
                      {category.category}
                    </div>
                    <div style={{ 
                      ...typography.body, 
                      color: colors.neutral[600] 
                    }}>
                      {category.count} expenses
                    </div>
                  </div>
                  <div style={{ 
                    ...typography.header, 
                    color: colors.primary, 
                    margin: 0,
                    fontSize: '1.5rem'
                  }}>
                    {formatCurrency(category.total_amount)}
                  </div>
                  <div style={{ 
                    ...typography.caption, 
                    color: colors.neutral[500], 
                    margin: 0,
                    marginTop: spacing.xs
                  }}>
                    Avg: {formatCurrency(category.average_amount)}
                  </div>
                </div>
              ))}
            </CardGrid>
          </div>

          {/* Payment Method Breakdown */}
          <div style={{ 
            marginBottom: spacing.xl,
            padding: spacing.xl,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              ...typography.header, 
              margin: 0, 
              marginBottom: spacing.lg,
              color: colors.neutral[900]
            }}>
              💳 Payment Method Breakdown
            </h3>
            <CardGrid gap="md">
              {paymentMethodBreakdown.map((method) => (
                <div
                  key={method.payment_method}
                  style={{
                    padding: spacing.lg,
                    backgroundColor: colors.neutral[50],
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: spacing.sm
                  }}>
                    <div style={{ 
                      ...typography.body, 
                      fontWeight: 600, 
                      color: colors.neutral[900],
                      textTransform: 'capitalize'
                    }}>
                      {method.payment_method}
                    </div>
                    <div style={{ 
                      ...typography.body, 
                      color: colors.neutral[600] 
                    }}>
                      {method.count} transactions
                    </div>
                  </div>
                  <div style={{ 
                    ...typography.header, 
                    color: colors.primary, 
                    margin: 0,
                    fontSize: '1.5rem'
                  }}>
                    {formatCurrency(method.total_amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <>
          {/* Top Spenders */}
          <div style={{ 
            marginBottom: spacing.xl,
            padding: spacing.xl,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              ...typography.header, 
              margin: 0, 
              marginBottom: spacing.lg,
              color: colors.neutral[900]
            }}>
              👥 Top Spenders
            </h3>
            <CardGrid gap="md">
              {topSpenders.map((spender, index) => (
                <div
                  key={spender.employee_id}
                  style={{
                    padding: spacing.lg,
                    backgroundColor: colors.neutral[50],
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: spacing.sm
                  }}>
                    <div style={{ 
                      ...typography.body, 
                      fontWeight: 600, 
                      color: colors.neutral[900]
                    }}>
                      #{index + 1} {spender.employee_name}
                    </div>
                    <div style={{ 
                      ...typography.caption, 
                      color: colors.neutral[600] 
                    }}>
                      {spender.employee_id}
                    </div>
                  </div>
                  <div style={{ 
                    ...typography.header, 
                    color: colors.primary, 
                    margin: 0,
                    fontSize: '1.5rem'
                  }}>
                    {formatCurrency(spender.total_amount)}
                  </div>
                  <div style={{ 
                    ...typography.caption, 
                    color: colors.neutral[500], 
                    margin: 0,
                    marginTop: spacing.xs
                  }}>
                    {spender.expense_count} expenses • Avg: {formatCurrency(spender.average_amount)}
                  </div>
                </div>
              ))}
            </CardGrid>
          </div>

          {/* Project Expenses */}
          <div style={{ 
            marginBottom: spacing.xl,
            padding: spacing.xl,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              ...typography.header, 
              margin: 0, 
              marginBottom: spacing.lg,
              color: colors.neutral[900]
            }}>
              🏗️ Project Expenses
            </h3>
            <CardGrid gap="md">
              {projectExpenses.map((project) => (
                <div
                  key={project.project_code}
                  style={{
                    padding: spacing.lg,
                    backgroundColor: colors.neutral[50],
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: spacing.sm
                  }}>
                    <div style={{ 
                      ...typography.body, 
                      fontWeight: 600, 
                      color: colors.neutral[900]
                    }}>
                      {project.project_name}
                    </div>
                    <div style={{ 
                      ...typography.caption, 
                      color: colors.neutral[600] 
                    }}>
                      {project.project_code}
                    </div>
                  </div>
                  <div style={{ 
                    ...typography.header, 
                    color: colors.primary, 
                    margin: 0,
                    fontSize: '1.5rem'
                  }}>
                    {formatCurrency(project.total_amount)}
                  </div>
                  <div style={{ 
                    ...typography.caption, 
                    color: colors.neutral[500], 
                    margin: 0,
                    marginTop: spacing.xs
                  }}>
                    {project.expense_count} expenses • Avg: {formatCurrency(project.average_amount)}
                  </div>
                </div>
              ))}
            </CardGrid>
          </div>

          {/* Asset Expenses */}
          <div style={{ 
            marginBottom: spacing.xl,
            padding: spacing.xl,
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              ...typography.header, 
              margin: 0, 
              marginBottom: spacing.lg,
              color: colors.neutral[900]
            }}>
              🏭 Asset Expenses
            </h3>
            <CardGrid gap="md">
              {assetExpenses.map((asset) => (
                <div
                  key={asset.asset_name}
                  style={{
                    padding: spacing.lg,
                    backgroundColor: colors.neutral[50],
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: spacing.sm
                  }}>
                    <div style={{ 
                      ...typography.body, 
                      fontWeight: 600, 
                      color: colors.neutral[900]
                    }}>
                      {asset.asset_name}
                    </div>
                    <div style={{ 
                      ...typography.caption, 
                      color: colors.neutral[600],
                      textTransform: 'capitalize'
                    }}>
                      {asset.asset_type}
                    </div>
                  </div>
                  <div style={{ 
                    ...typography.header, 
                    color: colors.primary, 
                    margin: 0,
                    fontSize: '1.5rem'
                  }}>
                    {formatCurrency(asset.total_amount)}
                  </div>
                  <div style={{ 
                    ...typography.caption, 
                    color: colors.neutral[500], 
                    margin: 0,
                    marginTop: spacing.xs
                  }}>
                    {asset.expense_count} expenses • Avg: {formatCurrency(asset.average_amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Cashflow Tab */}
      {selectedTab === 'cashflow' && (
        <div style={{ 
          padding: spacing.xl,
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ 
            ...typography.header, 
            margin: 0, 
            marginBottom: spacing.lg,
            color: colors.neutral[900]
          }}>
            💰 Cashflow Analysis
          </h3>
          <div style={{ 
            textAlign: 'center', 
            padding: spacing.xxl,
            color: colors.neutral[600]
          }}>
            <div style={{ fontSize: '3rem', marginBottom: spacing.lg }}>🚧</div>
            <div style={{ ...typography.header, margin: 0 }}>
              Cashflow Analysis Coming Soon
            </div>
            <div style={{ ...typography.body, margin: 0, marginTop: spacing.sm }}>
              Advanced cashflow analysis and project budget tracking will be available soon.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


