import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/ui/PageHeader';
import { NetworkError } from '../../components/ui/NetworkError';
import { EmptyState } from '../../components/ui/EmptyState';
import { ReceiptPreview } from '../../components/ui/ReceiptPreview';
import { useToast } from '../../providers/ToastProvider';
import { ArrowLeft } from 'lucide-react';
import { addRecentlyViewed } from '../../lib/recentlyViewed';
import { RelatedItems } from '../../components/ui/RelatedItems';
import { ExpenseTimeline, type TimelineEvent } from '../../components/ui/ExpenseTimeline';
import { AnomalyAlert } from '../../components/ui/AnomalyAlert';
import { PolicyLinks } from '../../components/ui/PolicyLinks';
import { useExpenses } from '../../lib/queries';

/**
 * Expense Details Page
 * Deep linking support for individual expenses
 */
export const ExpenseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  // Fetch expenses to check for duplicates and related items
  const { data: allExpensesData } = useExpenses(
    undefined, // Fetch all expenses for duplicate detection and related items
    { enabled: !!expense } // Only fetch when expense is loaded
  );
  
  // Check for duplicate expenses
  const duplicateExpenses = useMemo(() => {
    if (!expense || !allExpensesData?.data) return [];
    
    const expenses = allExpensesData.data;
    const expenseDate = expense.date ? new Date(expense.date).toISOString().split('T')[0] : null;
    const expenseDescription = expense.description?.toLowerCase().trim() || '';
    
    return expenses.filter((e: any) => {
      // Exclude current expense
      if (e.id === expense.id) return false;
      
      // Check for same amount (within ₹1 tolerance)
      const amountMatch = Math.abs(e.amount - expense.amount) < 1;
      
      // Check for same date
      const eDate = e.date ? new Date(e.date).toISOString().split('T')[0] : null;
      const dateMatch = expenseDate && eDate && expenseDate === eDate;
      
      // Check for similar description (same or very similar)
      const eDescription = e.description?.toLowerCase().trim() || '';
      const descriptionMatch = expenseDescription && eDescription && 
        (expenseDescription === eDescription || 
         expenseDescription.includes(eDescription) || 
         eDescription.includes(expenseDescription));
      
      // Consider it a duplicate if amount matches and (date matches OR description matches)
      return amountMatch && (dateMatch || descriptionMatch);
    });
  }, [expense, allExpensesData]);

  // Filter related expenses by category
  const similarExpenses = useMemo(() => {
    if (!expense || !allExpensesData?.data || !expense.category) return [];
    
    return allExpensesData.data
      .filter((e: any) => {
        // Same category, exclude current expense
        return e.category === expense.category && e.id !== expense.id;
      })
      .slice(0, 5); // Limit to 5 most recent
  }, [expense, allExpensesData]);

  // Filter related expenses by project
  const projectExpenses = useMemo(() => {
    if (!expense || !allExpensesData?.data || !expense.project_id) return [];
    
    return allExpensesData.data
      .filter((e: any) => {
        // Same project, exclude current expense
        return e.project_id === expense.project_id && e.id !== expense.id;
      })
      .slice(0, 5); // Limit to 5 most recent
  }, [expense, allExpensesData]);

  useEffect(() => {
    if (!id) return;
    fetchExpenseDetails();
  }, [id]);

  const fetchExpenseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/v1/expenses/${id}`);
      setExpense(response.data);
      
      // Build timeline events from expense data
      const events: TimelineEvent[] = [];
      
      if (response.data.created_at) {
        events.push({
          id: 'created',
          type: 'created',
          timestamp: response.data.created_at,
          actor: response.data.created_by ? {
            name: response.data.created_by.name || 'Unknown',
            role: response.data.created_by.role,
          } : undefined,
        });
      }
      
      if (response.data.submitted_at) {
        events.push({
          id: 'submitted',
          type: 'submitted',
          timestamp: response.data.submitted_at,
          actor: response.data.submitted_by ? {
            name: response.data.submitted_by.name || 'Unknown',
            role: response.data.submitted_by.role,
          } : undefined,
        });
      }
      
      if (response.data.approved_at) {
        events.push({
          id: 'approved',
          type: 'approved',
          timestamp: response.data.approved_at,
          actor: response.data.approved_by ? {
            name: response.data.approved_by.name || 'Unknown',
            role: response.data.approved_by.role,
          } : undefined,
          comment: response.data.approval_notes,
        });
      } else if (response.data.rejected_at) {
        events.push({
          id: 'rejected',
          type: 'rejected',
          timestamp: response.data.rejected_at,
          actor: response.data.rejected_by ? {
            name: response.data.rejected_by.name || 'Unknown',
            role: response.data.rejected_by.role,
          } : undefined,
          comment: response.data.rejection_reason,
        });
      }
      
      if (response.data.updated_at && response.data.updated_at !== response.data.created_at) {
        events.push({
          id: 'updated',
          type: 'updated',
          timestamp: response.data.updated_at,
        });
      }
      
      setTimelineEvents(events);
      
      // Track in recently viewed
      if (response.data) {
        addRecentlyViewed({
          id: String(id),
          type: 'expense',
          title: `Expense #${id?.substring(0, 8)}`,
          subtitle: response.data.description || `₹${response.data.amount || 0}`,
          path: `/app/expenses/${id}`,
        });
      }
    } catch (err) {
      setError(err as Error);
      showToast({
        title: 'Error',
        description: 'Failed to load expense details',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div style={{ padding: spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: spacing.sm }}>💰</div>
        <div style={{ color: colors.neutral[600] }}>Loading expense details...</div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing.xl }}>
        <NetworkError
          error={error || new Error('Expense not found')}
          onRetry={fetchExpenseDetails}
          onGoBack={() => navigate('/app/expenses')}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
      <PageHeader
        title={`Expense #${id?.substring(0, 8)}`}
        subtitle={expense.description || 'Expense Details'}
        icon="💰"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Expenses', path: '/app/expenses' },
          { label: 'Details' }
        ]}
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/app/expenses')}
            icon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
        }
      />

      {/* Anomaly Alerts */}
      {expense && (() => {
        const anomalies = [];

        // Check for expense > ₹10,000 without approval
        if (expense.amount > 10000 && expense.status !== 'approved' && expense.status !== 'rejected') {
          anomalies.push({
            title: 'High-Value Expense Without Approval',
            description: `This expense is ₹${expense.amount.toLocaleString('en-IN')} and requires approval. High-value expenses (> ₹10,000) need immediate attention.`,
            severity: 'error' as const,
          });
        }

        // Check for receipt missing for > ₹500
        if (expense.amount > 500 && !expense.receipt_key) {
          anomalies.push({
            title: 'Receipt Missing for Expense > ₹500',
            description: `This expense is ₹${expense.amount.toLocaleString('en-IN')} but no receipt has been uploaded. Receipts are required for expenses above ₹500.`,
            severity: 'warning' as const,
          });
        }

        // Check for duplicate expenses
        if (duplicateExpenses.length > 0) {
          const duplicateCount = duplicateExpenses.length;
          const duplicateDates = duplicateExpenses.map((e: any) => 
            e.date ? new Date(e.date).toLocaleDateString() : 'Unknown'
          ).join(', ');
          
          anomalies.push({
            title: 'Duplicate Expense Detected',
            description: `Found ${duplicateCount} similar expense${duplicateCount > 1 ? 's' : ''} with the same amount (₹${expense.amount.toLocaleString('en-IN')})${duplicateDates ? ` on ${duplicateDates}` : ''}. Please verify these are not duplicates.`,
            severity: 'warning' as const,
          });
        }

        // Check for escalation
        if (expense.escalation_level && expense.escalation_level > 0) {
          const escalatedAt = expense.escalated_at ? new Date(expense.escalated_at) : null;
          const escalatedDate = escalatedAt ? escalatedAt.toLocaleDateString() : 'Unknown';
          anomalies.push({
            title: `Expense Escalated (Level ${expense.escalation_level})`,
            description: `This expense has been escalated to supervisor/admin. Escalated on ${escalatedDate}. Please review and approve or reject immediately.`,
            severity: expense.escalation_level >= 2 ? 'critical' as const : 'error' as const,
          });
        }

        return anomalies.length > 0 ? (
          <div style={{ marginTop: spacing.lg }}>
            {anomalies.map((anomaly, index) => (
              <AnomalyAlert
                key={`anomaly-${anomaly.title || anomaly.id || index}`}
                title={anomaly.title}
                description={anomaly.description}
                severity={anomaly.severity}
                dismissible={false}
              />
            ))}
          </div>
        ) : null;
      })()}

      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Expense Information</h3>
        <div style={{ display: 'grid', gap: spacing.md }}>
          <div>
            <div style={{ ...typography.label, color: colors.neutral[600] }}>Amount</div>
            <div style={{ ...typography.header, color: colors.primary }}>
              {formatCurrency(expense.amount || 0)}
            </div>
          </div>
          {expense.category && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Category</div>
              <div style={{ ...typography.body }}>{expense.category}</div>
            </div>
          )}
          {expense.description && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Description</div>
              <div style={{ ...typography.body }}>{expense.description}</div>
            </div>
          )}
          {expense.status && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Status</div>
              <div style={{ ...typography.body }}>{expense.status}</div>
            </div>
          )}
          {expense.date && (
            <div>
              <div style={{ ...typography.label, color: colors.neutral[600] }}>Date</div>
              <div style={{ ...typography.body }}>{new Date(expense.date).toLocaleDateString()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Preview */}
      {expense.receipt_key && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Receipt</h3>
          <ReceiptPreview
            receipts={[{
              id: expense.id || id || 'receipt-1',
              url: expense.receipt_key ? `/storage/${expense.receipt_key}` : '',
              name: `Receipt for ${expense.description || 'expense'}`
            }]}
            maxThumbnails={1}
          />
        </div>
      )}

      {/* Expense Timeline */}
      {timelineEvents.length > 0 && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Approval Timeline</h3>
          <ExpenseTimeline events={timelineEvents} />
        </div>
      )}

      {/* Related Items */}
      {/* Linked Components Panel */}
      {expense?.linked_components && expense.linked_components.length > 0 && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Components Created from This Expense</h3>
          <div style={{ ...typography.body, color: colors.neutral[600], marginBottom: spacing.md }}>
            The following components were automatically created when this expense was recorded:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {expense.linked_components.map((component: any) => {
              const typeLabels: Record<string, string> = {
                battery: 'Battery',
                tyre: 'Tyre',
                spare_part: 'Spare Part',
              };
              
              return (
                <div
                  key={`${component.component_type}-${component.component_id}`}
                  style={{
                    padding: spacing.md,
                    border: `1px solid ${colors.neutral[200]}`,
                    borderRadius: borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ ...typography.body, fontWeight: 600 }}>{component.component_name}</div>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      {typeLabels[component.component_type] || 'Component'}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/app/stockyard/components/${component.component_type}/${component.component_id}`)}
                    style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
                  >
                    View
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: spacing.lg, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing.lg }}>
      {/* Policy Links */}
      <PolicyLinks
        title="Expense Policy & Guidelines"
        links={[
          {
            label: 'Expense Policy',
            url: '/policies/expense-policy',
            external: false,
            icon: '📋'
          },
          {
            label: 'Receipt Requirements',
            url: '/policies/receipt-requirements',
            external: false,
            icon: '🧾'
          },
          {
            label: 'Approval Process',
            url: '/policies/approval-process',
            external: false,
            icon: '✅'
          }
        ]}
        variant="compact"
      />

      {/* Auto-linked Items Panel */}
      {expense?.links && expense.links.length > 0 && (
          <RelatedItems
            title="Auto-linked Items"
            items={expense.links.map((link: any) => {
              const typeLabels: Record<string, string> = {
                'vehicle_entry_pass': 'Vehicle Entry Pass',
                'vehicle_exit_pass': 'Vehicle Exit Pass',
                'visitor_gate_pass': 'Visitor Pass',
                'inspection': 'Inspection',
                'stockyard_request': 'Stockyard Request',
              };
              
              const typeIcons: Record<string, string> = {
                'vehicle_entry_pass': '🚗',
                'vehicle_exit_pass': '🚗',
                'visitor_gate_pass': '👥',
                'inspection': '🔍',
                'stockyard_request': '📦',
              };
              
              const reasonLabels: Record<string, string> = {
                'same_vehicle': 'Same Vehicle',
                'same_date': 'Same Date',
                'keyword_match': 'Keyword Match',
                'same_project': 'Same Project',
              };
              
              const modulePath = link.linked_type === 'vehicle_entry_pass' || link.linked_type === 'vehicle_exit_pass' 
                ? 'gatepass' 
                : link.linked_type === 'visitor_gate_pass'
                ? 'gatepass'
                : link.linked_type === 'inspection'
                ? 'inspections'
                : link.linked_type === 'stockyard_request'
                ? 'stockyard'
                : '';
              
              return {
                id: link.linked_id,
                title: `${typeLabels[link.linked_type] || link.linked_type} #${link.linked_id.substring(0, 8)}`,
                subtitle: `${reasonLabels[link.link_reason] || link.link_reason} (${(link.confidence_score * 100).toFixed(0)}% match)`,
                path: modulePath ? `/app/${modulePath}/${link.linked_id}` : '#',
                icon: typeIcons[link.linked_type] || '🔗',
              };
            })}
            variant="compact"
          />
        )}

        {/* Similar Expenses Panel */}
        {similarExpenses.length > 0 && (
          <RelatedItems
            title="Similar Expenses"
            items={similarExpenses.map((e: any) => ({
              id: e.id,
              title: `Expense #${e.id.substring(0, 8)}`,
              subtitle: `₹${e.amount.toLocaleString('en-IN')} - ${e.status || 'Unknown'}`,
              path: `/app/expenses/${e.id}`,
              icon: '💰',
            }))}
            variant="compact"
          />
        )}

        {/* Project Expenses Panel */}
        {projectExpenses.length > 0 && (
          <RelatedItems
            title={expense.project_name ? `Project: ${expense.project_name}` : 'Project Expenses'}
            items={projectExpenses.map((e: any) => ({
              id: e.id,
              title: `Expense #${e.id.substring(0, 8)}`,
              subtitle: `${e.category || 'Expense'} - ₹${e.amount.toLocaleString('en-IN')}`,
              path: `/app/expenses/${e.id}`,
              icon: '📁',
            }))}
            variant="compact"
          />
        )}

        {/* Navigation Links */}
        <RelatedItems
          title="View All"
          items={[
            ...(expense.category ? [{
              id: 'all-category-expenses',
              title: `All ${expense.category} Expenses`,
              subtitle: `View all expenses in this category`,
              path: `/app/expenses/history?category=${expense.category}`,
              icon: '💰',
            }] : []),
            ...(expense.project_id ? [{
              id: 'all-project-expenses',
              title: expense.project_name ? `All ${expense.project_name} Expenses` : 'All Project Expenses',
              subtitle: `View all expenses for this project`,
              path: `/app/expenses/history?project=${expense.project_id}`,
              icon: '📁',
            }] : []),
          ]}
          variant="compact"
        />
      </div>
    </div>
  );
};

