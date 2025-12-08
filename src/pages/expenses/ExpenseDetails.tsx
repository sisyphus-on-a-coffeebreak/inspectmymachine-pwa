import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { useExpenses } from '../../lib/queries';

/**
 * Expense Details Page
 * Deep linking support for individual expenses
 */
export const ExpenseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  // Track where user came from for back navigation
  const returnPath = (location.state as any)?.from || '/app/expenses/history';
  const returnLabel = returnPath.includes('history') ? 'History' : 
                     returnPath.includes('approval') ? 'Approvals' :
                     returnPath.includes('dashboard') ? 'Dashboard' : 'Expenses';
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
            onClick={() => navigate(returnPath)}
            icon={<ArrowLeft size={16} />}
          >
            Back to {returnLabel}
          </Button>
        }
      />

      {/* Rejected Expense - Resubmit Section */}
      {expense?.status === 'rejected' && (
        <div style={{
          padding: spacing.lg,
          backgroundColor: colors.status.error + '15',
          border: `2px solid ${colors.status.error}`,
          borderRadius: '12px',
          marginBottom: spacing.lg,
        }}>
          <div style={{ 
            ...typography.subheader, 
            color: colors.status.error, 
            marginBottom: spacing.sm,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            ❌ Expense Rejected
          </div>
          {expense.rejection_reason && (
            <div style={{ 
              ...typography.body, 
              color: colors.neutral[700], 
              marginBottom: spacing.md 
            }}>
              <strong>Reason:</strong> {expense.rejection_reason}
            </div>
          )}
          {expense.rejected_by && expense.rejected_at && (
            <div style={{ 
              ...typography.bodySmall, 
              color: colors.neutral[600], 
              marginBottom: spacing.md 
            }}>
              Rejected by {expense.rejected_by} on {new Date(expense.rejected_at).toLocaleString()}
            </div>
          )}
          <Button
            variant="primary"
            onClick={() => {
              navigate('/app/expenses/create', {
                state: {
                  resubmitFrom: expense,
                  mode: 'resubmit'
                }
              });
            }}
            icon="✏️"
          >
            Edit & Resubmit
          </Button>
        </div>
      )}

      {/* Resubmission History */}
      {expense?.original_expense_id && (
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.primary + '15',
          border: `1px solid ${colors.primary}`,
          borderRadius: '8px',
          marginBottom: spacing.lg,
        }}>
          <div style={{ 
            ...typography.bodySmall, 
            color: colors.primary,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <span>📝</span>
            <span>
              Resubmission #{expense.resubmission_count || 1} of{' '}
              <button
                onClick={() => navigate(`/app/expenses/${expense.original_expense_id}`, {
                  state: { from: returnPath }
                })}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.primary,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                original expense
              </button>
            </span>
          </div>
        </div>
      )}

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
          
          anomalies.push({
            title: `Duplicate Expense Detected (${duplicateCount} similar)`,
            description: `Found ${duplicateCount} similar expense${duplicateCount > 1 ? 's' : ''} with the same amount (₹${expense.amount.toLocaleString('en-IN')}). Click to view details.`,
            severity: 'warning' as const,
            actions: [{
              label: 'View Duplicates',
              onClick: () => {
                // Scroll to duplicates section or show modal
                const duplicatesSection = document.getElementById('duplicates-section');
                if (duplicatesSection) {
                  duplicatesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              },
              variant: 'secondary' as const
            }]
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
                key={`anomaly-${anomaly.title || (anomaly as any).id || index}`}
                title={anomaly.title}
                description={anomaly.description}
                severity={anomaly.severity}
                dismissible={false}
                actions={(anomaly as any).actions}
              />
            ))}
          </div>
        ) : null;
      })()}

      {/* Main Expense Details Card - Always visible */}
      <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
        <h2 style={{ ...typography.header, marginBottom: spacing.lg, color: colors.neutral[900] }}>
          Expense Details
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing.lg }}>
          <div>
            <dt style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Amount</dt>
            <dd style={{ ...typography.header, color: colors.primary, margin: 0, fontSize: '1.5rem' }}>
              {formatCurrency(expense.amount || 0)}
            </dd>
          </div>
          {expense.category && (
            <div>
              <dt style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Category</dt>
              <dd style={{ ...typography.body, margin: 0, fontWeight: 600 }}>
                {expense.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </dd>
            </div>
          )}
          {expense.status && (
            <div>
              <dt style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Status</dt>
              <dd style={{ 
                ...typography.body, 
                margin: 0,
                padding: `${spacing.xs}px ${spacing.sm}px`,
                borderRadius: borderRadius.sm,
                backgroundColor: expense.status === 'approved' ? colors.status.normal + '20' :
                                 expense.status === 'rejected' ? colors.status.error + '20' :
                                 colors.status.warning + '20',
                color: expense.status === 'approved' ? colors.status.normal :
                       expense.status === 'rejected' ? colors.status.error :
                       colors.status.warning,
                display: 'inline-block',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}>
                {expense.status}
              </dd>
            </div>
          )}
          {expense.date && (
            <div>
              <dt style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Date</dt>
              <dd style={{ ...typography.body, margin: 0 }}>
                {new Date(expense.date).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </dd>
            </div>
          )}
          {expense.payment_method && (
            <div>
              <dt style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Payment Method</dt>
              <dd style={{ ...typography.body, margin: 0 }}>
                {expense.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </dd>
            </div>
          )}
          {expense.location && (
            <div>
              <dt style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Location</dt>
              <dd style={{ ...typography.body, margin: 0 }}>{expense.location}</dd>
            </div>
          )}
          {expense.project_name && (
            <div>
              <dt style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Project</dt>
              <dd style={{ ...typography.body, margin: 0 }}>{expense.project_name}</dd>
            </div>
          )}
          {expense.asset_name && (
            <div>
              <dt style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Asset</dt>
              <dd style={{ ...typography.body, margin: 0 }}>{expense.asset_name}</dd>
            </div>
          )}
        </div>
        {expense.description && (
          <div style={{ marginTop: spacing.lg, paddingTop: spacing.lg, borderTop: `1px solid ${colors.neutral[200]}` }}>
            <dt style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Description</dt>
            <dd style={{ ...typography.body, margin: 0, lineHeight: 1.6 }}>{expense.description}</dd>
          </div>
        )}
        {expense.notes && (
          <div style={{ marginTop: spacing.md }}>
            <dt style={{ ...typography.label, color: colors.neutral[600], marginBottom: spacing.xs }}>Notes</dt>
            <dd style={{ ...typography.body, margin: 0, lineHeight: 1.6, color: colors.neutral[700] }}>{expense.notes}</dd>
          </div>
        )}
      </div>

      {/* Receipt - Show directly if exists, no "view receipt" button needed */}
      {expense.receipt_key && (
        <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
          <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Receipt</h3>
          <div style={{
            borderRadius: borderRadius.md,
            overflow: 'hidden',
            border: `1px solid ${colors.neutral[200]}`,
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onClick={() => {
            // Open receipt in lightbox or new tab
            const receiptUrl = expense.receipt_key ? `/storage/${expense.receipt_key}` : '';
            if (receiptUrl) {
              window.open(receiptUrl, '_blank');
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          >
            <img
              src={expense.receipt_key ? `/storage/${expense.receipt_key}` : ''}
              alt={`Receipt for ${expense.description || 'expense'}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </div>
        </div>
      )}

      {/* Timeline - Always visible if events exist */}
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

        {/* Duplicate Expenses Panel */}
        {duplicateExpenses.length > 0 && (
          <div id="duplicates-section" style={{ ...cardStyles.card, marginTop: spacing.lg }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md, color: colors.status.warning }}>
              ⚠️ Potential Duplicate Expenses ({duplicateExpenses.length})
            </h3>
            <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.md }}>
              The following expenses have similar amounts and dates/descriptions. Please verify these are not duplicates.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {duplicateExpenses.map((e: any) => (
                <div
                  key={e.id}
                  style={{
                    padding: spacing.md,
                    border: `2px solid ${colors.status.warning}`,
                    borderRadius: '8px',
                    backgroundColor: colors.status.warning + '10',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ ...typography.subheader, marginBottom: spacing.xs }}>
                      Expense #{e.id?.substring(0, 8)}
                    </div>
                    <div style={{ ...typography.bodySmall, color: colors.neutral[600], marginBottom: spacing.xs }}>
                      {e.description || 'No description'}
                    </div>
                    <div style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
                      {e.date ? new Date(e.date).toLocaleDateString() : 'Unknown date'} • 
                      {e.category ? ` ${e.category}` : ''} • 
                      Status: {e.status || 'Unknown'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing.xs }}>
                    <div style={{ ...typography.subheader, color: colors.status.warning, fontWeight: 600 }}>
                      ₹{e.amount?.toLocaleString('en-IN') || '0'}
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/app/expenses/${e.id}`)}
                      style={{ padding: `${spacing.xs}px ${spacing.sm}px` }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

        {/* Navigation Links - Show if category or project exists */}
        {(expense.category || expense.project_id) && (
          <div style={{ ...cardStyles.card, marginTop: spacing.lg }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Related Expenses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {expense.category && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/app/expenses/history`, {
                    state: { filters: { category: expense.category } }
                  })}
                  style={{ justifyContent: 'flex-start' }}
                >
                  View all {expense.category.replace(/_/g, ' ')} expenses →
                </Button>
              )}
              {expense.project_id && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/app/expenses/history`, {
                    state: { filters: { project: expense.project_id } }
                  })}
                  style={{ justifyContent: 'flex-start' }}
                >
                  View all {expense.project_name || 'project'} expenses →
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons at Bottom - Only actual actions */}
      <div style={{ 
        marginTop: spacing.xl, 
        padding: spacing.lg,
        backgroundColor: 'white',
        borderRadius: '16px',
        display: 'flex',
        gap: spacing.sm,
        flexWrap: 'wrap'
      }}>
        {expense.status === 'rejected' && (
          <Button
            variant="primary"
            onClick={() => {
              navigate('/app/expenses/create', {
                state: {
                  resubmitFrom: expense,
                  mode: 'resubmit'
                }
              });
            }}
            icon="✏️"
          >
            Edit & Resubmit
          </Button>
        )}
        {expense.status === 'pending' && (
          <Button
            variant="secondary"
            onClick={() => {
              navigate('/app/expenses/create', {
                state: {
                  editFrom: expense,
                  mode: 'edit'
                }
              });
            }}
            icon="✏️"
          >
            Edit Expense
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            // Share functionality
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
              showToast({
                title: 'Link copied',
                description: 'Expense link copied to clipboard',
                variant: 'success',
              });
            });
          }}
          icon="🔗"
        >
          Share
        </Button>
      </div>
    </div>
  );
};


