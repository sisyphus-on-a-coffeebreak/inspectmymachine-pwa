import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../providers/ToastProvider';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';
import { LoadingError } from '../../components/ui/LoadingError';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { PageHeader } from '../../components/ui/PageHeader';
import { useExpenses, useFloatBalance } from '../../lib/queries';
import { PullToRefreshWrapper } from '../../components/ui/PullToRefreshWrapper';

// 📊 Expense History
// Complete expense history with advanced filtering and search
// Shows all expenses with status, project, asset information

interface ExpenseHistoryItem {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  payment_method: string;
  location?: string;
  project_name?: string;
  asset_name?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}

interface FilterOptions {
  status: 'all' | 'pending' | 'approved' | 'rejected';
  category: 'all' | string;
  project: 'all' | string;
  asset: 'all' | string;
  dateRange: 'all' | 'week' | 'month' | 'quarter' | 'year';
  amountRange: 'all' | 'low' | 'medium' | 'high';
}

export const ExpenseHistory: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize filters from navigation state if available
  const initialFilters = location.state?.filters || {};
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    category: initialFilters.category || 'all',
    project: 'all',
    asset: 'all',
    dateRange: initialFilters.dateRange || 'all',
    amountRange: 'all'
  });
  
  // Clear navigation state after applying filters
  useEffect(() => {
    if (location.state?.filters) {
      // Clear the state so it doesn't persist on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseHistoryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  
  // Use React Query for expenses and float balance
  const { data: expensesData, isLoading: loading, error: queryError, refetch } = useExpenses(
    { mine: true, page: currentPage, per_page: perPage }
  );
  const { data: floatData } = useFloatBalance();
  
  const expenses = (expensesData?.data || []) as ExpenseHistoryItem[];
  const totalItems = expensesData?.total || 0;
  const error = queryError ? (queryError instanceof Error ? queryError : new Error('Failed to fetch expenses')) : null;
  
  // Calculate running balance
  const currentBalance = Number(floatData?.balance ?? 0);
  
  // Calculate running balance for each expense (reverse chronological order)
  const expensesWithRunningBalance = useMemo(() => {
    // Sort expenses by date descending (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Calculate running balance starting from current balance
    let runningBalance = currentBalance;
    const expensesWithBalance = sortedExpenses.map(expense => {
      // Expenses are DR (debit), so they reduce balance
      runningBalance += expense.amount; // Add back to get previous balance
      return {
        ...expense,
        runningBalance: runningBalance - expense.amount, // Balance before this expense
        balanceAfter: runningBalance, // Balance after this expense
      };
    });
    
    // Reverse back to original order (oldest first) for display
    return expensesWithBalance.reverse();
  }, [expenses, currentBalance]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchTerm]);

  // Apply filters, search, and sorting with useMemo
  const filteredExpenses = useMemo(() => {
    let filtered = expensesWithRunningBalance;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.project_name && expense.project_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (expense.asset_name && expense.asset_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter (case-insensitive)
    if (filters.status !== 'all') {
      filtered = filtered.filter(expense => 
        expense.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(expense => expense.category === filters.category);
    }

    // Project filter
    if (filters.project !== 'all') {
      filtered = filtered.filter(expense => expense.project_name === filters.project);
    }

    // Asset filter
    if (filters.asset !== 'all') {
      filtered = filtered.filter(expense => expense.asset_name === filters.asset);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const start = new Date(now);
      switch (filters.dateRange) {
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          start.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          start.setFullYear(now.getFullYear() - 1);
          break;
      }
      filtered = filtered.filter(expense => new Date(expense.date) >= start);
    }

    // Amount range filter
    if (filters.amountRange !== 'all') {
      switch (filters.amountRange) {
        case 'low':
          filtered = filtered.filter(expense => expense.amount < 1000);
          break;
        case 'medium':
          filtered = filtered.filter(expense => expense.amount >= 1000 && expense.amount < 5000);
          break;
        case 'high':
          filtered = filtered.filter(expense => expense.amount >= 5000);
          break;
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [expenses, searchTerm, filters, sortBy, sortOrder]);

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

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Cash';
      case 'COMPANY_UPI': return 'Company UPI';
      case 'PERSONAL_UPI': return 'Personal UPI';
      case 'CARD': return 'Card';
      default: return method;
    }
  };

  const exportExpenses = async () => {
    try {
      const rows = [
        ['ID','Amount','Category','Description','Date','Status','Payment Method','Project','Asset','Location','Approved By','Approved At','Notes'],
        ...filteredExpenses.map(e => [
          e.id,
          e.amount,
          e.category,
          e.description,
          new Date(e.date).toISOString(),
          e.status,
          e.payment_method,
          e.project_name || '',
          e.asset_name || '',
          e.location || '',
          e.approved_by || '',
          e.approved_at || '',
          (e.notes || '').replace(/\n/g, ' '),
        ])
      ];

      const csv = rows.map(r => r.map(v => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
      }).join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to export expenses. Please try again.',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>📊</div>
        <div style={{ color: colors.neutral[600] }}>Loading expense history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.sm }}>
        <LoadingError
          resource="Expense History"
          error={error}
          onRetry={() => refetch()}
          onRefresh={() => window.location.reload()}
        />
      </div>
    );
  }

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <div style={{ 
        maxWidth: '1400px', 
      margin: '0 auto', 
      padding: spacing.xl,
      fontFamily: typography.body.fontFamily,
      backgroundColor: colors.neutral[50],
      minHeight: '100vh'
    }}>
      {/* Header */}
      <PageHeader
        title="Expense History"
        subtitle="View and manage all your expenses"
        icon="📊"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Expenses', path: '/app/expenses' },
          { label: 'History' }
        ]}
        actions={
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              onClick={exportExpenses}
              icon="📤"
            >
              Export
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/app/expenses/create')}
              icon="➕"
            >
              Add Expense
            </Button>
          </div>
        }
      />

      {/* Active Filters Banner (from Reports drilldown) */}
      {initialFilters && Object.keys(initialFilters).length > 0 && (
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.primary + '15',
          border: `2px solid ${colors.primary}`,
          borderRadius: '12px',
          marginBottom: spacing.lg,
        }}>
          <div style={{ 
            ...typography.body, 
            color: colors.neutral[700],
            marginBottom: spacing.sm
          }}>
            <div style={{ fontWeight: 600, marginBottom: spacing.xs }}>
              🔍 Filtered view from Reports
            </div>
            <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
              {initialFilters.category && (
                <span style={{
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  backgroundColor: colors.primary,
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  Category: {initialFilters.category.replace(/_/g, ' ')}
                </span>
              )}
              {initialFilters.dateRange && (
                <span style={{
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  backgroundColor: colors.primary,
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  Date Range: {initialFilters.dateRange}
                </span>
              )}
              <button
                onClick={() => {
                  setFilters({
                    status: 'all',
                    category: 'all',
                    project: 'all',
                    asset: 'all',
                    dateRange: 'all',
                    amountRange: 'all'
                  });
                }}
                style={{
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.primary}`,
                  color: colors.primary,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.lg,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'grid', gap: spacing.lg }}>
          {/* Search */}
          <div>
            <Label>Search Expenses</Label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by description, category, project, or asset..."
              style={{ marginTop: spacing.xs }}
            />
          </div>

          {/* Filter Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: spacing.lg }}>
            <div>
              <Label>Status</Label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: spacing.xs
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <Label>Category</Label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: spacing.xs
                }}
              >
                <option value="all">All Categories</option>
                <option value="FUEL">Fuel</option>
                <option value="FOOD">Food</option>
                <option value="LOCAL_TRANSPORT">Local Transport</option>
                <option value="PARTS_REPAIR">Parts & Repair</option>
                <option value="MISC">Miscellaneous</option>
              </select>
            </div>

            <div>
              <Label>Date Range</Label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: spacing.xs
                }}
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>

            <div>
              <Label>Sort By</Label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: spacing.xs
                }}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: spacing.lg
        }}>
          <h3 style={{ 
            ...typography.subheader,
            margin: 0,
            color: colors.neutral[900]
          }}>
            📋 All Expenses ({filteredExpenses.length})
          </h3>
          
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              icon={sortOrder === 'asc' ? '⬆️' : '⬇️'}
            >
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              onClick={() => navigate(`/app/expenses/${expense.id}`, { 
                state: { from: '/app/expenses/history' } 
              })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/app/expenses/${expense.id}`, { 
                    state: { from: '/app/expenses/history' } 
                  });
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View expense details: ${expense.description}`}
              style={{
                padding: spacing.lg,
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                backgroundColor: selectedExpense?.id === expense.id ? colors.primary + '10' : '#F9FAFB',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: spacing.sm
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    ...typography.subheader,
                    marginBottom: spacing.xs,
                    color: colors.neutral[900]
                  }}>
                    {expense.description}
                  </h4>
                  
                  <div style={{ 
                    display: 'flex', 
                    gap: spacing.md,
                    marginBottom: spacing.sm,
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600]
                    }}>
                      {getCategoryLabel(expense.category)}
                    </span>
                    <span style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600]
                    }}>
                      {getPaymentMethodLabel(expense.payment_method)}
                    </span>
                    <span style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600]
                    }}>
                      {new Date(expense.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  {(expense.project_name || expense.asset_name || expense.location) && (
                    <div style={{ 
                      display: 'flex', 
                      gap: spacing.md,
                      marginBottom: spacing.sm,
                      flexWrap: 'wrap'
                    }}>
                      {expense.project_name && (
                        <span style={{ 
                          ...typography.bodySmall,
                          color: colors.primary,
                          backgroundColor: colors.primary + '20',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          📋 {expense.project_name}
                        </span>
                      )}
                      {expense.asset_name && (
                        <span style={{ 
                          ...typography.bodySmall,
                          color: colors.status.success,
                          backgroundColor: colors.status.success + '20',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          🏗️ {expense.asset_name}
                        </span>
                      )}
                      {expense.location && (
                        <span style={{ 
                          ...typography.bodySmall,
                          color: colors.status.warning,
                          backgroundColor: colors.status.warning + '20',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          📍 {expense.location}
                        </span>
                      )}
                    </div>
                  )}

                  {expense.notes && (
                    <div style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600],
                      fontStyle: 'italic',
                      marginTop: spacing.sm
                    }}>
                      Note: {expense.notes}
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: spacing.sm
                }}>
                  {/* Amount with CR/DR indicator */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing.xs }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs
                    }}>
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: colors.status.error + '20',
                        color: colors.status.error,
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}>
                        DR
                      </span>
                      <div style={{ 
                        ...typography.subheader,
                        color: colors.status.error,
                        fontWeight: 700,
                        fontSize: '18px'
                      }}>
                        -₹{expense.amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    
                    {/* Running Balance */}
                    {(expense as any).runningBalance !== undefined && (
                      <div style={{
                        ...typography.bodySmall,
                        color: colors.neutral[500],
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.xs
                      }}>
                        <span>Balance:</span>
                        <span style={{
                          color: (expense as any).balanceAfter >= 0 
                            ? colors.status.normal 
                            : colors.status.error,
                          fontWeight: 600
                        }}>
                          ₹{((expense as any).balanceAfter || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: getStatusColor(expense.status),
                    color: 'white',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'capitalize'
                  }}>
                    {getStatusText(expense.status)}
                  </span>

                  {expense.approved_by && (
                    <div style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[500],
                      fontSize: '11px',
                      textAlign: 'right'
                    }}>
                      Approved by: {expense.approved_by}
                    </div>
                  )}

                  {expense.rejection_reason && (
                    <div style={{ 
                      ...typography.bodySmall,
                      color: colors.status.error,
                      fontSize: '11px',
                      textAlign: 'right',
                      maxWidth: '150px'
                    }}>
                      Rejected: {expense.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredExpenses.length === 0 && (
          <EmptyState
            icon="📊"
            title="No Expenses Found"
            description="No expenses match your current search and filter criteria. Try adjusting your filters or add a new expense."
            action={{
              label: "Add New Expense",
              onClick: () => navigate('/app/expenses/create'),
              icon: "➕"
            }}
            secondaryAction={{
              label: "Clear Filters",
              onClick: () => {
                setSearchTerm('');
                setFilters({
                  status: 'all',
                  category: 'all',
                  project: 'all',
                  asset: 'all',
                  date_range: 'all',
                  amount_range: 'all'
                });
              },
              icon: "🔄"
            }}
          />
        )}

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / perPage)}
          totalItems={totalItems}
          perPage={perPage}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setCurrentPage(1);
          }}
        />
      )}
      </div>
    </div>
    </PullToRefreshWrapper>
  );
};

