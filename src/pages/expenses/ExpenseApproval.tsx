import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';

// ✅ Expense Approval Workflow
// Admin approval system for employee expenses
// Handles approval requests, reviews, and notifications

interface ExpenseApproval {
  id: string;
  amount: number;
  category: string;
  payment_method: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  receipt_key: string;
  created_at: string;
  updated_at: string;
  employee_name: string;
  employee_id: string;
  project_name?: string;
  asset_name?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

interface ApprovalStats {
  total_expenses: number;
  pending: number;
  approved: number;
  rejected: number;
  approved_amount: number;
  pending_amount: number;
  average_amount: number;
}

export const ExpenseApproval: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<ExpenseApproval[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/expense-approval/pending', {
        params: { status: filter }
      });
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      // Mock data for development
      setExpenses([
        {
          id: '1',
          amount: 2500,
          category: 'fuel',
          payment_method: 'cash',
          status: 'pending',
          notes: 'Fuel for site visit',
          receipt_key: 'receipt-123',
          created_at: '2024-01-20T10:00:00Z',
          updated_at: '2024-01-20T10:00:00Z',
          employee_name: 'John Smith',
          employee_id: 'EMP001',
          project_name: 'Project Alpha'
        },
        {
          id: '2',
          amount: 1500,
          category: 'meals',
          payment_method: 'card',
          status: 'pending',
          notes: 'Client lunch meeting',
          receipt_key: 'receipt-124',
          created_at: '2024-01-20T11:00:00Z',
          updated_at: '2024-01-20T11:00:00Z',
          employee_name: 'Jane Doe',
          employee_id: 'EMP002',
          project_name: 'Project Beta'
        }
      ]);
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/expense-approval/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Mock data for development
      setStats({
        total_expenses: 45,
        pending: 12,
        approved: 28,
        rejected: 5,
        approved_amount: 125000,
        pending_amount: 35000,
        average_amount: 3500
      });
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [fetchExpenses, fetchStats]);

  const handleExpenseClick = (expense: ExpenseApproval) => {
    // Navigate to expense details or show modal
    console.log('Expense clicked:', expense);
  };

  const approveExpense = async (expenseId: string) => {
    try {
      setLoading(true);
      await axios.post(`/api/expense-approval/approve/${expenseId}`);
      alert('Expense approved successfully!');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      console.error('Failed to approve expense:', error);
      alert('Failed to approve expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const rejectExpense = async (expenseId: string, reason: string) => {
    try {
      setLoading(true);
      await axios.post(`/api/expense-approval/reject/${expenseId}`, {
        reason: reason
      });
      alert('Expense rejected successfully!');
      setShowRejectionModal(false);
      setRejectionReason('');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      console.error('Failed to reject expense:', error);
      alert('Failed to reject expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const bulkApprove = async () => {
    if (selectedExpenses.length === 0) {
      alert('Please select expenses to approve');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/expense-approval/bulk-approve', {
        expense_ids: selectedExpenses
      });
      alert(`${selectedExpenses.length} expenses approved successfully!`);
      setSelectedExpenses([]);
      fetchExpenses();
      fetchStats();
    } catch (error) {
      console.error('Failed to bulk approve:', error);
      alert('Failed to bulk approve expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const bulkReject = async () => {
    if (selectedExpenses.length === 0) {
      alert('Please select expenses to reject');
      return;
    }

    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/api/expense-approval/bulk-reject', {
        expense_ids: selectedExpenses,
        reason: rejectionReason
      });
      alert(`${selectedExpenses.length} expenses rejected successfully!`);
      setSelectedExpenses([]);
      setRejectionReason('');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      console.error('Failed to bulk reject:', error);
      alert('Failed to bulk reject expenses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSelect = (expenseId: string) => {
    setSelectedExpenses(prev => 
      prev.includes(expenseId) 
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const selectAllExpenses = () => {
    const pendingExpenses = expenses.filter(e => e.status === 'pending');
    setSelectedExpenses(pendingExpenses.map(e => e.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.status.warning;
      case 'approved': return colors.status.normal;
      case 'rejected': return colors.status.critical;
      default: return colors.neutral[400];
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading && expenses.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💰</div>
        <div style={{ color: '#6B7280' }}>Loading expense approvals...</div>
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
              💰 Expense Approval
            </h1>
            <p style={{ 
              ...typography.body, 
              color: colors.neutral[600], 
              margin: 0,
              marginTop: spacing.sm
            }}>
              Review and approve employee expense claims
            </p>
          </div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/app/expenses')}
            >
              ← Back to Expenses
            </Button>
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: spacing.lg 
          }}>
            <div style={{ 
              padding: spacing.lg,
              backgroundColor: colors.status.warning + '10',
              borderRadius: '12px',
              border: `1px solid ${colors.status.warning}`
            }}>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Pending</div>
              <div style={{ ...typography.header, color: colors.status.warning, margin: 0 }}>
                {stats.pending}
              </div>
              <div style={{ ...typography.caption, color: colors.neutral[500] }}>
                {formatCurrency(stats.pending_amount)}
              </div>
            </div>
            <div style={{ 
              padding: spacing.lg,
              backgroundColor: colors.status.normal + '10',
              borderRadius: '12px',
              border: `1px solid ${colors.status.normal}`
            }}>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Approved</div>
              <div style={{ ...typography.header, color: colors.status.normal, margin: 0 }}>
                {stats.approved}
              </div>
              <div style={{ ...typography.caption, color: colors.neutral[500] }}>
                {formatCurrency(stats.approved_amount)}
              </div>
            </div>
            <div style={{ 
              padding: spacing.lg,
              backgroundColor: colors.status.critical + '10',
              borderRadius: '12px',
              border: `1px solid ${colors.status.critical}`
            }}>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Rejected</div>
              <div style={{ ...typography.header, color: colors.status.critical, margin: 0 }}>
                {stats.rejected}
              </div>
            </div>
            <div style={{ 
              padding: spacing.lg,
              backgroundColor: colors.primary + '10',
              borderRadius: '12px',
              border: `1px solid ${colors.primary}`
            }}>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Average</div>
              <div style={{ ...typography.header, color: colors.primary, margin: 0 }}>
                {formatCurrency(stats.average_amount)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Actions */}
      <div style={{ 
        marginBottom: spacing.lg,
        padding: spacing.lg,
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: spacing.md
        }}>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'primary' : 'secondary'}
                onClick={() => setFilter(status as any)}
              >
                {status}
              </Button>
            ))}
          </div>
          
          {filter === 'pending' && (
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <Button
                variant="secondary"
                onClick={selectAllExpenses}
              >
                Select All
              </Button>
              <Button
                variant="primary"
                onClick={bulkApprove}
                disabled={selectedExpenses.length === 0}
              >
                Approve Selected ({selectedExpenses.length})
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowRejectionModal(true)}
                disabled={selectedExpenses.length === 0}
              >
                Reject Selected ({selectedExpenses.length})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Expense List */}
      <div style={{ 
        display: 'grid', 
        gap: spacing.lg,
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
      }}>
        {expenses.map((expense) => (
          <div
            key={expense.id}
            style={{
              padding: spacing.xl,
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderLeft: `4px solid ${getStatusColor(expense.status)}`
            }}
            onClick={() => handleExpenseClick(expense)}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: spacing.md
            }}>
              <div>
                <div style={{ 
                  ...typography.header, 
                  color: colors.neutral[900], 
                  margin: 0,
                  fontSize: '1.25rem'
                }}>
                  {formatCurrency(expense.amount)}
                </div>
                <div style={{ 
                  ...typography.body, 
                  color: colors.neutral[600], 
                  margin: 0,
                  marginTop: spacing.xs
                }}>
                  {expense.category} • {expense.payment_method}
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: spacing.sm 
              }}>
                {filter === 'pending' && (
                  <input
                    type="checkbox"
                    checked={selectedExpenses.includes(expense.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleExpenseSelect(expense.id);
                    }}
                    style={{ 
                      width: '18px', 
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                )}
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: getStatusColor(expense.status),
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                  {expense.status}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <div style={{ 
                ...typography.body, 
                color: colors.neutral[700], 
                margin: 0,
                marginBottom: spacing.xs
              }}>
                <strong>Employee:</strong> {expense.employee_name} ({expense.employee_id})
              </div>
              {expense.project_name && (
                <div style={{ 
                  ...typography.body, 
                  color: colors.neutral[700], 
                  margin: 0,
                  marginBottom: spacing.xs
                }}>
                  <strong>Project:</strong> {expense.project_name}
                </div>
              )}
              {expense.asset_name && (
                <div style={{ 
                  ...typography.body, 
                  color: colors.neutral[700], 
                  margin: 0,
                  marginBottom: spacing.xs
                }}>
                  <strong>Asset:</strong> {expense.asset_name}
                </div>
              )}
              {expense.notes && (
                <div style={{ 
                  ...typography.body, 
                  color: colors.neutral[600], 
                  margin: 0,
                  fontStyle: 'italic'
                }}>
                  "{expense.notes}"
                </div>
              )}
            </div>

            <div style={{ 
              ...typography.caption, 
              color: colors.neutral[500], 
              margin: 0,
              marginBottom: spacing.md
            }}>
              Submitted: {new Date(expense.created_at).toLocaleString()}
            </div>

            {expense.status === 'pending' && (
              <div style={{ 
                display: 'flex', 
                gap: spacing.sm,
                marginTop: spacing.md
              }}>
                <Button
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    approveExpense(expense.id);
                  }}
                  disabled={loading}
                >
                  ✅ Approve
                </Button>
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRejectionModal(true);
                    setSelectedExpenses([expense.id]);
                  }}
                  disabled={loading}
                >
                  ❌ Reject
                </Button>
              </div>
            )}

            {expense.status === 'approved' && expense.approved_by && (
              <div style={{ 
                ...typography.caption, 
                color: colors.status.normal,
                margin: 0,
                marginTop: spacing.sm
              }}>
                ✅ Approved by {expense.approved_by} on {new Date(expense.approved_at!).toLocaleString()}
              </div>
            )}

            {expense.status === 'rejected' && expense.rejected_by && (
              <div style={{ 
                ...typography.caption, 
                color: colors.status.critical,
                margin: 0,
                marginTop: spacing.sm
              }}>
                ❌ Rejected by {expense.rejected_by} on {new Date(expense.rejected_at!).toLocaleString()}
                {expense.rejection_reason && (
                  <div style={{ marginTop: spacing.xs }}>
                    <strong>Reason:</strong> {expense.rejection_reason}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {expenses.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: spacing.xxl,
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: spacing.lg }}>📋</div>
          <div style={{ ...typography.header, color: colors.neutral[600], margin: 0 }}>
            No expenses found
          </div>
          <div style={{ ...typography.body, color: colors.neutral[500], margin: 0, marginTop: spacing.sm }}>
            {filter === 'pending' 
              ? 'No pending expenses to review'
              : `No ${filter} expenses found`
            }
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: spacing.xl,
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ 
              ...typography.header, 
              margin: 0, 
              marginBottom: spacing.lg,
              color: colors.neutral[900]
            }}>
              Reject Expenses
            </h3>
            <p style={{ 
              ...typography.body, 
              color: colors.neutral[600], 
              margin: 0,
              marginBottom: spacing.lg
            }}>
              Please provide a reason for rejecting {selectedExpenses.length} expense(s):
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: spacing.lg
              }}
            />
            <div style={{ 
              display: 'flex', 
              gap: spacing.sm, 
              justifyContent: 'flex-end' 
            }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => bulkReject()}
                disabled={!rejectionReason.trim() || loading}
              >
                Reject Expenses
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


