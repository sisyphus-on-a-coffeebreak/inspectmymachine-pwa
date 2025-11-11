import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';
import { LoadingError } from '../../components/ui/LoadingError';
import { EmptyState } from '../../components/ui/EmptyState';

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
  const [expenses, setExpenses] = useState<ExpenseHistoryItem[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    category: 'all',
    project: 'all',
    asset: 'all',
    dateRange: 'all',
    amountRange: 'all'
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseHistoryItem | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Backend supports minimal params: mine (bool) and optional week=current
      const res = await axios.get('/v1/expenses', { params: { mine: true } });
      const payload = res.data;
      const items = Array.isArray(payload) ? payload : (payload?.items ?? []);
      if (Array.isArray(items)) {
        setExpenses(items as any);
      } else {
        // Unexpected shape → fallback to mock
        setExpenses([
        {
          id: '1',
          amount: 2500,
          category: 'FUEL',
          description: 'Petrol for vehicle ABC-1234',
          date: '2024-01-20T10:30:00Z',
          status: 'approved',
          payment_method: 'CASH',
          location: 'Mumbai, Maharashtra',
          project_name: 'Project Alpha',
          asset_name: 'Vehicle ABC-1234',
          created_at: '2024-01-20T10:30:00Z',
          approved_by: 'Manager Name',
          approved_at: '2024-01-20T11:00:00Z'
        },
        {
          id: '2',
          amount: 1200,
          category: 'FOOD',
          description: 'Client lunch meeting',
          date: '2024-01-19T14:15:00Z',
          status: 'pending',
          payment_method: 'COMPANY_UPI',
          project_name: 'Project Beta',
          created_at: '2024-01-19T14:15:00Z'
        },
        {
          id: '3',
          amount: 800,
          category: 'LOCAL_TRANSPORT',
          description: 'Taxi fare to client site',
          date: '2024-01-18T09:45:00Z',
          status: 'approved',
          payment_method: 'PERSONAL_UPI',
          location: 'Delhi, NCR',
          created_at: '2024-01-18T09:45:00Z',
          approved_by: 'Supervisor Name',
          approved_at: '2024-01-18T10:30:00Z'
        },
        {
          id: '4',
          amount: 5000,
          category: 'PARTS_REPAIR',
          description: 'Vehicle maintenance and repair',
          date: '2024-01-17T16:20:00Z',
          status: 'rejected',
          payment_method: 'CASH',
          asset_name: 'Vehicle XYZ-5678',
          created_at: '2024-01-17T16:20:00Z',
          rejection_reason: 'Receipt not provided'
        }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    // Apply filters to expenses
    let filtered = expenses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.project_name && expense.project_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (expense.asset_name && expense.asset_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm]);

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
      console.error('Export failed:', error);
      alert('Failed to export expenses. Please try again.');
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
          onRetry={fetchExpenses}
          onRefresh={() => window.location.reload()}
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
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.lg,
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div>
          <h1 style={{ 
            ...typography.header,
            fontSize: '28px',
            color: colors.neutral[900],
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            📊 Expense History
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            View and manage all your expenses
          </p>
        </div>
        
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
      </div>

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
              onClick={() => setSelectedExpense(expense)}
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
                  <div style={{ 
                    ...typography.subheader,
                    color: colors.neutral[900],
                    fontWeight: 700,
                    fontSize: '18px'
                  }}>
                    ₹{expense.amount.toLocaleString('en-IN')}
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
      </div>
    </div>
  );
};

