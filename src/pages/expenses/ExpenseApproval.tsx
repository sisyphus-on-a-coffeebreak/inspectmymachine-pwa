import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../providers/ToastProvider';
import { useIsMobile } from '../../hooks/useIsMobile';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { ReceiptPreview } from '../../components/ui/ReceiptPreview';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { StatCard } from '../../components/ui/StatCard';
import { WideGrid, CardGrid } from '../../components/ui/ResponsiveGrid';
import { useExpenseApprovals, useExpenseApprovalStats, useApproveExpense, useRejectExpense } from '../../lib/queries';

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
  escalated_at?: string;
  escalated_to?: string;
  escalation_level?: number;
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
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Use React Query for expenses and stats
  const { data: expensesData, isLoading: loading } = useExpenseApprovals(
    { status: filter, page: currentPage, per_page: perPage },
    { enabled: filter !== 'all' } // Only fetch when filter is not 'all'
  );
  const expenses = expensesData?.data || [];
  const totalItems = expensesData?.total || 0;

  const { data: stats } = useExpenseApprovalStats();
  
  // Mutations for approve/reject
  const approveMutation = useApproveExpense();
  const rejectMutation = useRejectExpense();

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleExpenseClick = (expense: ExpenseApproval) => {
    navigate(`/app/expenses/${expense.id}`, { 
      state: { from: '/app/expenses/approval' } 
    });
  };

  const approveExpense = async (expenseId: string) => {
    try {
      await approveMutation.mutateAsync({ id: expenseId });
      showToast({
        title: 'Success',
        description: 'Expense approved successfully!',
        variant: 'success',
      });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to approve expense. Please try again.',
        variant: 'error',
      });
    }
  };

  const rejectExpense = async (expenseId: string, reason: string) => {
    try {
      await rejectMutation.mutateAsync({ id: expenseId, reason });
      showToast({
        title: 'Success',
        description: 'Expense rejected successfully!',
        variant: 'success',
      });
      setShowRejectionModal(false);
      setRejectionReason('');
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to reject expense. Please try again.',
        variant: 'error',
      });
    }
  };

  const bulkApprove = async () => {
    if (selectedExpenses.length === 0) {
      showToast({
        title: 'Validation Error',
        description: 'Please select expenses to approve',
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/expense-approval/bulk-approve', {
        expense_ids: selectedExpenses
      });
      showToast({
        title: 'Success',
        description: `${selectedExpenses.length} expenses approved successfully!`,
        variant: 'success',
        duration: 5000,
      });
      setSelectedExpenses([]);
      fetchExpenses();
      fetchStats();
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to bulk approve expenses. Please try again.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkReject = async () => {
    if (selectedExpenses.length === 0) {
      showToast({
        title: 'Validation Error',
        description: 'Please select expenses to reject',
        variant: 'error',
      });
      return;
    }

    if (!rejectionReason.trim()) {
      showToast({
        title: 'Validation Error',
        description: 'Please provide a rejection reason',
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/expense-approval/bulk-reject', {
        expense_ids: selectedExpenses,
        reason: rejectionReason
      });
      showToast({
        title: 'Success',
        description: `${selectedExpenses.length} expenses rejected successfully!`,
        variant: 'success',
        duration: 5000,
      });
      setSelectedExpenses([]);
      setRejectionReason('');
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to bulk reject expenses. Please try again.',
        variant: 'error',
      });
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
      case 'pending': return colors.warning[500];
      case 'approved': return colors.success[500];
      case 'rejected': return colors.error[500];
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
      <PageHeader
        title="Expense Approval"
        subtitle="Review and approve employee expense claims"
        icon="💰"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Expenses', path: '/app/expenses' },
          { label: 'Approval' }
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/app/expenses')}
          >
            ← Back to Expenses
          </Button>
        }
      />


      {/* Anomaly Alerts */}
      {(() => {
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        
        // Check for expenses pending > 3 days
        const oldPending = expenses.filter((expense) => {
          if (expense.status !== 'pending') return false;
          const createdDate = new Date(expense.created_at || expense.date || now);
          return createdDate < threeDaysAgo;
        });

        // Check for high-value expenses without approval
        const highValuePending = expenses.filter((expense) => {
          return expense.status === 'pending' && expense.amount > 10000;
        });

        // Check for expenses without receipts
        const missingReceipts = expenses.filter((expense) => {
          return expense.status === 'pending' && expense.amount > 500 && !expense.receipt_key;
        });

        return (
          <>
            {oldPending.length > 0 && (
              <AnomalyAlert
                title={`${oldPending.length} Expense${oldPending.length > 1 ? 's' : ''} Pending > 3 Days`}
                description="Some expenses have been pending approval for more than 3 days. Please review them."
                severity="warning"
                actions={[
                  {
                    label: 'Review Old Pending',
                    onClick: () => setFilter('pending'),
                    variant: 'primary',
                  },
                ]}
              />
            )}
            {highValuePending.length > 0 && (
              <AnomalyAlert
                title={`${highValuePending.length} High-Value Expense${highValuePending.length > 1 ? 's' : ''} (> ₹10,000) Pending Approval`}
                description="High-value expenses require immediate attention and approval."
                severity="error"
                actions={[
                  {
                    label: 'Review High-Value',
                    onClick: () => setFilter('pending'),
                    variant: 'primary',
                  },
                ]}
              />
            )}
            {missingReceipts.length > 0 && (
              <AnomalyAlert
                title={`${missingReceipts.length} Expense${missingReceipts.length > 1 ? 's' : ''} Missing Receipts (> ₹500)`}
                description="Some expenses above ₹500 are missing receipt attachments."
                severity="warning"
                actions={[
                  {
                    label: 'Review Missing Receipts',
                    onClick: () => setFilter('pending'),
                    variant: 'primary',
                  },
                ]}
              />
            )}
          </>
        );
      })()}

      {/* Statistics */}
      {stats && (
        <WideGrid gap="lg">
          <StatCard
            label="Pending"
            value={stats.pending}
            color={colors.warning[500]}
            description={formatCurrency(stats.pending_amount)}
            href="/app/expenses/approval?filter=pending"
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            color={colors.success[500]}
            description={formatCurrency(stats.approved_amount)}
            href="/app/expenses/approval?filter=approved"
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            color={colors.error[500]}
            href="/app/expenses/approval?filter=rejected"
          />
          <StatCard
            label="Average"
            value={formatCurrency(stats.average_amount)}
            color={colors.primary}
          />
        </WideGrid>
      )}

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
      <CardGrid gap="lg">
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleExpenseClick(expense);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View expense details for ${formatCurrency(expense.amount)}`}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                  {expense.escalation_level && expense.escalation_level > 0 && (
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: expense.escalation_level >= 2 ? colors.error[600] : colors.warning[500],
                      color: 'white',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }} title={`Escalated to level ${expense.escalation_level}`}>
                      ⚠️ L{expense.escalation_level}
                    </span>
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
                  disabled={loading || approveMutation.isPending}
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
                  disabled={loading || approveMutation.isPending}
                >
                  ❌ Reject
                </Button>
              </div>
            )}

            {expense.status === 'approved' && expense.approved_by && (
              <div style={{ 
                ...typography.caption, 
                color: colors.success[500],
                margin: 0,
                marginTop: spacing.sm
              }}>
                ✅ Approved by {expense.approved_by} on {new Date(expense.approved_at!).toLocaleString()}
              </div>
            )}

            {expense.status === 'rejected' && expense.rejected_by && (
              <div style={{ 
                ...typography.caption, 
                color: colors.error[500],
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

            {/* Receipt Preview */}
            {expense.receipt_key && (
              <div style={{ marginTop: spacing.md }}>
                <ReceiptPreview
                  receipts={[{
                    id: expense.id,
                    url: `/storage/${expense.receipt_key}`,
                    name: `Receipt for ${expense.category || 'expense'}`
                  }]}
                  maxThumbnails={1}
                />
              </div>
            )}
          </div>
        ))}
      </CardGrid>

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
  );
};


