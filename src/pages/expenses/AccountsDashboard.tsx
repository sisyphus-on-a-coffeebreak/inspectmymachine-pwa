import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../providers/ToastProvider';
import { useConfirm } from '../../components/ui/Modal';
import { Button } from '../../components/ui/button';
import { StatusCard } from '../../components/ui/StatusCard';
import { colors, spacing, typography, borderRadius } from '../../lib/theme';
import { CardGrid, WideGrid } from '../../components/ui/ResponsiveGrid';
import { 
  Edit2, 
  History, 
  Search, 
  Filter, 
  RefreshCw,
  User,
  Folder,
  Car,
  Tag,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

/**
 * Accounts Dashboard
 * 
 * Admin interface for expense management:
 * - Reassign expenses (change employee, project, asset)
 * - Edit expense categories
 * - View audit trails (who changed what, when)
 * - Vehicle-centric KPIs (spend per registration, variance vs budget)
 * - Reconciliation queues
 */

interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  description: string;
  payment_method: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  employee_id: string;
  employee_name: string;
  project_id?: string;
  project_name?: string;
  asset_id?: string;
  asset_name?: string;
  asset_registration?: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
}

interface AuditLog {
  id: string;
  expense_id: string;
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'reassigned' | 'category_changed';
  field?: string;
  old_value?: string;
  new_value?: string;
  changed_by: string;
  changed_by_name: string;
  changed_at: string;
  notes?: string;
}

interface ExpenseEditModal {
  expense: ExpenseRecord | null;
  field: 'employee' | 'project' | 'asset' | 'category' | null;
}

interface VehicleKPI {
  registration_number: string;
  total_spend: number;
  expense_count: number;
  budget?: number;
  variance?: number;
  last_expense_date?: string;
}

export const AccountsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<Record<string, AuditLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [editModal, setEditModal] = useState<ExpenseEditModal>({ expense: null, field: null });
  const [vehicleKPIs, setVehicleKPIs] = useState<VehicleKPI[]>([]);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [assets, setAssets] = useState<Array<{ id: string; name: string; registration_number?: string }>>([]);

  const EXPENSE_CATEGORIES = [
    'LOCAL_TRANSPORT', 'INTERCITY_TRAVEL', 'LODGING', 'FOOD', 'TOLLS_PARKING', 'FUEL',
    'PARTS_REPAIR', 'RTO_COMPLIANCE', 'DRIVER_PAYMENT', 'RECHARGE', 'CONSUMABLES_MISC',
    'VENDOR_AGENT_FEE', 'MISC'
  ];

  useEffect(() => {
    fetchExpenses();
    fetchVehicleKPIs();
    fetchReferenceData();
  }, []);

  useEffect(() => {
    if (selectedExpenseId) {
      fetchAuditLogs(selectedExpenseId);
    }
  }, [selectedExpenseId]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/expenses', {
        params: {
          limit: 100,
          include_audit: true,
        }
      });
      setExpenses(response.data.data || response.data || []);
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to load expenses',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (expenseId: string) => {
    try {
      const response = await apiClient.get(`/v1/expenses/${expenseId}/audit`);
      setAuditLogs(prev => ({
        ...prev,
        [expenseId]: response.data.data || response.data || [],
      }));
    } catch (error) {
      // Failed to fetch audit logs - silently fail as audit logs may not be available
    }
  };

  const fetchVehicleKPIs = async () => {
    try {
      const response = await apiClient.get('/v1/expenses/vehicle-kpis', {
        suppressErrorLog: true, // Suppress 404 errors for missing endpoint
      } as any);
      setVehicleKPIs(response.data.data || response.data || []);
    } catch (error) {
      // Silently fail - KPIs endpoint may not be available
      setVehicleKPIs([]);
    }
  };

  const fetchReferenceData = async () => {
    try {
      // Fetch employees, projects, assets for dropdowns
      const [employeesRes, projectsRes, assetsRes] = await Promise.allSettled([
        apiClient.get('/v1/users?role=employee'),
        apiClient.get('/v1/projects'),
        apiClient.get('/v1/assets'),
      ]);

      if (employeesRes.status === 'fulfilled') {
        setEmployees(employeesRes.value.data.data || employeesRes.value.data || []);
      }
      if (projectsRes.status === 'fulfilled') {
        setProjects(projectsRes.value.data.data || projectsRes.value.data || []);
      }
      if (assetsRes.status === 'fulfilled') {
        setAssets(assetsRes.value.data.data || assetsRes.value.data || []);
      }
    } catch (error) {
      // Failed to fetch reference data
    }
  };

  const handleReassign = async (expenseId: string, field: 'employee' | 'project' | 'asset', newValue: string) => {
    try {
      const confirmed = await confirm({
        title: 'Confirm Reassignment',
        message: `Are you sure you want to reassign this expense? This action will be logged in the audit trail.`,
        confirmLabel: 'Reassign',
        cancelLabel: 'Cancel',
      });

      if (!confirmed) return;

      await apiClient.patch(`/v1/expenses/${expenseId}/reassign`, {
        field,
        value: newValue,
      });

      showToast({
        title: 'Success',
        description: 'Expense reassigned successfully',
        variant: 'success',
      });

      await fetchExpenses();
      if (selectedExpenseId === expenseId) {
        await fetchAuditLogs(expenseId);
      }
      setEditModal({ expense: null, field: null });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to reassign expense',
        variant: 'error',
      });
    }
  };

  const handleCategoryChange = async (expenseId: string, newCategory: string) => {
    try {
      const confirmed = await confirm({
        title: 'Change Category',
        message: `Change expense category to ${newCategory}? This action will be logged.`,
        confirmLabel: 'Change',
        cancelLabel: 'Cancel',
      });

      if (!confirmed) return;

      await apiClient.patch(`/v1/expenses/${expenseId}`, {
        category: newCategory,
      });

      showToast({
        title: 'Success',
        description: 'Category updated successfully',
        variant: 'success',
      });

      await fetchExpenses();
      if (selectedExpenseId === expenseId) {
        await fetchAuditLogs(expenseId);
      }
      setEditModal({ expense: null, field: null });
    } catch (error) {
      showToast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'error',
      });
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (searchTerm && !expense.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !expense.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !expense.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterCategory !== 'all' && expense.category !== filterCategory) {
      return false;
    }
    if (filterStatus !== 'all' && expense.status !== filterStatus) {
      return false;
    }
    if (filterDateFrom && expense.date < filterDateFrom) {
      return false;
    }
    if (filterDateTo && expense.date > filterDateTo) {
      return false;
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div style={{ padding: spacing.xl, maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <h1 style={{ ...typography.h1 }}>Accounts Dashboard</h1>
          <Button variant="outline" onClick={fetchExpenses} disabled={loading}>
            <RefreshCw size={16} style={{ marginRight: spacing.xs }} />
            Refresh
          </Button>
        </div>
        <p style={{ ...typography.body, color: colors.neutral[600] }}>
          Manage expenses, reassign records, edit categories, and view audit trails. Vehicle-centric KPIs and reconciliation tools.
        </p>
      </div>

      {/* Vehicle KPIs */}
      {vehicleKPIs.length > 0 && (
        <div style={{ marginBottom: spacing.xl }}>
          <h2 style={{ ...typography.h2, marginBottom: spacing.md }}>Vehicle-Centric KPIs</h2>
          <CardGrid gap="md">
            {vehicleKPIs.map((kpi) => (
              <div
                key={kpi.registration_number}
                style={{
                  padding: spacing.lg,
                  backgroundColor: 'white',
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.neutral[200]}`,
                }}
              >
                <div style={{ ...typography.subheader, marginBottom: spacing.xs }}>
                  {kpi.registration_number}
                </div>
                <div style={{ ...typography.h3, color: colors.primary, marginBottom: spacing.xs }}>
                  {formatCurrency(kpi.total_spend)}
                </div>
                <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                  {kpi.expense_count} expense{kpi.expense_count !== 1 ? 's' : ''}
                  {kpi.budget && (
                    <div style={{ marginTop: spacing.xs }}>
                      Budget: {formatCurrency(kpi.budget)}
                      {kpi.variance !== undefined && (
                        <span style={{ 
                          color: kpi.variance > 0 ? colors.error[500] : colors.success[500],
                          marginLeft: spacing.xs,
                        }}>
                          ({kpi.variance > 0 ? '+' : ''}{formatCurrency(kpi.variance)})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardGrid>
        </div>
      )}

      {/* Filters */}
      <div style={{
        padding: spacing.lg,
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.neutral[200]}`,
        marginBottom: spacing.lg,
      }}>
        <WideGrid gap="md">
          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: spacing.sm, top: '50%', transform: 'translateY(-50%)', color: colors.neutral[400] }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search expenses..."
                style={{
                  width: '100%',
                  padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xxl}`,
                  border: `1px solid ${colors.neutral[300]}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
              }}
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Date From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
              }}
            />
          </div>
          <div>
            <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>Date To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              style={{
                width: '100%',
                padding: spacing.sm,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
              }}
            />
          </div>
        </WideGrid>
      </div>

      {/* Expenses Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.neutral[200]}`,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: colors.neutral[50], borderBottom: `1px solid ${colors.neutral[200]}` }}>
                <th style={{ ...typography.label, padding: spacing.md, textAlign: 'left' }}>Date</th>
                <th style={{ ...typography.label, padding: spacing.md, textAlign: 'left' }}>Employee</th>
                <th style={{ ...typography.label, padding: spacing.md, textAlign: 'left' }}>Amount</th>
                <th style={{ ...typography.label, padding: spacing.md, textAlign: 'left' }}>Category</th>
                <th style={{ ...typography.label, padding: spacing.md, textAlign: 'left' }}>Project</th>
                <th style={{ ...typography.label, padding: spacing.md, textAlign: 'left' }}>Asset</th>
                <th style={{ ...typography.label, padding: spacing.md, textAlign: 'left' }}>Status</th>
                <th style={{ ...typography.label, padding: spacing.md, textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: spacing.xl, textAlign: 'center', color: colors.neutral[600] }}>
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: spacing.xl, textAlign: 'center', color: colors.neutral[600] }}>
                    No expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    style={{
                      borderBottom: `1px solid ${colors.neutral[100]}`,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.neutral[50];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                    onClick={() => setSelectedExpenseId(selectedExpenseId === expense.id ? null : expense.id)}
                  >
                    <td style={{ padding: spacing.md, fontSize: '13px' }}>{formatDate(expense.date)}</td>
                    <td style={{ padding: spacing.md, fontSize: '13px' }}>{expense.employee_name}</td>
                    <td style={{ padding: spacing.md, fontSize: '13px', fontWeight: 600 }}>
                      {formatCurrency(expense.amount)}
                    </td>
                    <td style={{ padding: spacing.md, fontSize: '13px' }}>
                      {expense.category.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: spacing.md, fontSize: '13px' }}>
                      {expense.project_name || '-'}
                    </td>
                    <td style={{ padding: spacing.md, fontSize: '13px' }}>
                      {expense.asset_name || expense.asset_registration || '-'}
                    </td>
                    <td style={{ padding: spacing.md }}>
                      <span style={{
                        padding: `${spacing.xs} ${spacing.sm}`,
                        borderRadius: borderRadius.sm,
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: expense.status === 'approved' ? colors.success[100] :
                                        expense.status === 'rejected' ? colors.error[100] :
                                        colors.warning[100],
                        color: expense.status === 'approved' ? colors.success[700] :
                               expense.status === 'rejected' ? colors.error[700] :
                               colors.warning[700],
                      }}>
                        {expense.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: spacing.md }}>
                      <div style={{ display: 'flex', gap: spacing.xs }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditModal({ expense, field: 'employee' });
                          }}
                        >
                          <User size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditModal({ expense, field: 'category' });
                          }}
                        >
                          <Tag size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditModal({ expense, field: 'project' });
                          }}
                        >
                          <Folder size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditModal({ expense, field: 'asset' });
                          }}
                        >
                          <Car size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExpenseId(expense.id);
                          }}
                        >
                          <History size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Expanded Row - Audit Trail */}
        {selectedExpenseId && auditLogs[selectedExpenseId] && (
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.neutral[50],
            borderTop: `2px solid ${colors.primary}`,
          }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>Audit Trail</h3>
            <div style={{ display: 'grid', gap: spacing.sm }}>
              {auditLogs[selectedExpenseId].map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: spacing.md,
                    backgroundColor: 'white',
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.neutral[200]}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    {log.field && (
                      <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                        {log.field}: {log.old_value} → {log.new_value}
                      </div>
                    )}
                    {log.notes && (
                      <div style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.xs }}>
                        {log.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ ...typography.caption, color: colors.neutral[600] }}>
                      {log.changed_by_name}
                    </div>
                    <div style={{ ...typography.caption, color: colors.neutral[500], fontSize: '11px' }}>
                      {formatDate(log.changed_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal.expense && editModal.field && (
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
          zIndex: 1000,
          padding: spacing.xl,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h2 style={{ ...typography.h2, marginBottom: spacing.md }}>
              {editModal.field === 'employee' && 'Reassign Employee'}
              {editModal.field === 'project' && 'Reassign Project'}
              {editModal.field === 'asset' && 'Reassign Asset'}
              {editModal.field === 'category' && 'Change Category'}
            </h2>

            {editModal.field === 'category' ? (
              <div style={{ marginBottom: spacing.lg }}>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  New Category
                </label>
                <select
                  defaultValue={editModal.expense.category}
                  onChange={(e) => {
                    handleCategoryChange(editModal.expense!.id, e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '14px',
                  }}
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            ) : editModal.field === 'employee' ? (
              <div style={{ marginBottom: spacing.lg }}>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  New Employee
                </label>
                <select
                  defaultValue={editModal.expense.employee_id}
                  onChange={(e) => {
                    handleReassign(editModal.expense!.id, 'employee', e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '14px',
                  }}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            ) : editModal.field === 'project' ? (
              <div style={{ marginBottom: spacing.lg }}>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  New Project
                </label>
                <select
                  defaultValue={editModal.expense.project_id || ''}
                  onChange={(e) => {
                    handleReassign(editModal.expense!.id, 'project', e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '14px',
                  }}
                >
                  <option value="">No Project</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ marginBottom: spacing.lg }}>
                <label style={{ ...typography.label, display: 'block', marginBottom: spacing.xs }}>
                  New Asset
                </label>
                <select
                  defaultValue={editModal.expense.asset_id || ''}
                  onChange={(e) => {
                    handleReassign(editModal.expense!.id, 'asset', e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: borderRadius.md,
                    fontSize: '14px',
                  }}
                >
                  <option value="">No Asset</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} {asset.registration_number && `(${asset.registration_number})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md }}>
              <Button variant="outline" onClick={() => setEditModal({ expense: null, field: null })}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

