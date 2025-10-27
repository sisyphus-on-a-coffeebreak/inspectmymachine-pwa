import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { StatsGrid } from '../../components/ui/ResponsiveGrid';

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

      // Fetch summary data
      const summaryResponse = await axios.get('/api/expense-reports/summary', {
        params: { date_range: dateRange }
      });

      // Fetch analytics data
      const analyticsResponse = await axios.get('/api/expense-reports/analytics', {
        params: { date_range: dateRange }
      });

      setStats(summaryResponse.data.summary);
      setCategoryBreakdown(summaryResponse.data.category_breakdown);
      setPaymentMethodBreakdown(summaryResponse.data.payment_method_breakdown);
      setDailyTrends(summaryResponse.data.daily_trends);
      setTopSpenders(analyticsResponse.data.top_spenders);
      setProjectExpenses(analyticsResponse.data.project_expenses);
      setAssetExpenses(analyticsResponse.data.asset_expenses);

    } catch (error) {
      console.error('Failed to fetch report data:', error);
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
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const exportToCSV = async () => {
    try {
      const response = await axios.get('/api/expense-reports/export', {
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
      console.error('Failed to export data:', error);
      alert('Failed to export data. Please try again.');
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
            <div style={{ 
              display: 'grid', 
              gap: spacing.md,
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
              {categoryBreakdown.map((category) => (
                <div
                  key={category.category}
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
            </div>
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
            <div style={{ 
              display: 'grid', 
              gap: spacing.md,
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
            }}>
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
            <div style={{ 
              display: 'grid', 
              gap: spacing.md,
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
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
            </div>
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
            <div style={{ 
              display: 'grid', 
              gap: spacing.md,
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
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
            </div>
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
            <div style={{ 
              display: 'grid', 
              gap: spacing.md,
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
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


