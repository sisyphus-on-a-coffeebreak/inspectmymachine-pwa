import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { colors, typography, spacing, cardStyles } from '../../lib/theme';
import { Button } from '../../components/ui/button';
import { ActionGrid, StatsGrid } from '../../components/ui/ResponsiveGrid';

// 📋 Project Management Dashboard
// Project-wise expense tracking and profitability analysis
// Shows project performance, budget tracking, and ROI analysis

interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date: string;
  end_date?: string;
  budget: number;
  spent_amount: number;
  remaining_budget: number;
  revenue: number;
  profit: number;
  profit_margin: number;
  completion_percentage: number;
  total_expenses: number;
  monthly_expenses: number;
  expense_categories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  team_size: number;
  client_name?: string;
  project_manager: string;
}

interface ProjectExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  employee_name: string;
  asset_name?: string;
  receipt_url?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ProjectPhase {
  id: string;
  name: string;
  budget: number;
  spent_amount: number;
  start_date: string;
  end_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  completion_percentage: number;
}

export const ProjectManagementDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'on_hold' | 'cancelled'>('all');

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/projects/management', {
        params: { period: selectedPeriod, status: filterStatus }
      });
      setProjects(response.data);
    } catch (error) {
      // Show empty state instead of mock data
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, filterStatus]);

  const fetchProjectExpenses = useCallback(async (projectId: string) => {
    try {
      const response = await apiClient.get(`/v1/projects/${projectId}/expenses`, {
        params: { period: selectedPeriod }
      });
      setProjectExpenses(response.data);
    } catch (error) {
      // Show empty state instead of mock data
      setProjectExpenses([]);
    }
  }, [selectedPeriod]);

  const fetchProjectPhases = useCallback(async (projectId: string) => {
    try {
      const response = await apiClient.get(`/v1/projects/${projectId}/phases`);
      setProjectPhases(response.data);
    } catch (error) {
      // Show empty state instead of mock data
      setProjectPhases([]);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectExpenses(selectedProject.id);
      fetchProjectPhases(selectedProject.id);
    }
  }, [selectedProject, fetchProjectExpenses, fetchProjectPhases]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.status.success;
      case 'completed': return colors.status.normal;
      case 'on_hold': return colors.status.warning;
      case 'cancelled': return colors.status.error;
      default: return colors.neutral[400];
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'on_hold': return 'On Hold';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return colors.status.success;
    if (profit === 0) return colors.neutral[500];
    return colors.status.error;
  };

  const getBudgetStatus = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 90) return { color: colors.status.error, text: 'Over Budget' };
    if (percentage >= 75) return { color: colors.status.warning, text: 'Near Budget' };
    return { color: colors.status.success, text: 'Within Budget' };
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
        <div style={{ color: '#6B7280' }}>Loading project management dashboard...</div>
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
            📋 Project Management
          </h1>
          <p style={{ color: colors.neutral[600], marginTop: spacing.xs }}>
            Track project expenses, budgets, and profitability
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/expenses')}
            icon="💰"
          >
            Expenses
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/app/expenses/project/create')}
            icon="➕"
          >
            New Project
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
        <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <Label>Period:</Label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              style={{
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                marginLeft: spacing.sm
              }}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div>
            <Label>Status:</Label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={{
                padding: spacing.sm,
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                marginLeft: spacing.sm
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Project Performance Overview */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        marginBottom: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          📊 Project Performance Overview
        </h3>
        
        <StatsGrid gap="lg">
          <div style={{ 
            ...cardStyles.base,
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
              <span className="status-dot status-dot-primary" />
              💰 Total Budget
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.primary,
              fontWeight: 700
            }}>
              ₹{projects.reduce((sum, project) => sum + project.budget, 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ 
            ...cardStyles.base,
            padding: spacing.xl,
            backgroundColor: 'white',
            border: `2px solid ${colors.status.success}`,
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
              <span className="status-dot status-dot-success" />
              📈 Total Revenue
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.success,
              fontWeight: 700
            }}>
              ₹{projects.reduce((sum, project) => sum + project.revenue, 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ 
            ...cardStyles.base,
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
              <span className="status-dot status-dot-warning" />
              💸 Total Expenses
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.warning,
              fontWeight: 700
            }}>
              ₹{projects.reduce((sum, project) => sum + project.spent_amount, 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ 
            ...cardStyles.base,
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
              <span className="status-dot status-dot-normal" />
              📋 Active Projects
            </div>
            <div style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.status.normal,
              fontWeight: 700
            }}>
              {projects.filter(project => project.status === 'active').length}
            </div>
          </div>
        </StatsGrid>
      </div>

      {/* Projects List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ 
          ...typography.subheader,
          marginBottom: spacing.lg,
          color: colors.neutral[900]
        }}>
          📋 Projects ({projects.length})
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {projects.map((project) => {
            const budgetStatus = getBudgetStatus(project.spent_amount, project.budget);
            
            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                style={{
                  padding: spacing.lg,
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: selectedProject?.id === project.id ? colors.primary + '10' : '#F9FAFB',
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
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: spacing.sm,
                      marginBottom: spacing.sm
                    }}>
                      <h4 style={{ 
                        ...typography.subheader,
                        margin: 0,
                        color: colors.neutral[900]
                      }}>
                        {project.name}
                      </h4>
                      <span style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        backgroundColor: colors.neutral[100],
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {project.code}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: spacing.md,
                      marginBottom: spacing.sm
                    }}>
                      <div>
                        <div style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          marginBottom: spacing.xs
                        }}>
                          Budget
                        </div>
                        <div style={{ 
                          ...typography.subheader,
                          color: colors.neutral[900],
                          fontWeight: 600
                        }}>
                          ₹{project.budget.toLocaleString('en-IN')}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          marginBottom: spacing.xs
                        }}>
                          Spent
                        </div>
                        <div style={{ 
                          ...typography.subheader,
                          color: colors.neutral[900],
                          fontWeight: 600
                        }}>
                          ₹{project.spent_amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          marginBottom: spacing.xs
                        }}>
                          Profit
                        </div>
                        <div style={{ 
                          ...typography.subheader,
                          color: getProfitColor(project.profit),
                          fontWeight: 600
                        }}>
                          ₹{project.profit.toLocaleString('en-IN')}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          marginBottom: spacing.xs
                        }}>
                          Completion
                        </div>
                        <div style={{ 
                          ...typography.subheader,
                          color: colors.neutral[900],
                          fontWeight: 600
                        }}>
                          {project.completion_percentage}%
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      gap: spacing.sm,
                      marginBottom: spacing.sm,
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ 
                        ...typography.bodySmall,
                        color: getStatusColor(project.status),
                        backgroundColor: getStatusColor(project.status) + '20',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {getStatusText(project.status)}
                      </span>
                      <span style={{ 
                        ...typography.bodySmall,
                        color: budgetStatus.color,
                        backgroundColor: budgetStatus.color + '20',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {budgetStatus.text}
                      </span>
                      <span style={{ 
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        backgroundColor: colors.neutral[100],
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        Team: {project.team_size} members
                      </span>
                      {project.client_name && (
                        <span style={{ 
                          ...typography.bodySmall,
                          color: colors.primary,
                          backgroundColor: colors.primary + '20',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          Client: {project.client_name}
                        </span>
                      )}
                    </div>

                    {/* Budget Progress Bar */}
                    <div style={{ marginTop: spacing.sm }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: spacing.xs
                      }}>
                        <span style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600]
                        }}>
                          Budget Utilization
                        </span>
                        <span style={{ 
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          fontWeight: 600
                        }}>
                          {((project.spent_amount / project.budget) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: '8px', 
                        backgroundColor: colors.neutral[200], 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${(project.spent_amount / project.budget) * 100}%`, 
                          height: '100%', 
                          backgroundColor: budgetStatus.color,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
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
                      {project.profit_margin.toFixed(1)}%
                    </div>
                    
                    <div style={{ 
                      ...typography.bodySmall,
                      color: colors.neutral[600],
                      fontSize: '12px'
                    }}>
                      Profit Margin
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {projects.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: colors.neutral[600]
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              No projects found
            </div>
            <div>
              Create your first project to start tracking expenses
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



