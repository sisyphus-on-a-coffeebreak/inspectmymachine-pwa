import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../providers/useAuth";
import { colors, typography, spacing } from "../lib/theme";
import { StatCard } from "../components/ui/StatCard";
import { AnomalyAlert } from "../components/ui/AnomalyAlert";
import { SkeletonCard } from "../components/ui/SkeletonLoader";
import { useDashboardStats } from "../lib/queries";
import { 
  ClipboardList, 
  FileText, 
  DollarSign, 
  Warehouse,
  LogOut,
  User,
  Bell,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  BarChart3,
  Calendar,
  Users,
  UserCog
} from "lucide-react";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
  gradient: string;
  iconColor: string;
  stats?: {
    label: string;
    value: string;
    trend?: string;
  };
  isNew?: boolean;
  isPopular?: boolean;
}

const getModules = (stats: DashboardStats | null): Module[] => [
  {
    id: "gate-pass",
    name: "Gate Passes",
    description: "Manage visitor and vehicle gate passes with QR validation",
    icon: ClipboardList,
    path: "/app/gate-pass",
    roles: ["super_admin", "admin", "guard", "clerk"],
    gradient: "from-blue-500 to-blue-600",
    iconColor: "text-white",
    stats: {
      label: "Active Passes",
      value: stats?.gate_pass?.active_passes?.toString() || "0",
      trend: stats?.gate_pass?.trend || "No data"
    },
    isPopular: true
  },
  {
    id: "inspections",
    name: "Inspections",
    description: "Comprehensive vehicle inspection reports and VIR generation",
    icon: FileText,
    path: "/app/inspections",
    roles: ["super_admin", "admin", "inspector"],
    gradient: "from-green-500 to-green-600",
    iconColor: "text-white",
    stats: {
      label: "Completed Today",
      value: stats?.inspection?.completed_today?.toString() || "0",
      trend: stats?.inspection?.trend || "No data"
    },
    isNew: true
  },
  {
    id: "expenses",
    name: "Expenses",
    description: "Submit expenses, track advances, and manage reimbursements",
    icon: DollarSign,
    path: "/app/expenses",
    roles: ["super_admin", "admin", "supervisor", "inspector", "guard", "clerk"],
    gradient: "from-yellow-500 to-orange-500",
    iconColor: "text-white",
    stats: {
      label: "Pending Approval",
      value: stats?.expense?.pending_approval?.toString() || "0",
      trend: stats?.expense?.urgent ? `${stats.expense.urgent} urgent` : "No urgent"
    }
  },
  {
    id: "stockyard",
    name: "Stockyard",
    description: "Inventory management and stockyard operations",
    icon: Warehouse,
    path: "/app/stockyard",
    roles: ["super_admin", "admin"],
    gradient: "from-purple-500 to-purple-600",
    iconColor: "text-white",
    stats: {
      label: "Active Items",
      value: "0", // TODO: Add stockyard stats when available
      trend: "No data"
    }
  },
  {
    id: "user-management",
    name: "User Management",
    description: "Manage users, roles, and permissions",
    icon: UserCog,
    path: "/app/admin/users",
    roles: ["super_admin", "admin"],
    gradient: "from-indigo-500 to-indigo-600",
    iconColor: "text-white",
    stats: {
      label: "Total Users",
      value: stats?.user?.total_users?.toString() || "0",
      trend: stats?.user?.new_this_month ? `${stats.user.new_this_month} new this month` : "No new users"
    }
  },
];

interface KanbanItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  assignee: string;
  status: string;
  time: string;
  url: string;
  priority?: string;
}

interface DashboardStats {
  gate_pass: {
    active_passes: number;
    completed_today: number;
    trend: string;
  };
  inspection: {
    completed_today: number;
    pending: number;
    trend: string;
    critical_issues: number;
  };
  expense: {
    pending_approval: number;
    urgent: number;
  };
  user: {
    total_users: number;
    new_this_month: number;
  };
  overall: {
    completed_today: number;
    pending_tasks: number;
    urgent_items: number;
    efficiency: number;
  };
  recent_activity: Array<{
    action: string;
    user: string;
    time: string;
    type: string;
  }>;
  kanban: {
    completed_today: KanbanItem[];
    pending_tasks: KanbanItem[];
    urgent_items: KanbanItem[];
  };
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  // Use React Query for dashboard stats
  const { data: stats, isLoading: loading, error: queryError } = useDashboardStats();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const modules = getModules(stats);
  const accessibleModules = modules.filter((module) =>
    module.roles.includes(user?.role || "")
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Administrator",
      supervisor: "Supervisor",
      inspector: "Inspector",
      guard: "Security Guard",
      clerk: "Clerk"
    };
    return roleMap[role] || role;
  };

  // Error handling - convert React Query error to Error type if needed
  const error = queryError ? (queryError instanceof Error ? queryError : new Error('Failed to load dashboard stats')) : null;

  return (
    <div style={{ 
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Main Content - Header removed, using AppLayout */}
        {/* Welcome Section */}
        <div style={{ marginBottom: spacing.xl }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <h2 style={{ 
              ...typography.header,
              fontSize: '32px',
              color: colors.neutral[900],
              margin: 0,
              fontWeight: 700
            }}>
              {getGreeting()}, {user?.name?.split(" ")[0]}! 👋
            </h2>
            <div style={{
              padding: '4px 12px',
              background: `linear-gradient(135deg, ${colors.status.normal} 0%, ${colors.status.normal}80 100%)`,
              borderRadius: '20px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <p style={{ 
            ...typography.body,
            color: colors.neutral[600],
            fontSize: '16px',
            margin: 0
          }}>
            Here's what's happening in your workspace today
          </p>
        </div>

        {/* Anomaly Alerts */}
        {stats && stats.overall && stats.overall.urgent_items > 0 && (
          <AnomalyAlert
            title={`${stats.overall.urgent_items} Urgent Item${stats.overall.urgent_items > 1 ? 's' : ''} Require Attention`}
            description="Critical issues detected across modules. Review and take action."
            severity="critical"
            actions={[
              {
                label: 'View Urgent Items',
                onClick: () => navigate('/dashboard?filter=urgent'),
                variant: 'primary',
              },
            ]}
            dismissible={false}
          />
        )}
        {stats && stats.expense && stats.expense.pending_approval > 0 && stats.expense.pending_approval > 5 && (
          <AnomalyAlert
            title={`${stats.expense.pending_approval} Expenses Pending Approval`}
            description="Multiple expense approvals are waiting for review."
            severity="warning"
            actions={[
              {
                label: 'Review Expenses',
                onClick: () => navigate('/app/expenses/approval'),
                variant: 'primary',
              },
            ]}
          />
        )}

        {/* Quick Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: spacing.lg,
          marginBottom: spacing.xl
        }}>
          <StatCard
            label="Completed Today"
            value={loading ? '...' : (stats?.overall?.completed_today ?? 0)}
            icon={<CheckCircle size={20} />}
            color={colors.success[500]}
            loading={loading}
            href="/dashboard?filter=completed"
          />
          <StatCard
            label="Pending Tasks"
            value={loading ? '...' : (stats?.overall?.pending_tasks ?? 0)}
            icon={<Clock size={20} />}
            color={colors.warning[500]}
            loading={loading}
            href="/dashboard?filter=pending"
          />
          <StatCard
            label="Urgent Items"
            value={loading ? '...' : (stats?.overall?.urgent_items ?? 0)}
            icon={<AlertCircle size={20} />}
            color={colors.error[500]}
            loading={loading}
            href="/dashboard?filter=urgent"
          />
          <StatCard
            label="Efficiency"
            value={loading ? '...' : `${stats?.overall?.efficiency?.toFixed(0) ?? 0}%`}
            icon={<TrendingUp size={20} />}
            color={colors.primary}
            loading={loading}
          />
        </div>

        {/* Kanban Board */}
        {stats?.kanban && (
          <div style={{ marginBottom: spacing.xl }}>
            <h3 style={{ 
              ...typography.subheader,
              fontSize: '20px',
              color: colors.neutral[900],
              marginBottom: spacing.lg,
              fontWeight: 600
            }}>
              📋 Task Board
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: spacing.lg
            }}>
              {/* Completed Today Column */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: spacing.lg,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.neutral[200]}`,
                minHeight: '400px'
              }}>
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: colors.status.normal }} />
                    <h4 style={{ 
                      ...typography.subheader,
                      fontSize: '16px',
                      color: colors.neutral[900],
                      margin: 0,
                      fontWeight: 600
                    }}>
                      Completed Today
                    </h4>
                    <span style={{
                      padding: '2px 8px',
                      background: colors.status.normal + '20',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: colors.status.normal,
                      fontWeight: 600
                    }}>
                      {stats.kanban.completed_today?.length || 0}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, maxHeight: '350px', overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.neutral[600] }}>
                      Loading...
                    </div>
                  ) : stats.kanban.completed_today && stats.kanban.completed_today.length > 0 ? (
                    stats.kanban.completed_today.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(item.url)}
                        style={{
                          padding: spacing.md,
                          background: colors.neutral[50],
                          borderRadius: '12px',
                          border: `1px solid ${colors.neutral[200]}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.neutral[100];
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colors.neutral[50];
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <p style={{ 
                          ...typography.label,
                          fontSize: '14px',
                          color: colors.neutral[900],
                          margin: 0,
                          marginBottom: spacing.xs,
                          fontWeight: 600
                        }}>
                          {item.title}
                        </p>
                        <p style={{ 
                          ...typography.bodySmall,
                          fontSize: '12px',
                          color: colors.neutral[600],
                          margin: 0,
                          marginBottom: spacing.xs
                        }}>
                          {item.subtitle}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
                          <span style={{ 
                            ...typography.bodySmall,
                            fontSize: '11px',
                            color: colors.neutral[500]
                          }}>
                            {item.assignee}
                          </span>
                          <span style={{ 
                            ...typography.bodySmall,
                            fontSize: '11px',
                            color: colors.neutral[500]
                          }}>
                            {item.time}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.neutral[600] }}>
                      No items completed today
                    </div>
                  )}
                </div>
              </div>

              {/* Pending Tasks Column */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: spacing.lg,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.neutral[200]}`,
                minHeight: '400px'
              }}>
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                    <Clock style={{ width: '20px', height: '20px', color: colors.status.warning }} />
                    <h4 style={{ 
                      ...typography.subheader,
                      fontSize: '16px',
                      color: colors.neutral[900],
                      margin: 0,
                      fontWeight: 600
                    }}>
                      Pending Tasks
                    </h4>
                    <span style={{
                      padding: '2px 8px',
                      background: colors.status.warning + '20',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: colors.status.warning,
                      fontWeight: 600
                    }}>
                      {stats.kanban.pending_tasks?.length || 0}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, maxHeight: '350px', overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.neutral[600] }}>
                      Loading...
                    </div>
                  ) : stats.kanban.pending_tasks && stats.kanban.pending_tasks.length > 0 ? (
                    stats.kanban.pending_tasks.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(item.url)}
                        style={{
                          padding: spacing.md,
                          background: colors.neutral[50],
                          borderRadius: '12px',
                          border: `1px solid ${colors.neutral[200]}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.neutral[100];
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colors.neutral[50];
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <p style={{ 
                          ...typography.label,
                          fontSize: '14px',
                          color: colors.neutral[900],
                          margin: 0,
                          marginBottom: spacing.xs,
                          fontWeight: 600
                        }}>
                          {item.title}
                        </p>
                        <p style={{ 
                          ...typography.bodySmall,
                          fontSize: '12px',
                          color: colors.neutral[600],
                          margin: 0,
                          marginBottom: spacing.xs
                        }}>
                          {item.subtitle}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
                          <span style={{ 
                            ...typography.bodySmall,
                            fontSize: '11px',
                            color: colors.neutral[500]
                          }}>
                            {item.assignee}
                          </span>
                          <span style={{ 
                            ...typography.bodySmall,
                            fontSize: '11px',
                            color: colors.neutral[500]
                          }}>
                            {item.time}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.neutral[600] }}>
                      No pending tasks
                    </div>
                  )}
                </div>
              </div>

              {/* Urgent Items Column */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: spacing.lg,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.status.critical}`,
                minHeight: '400px'
              }}>
                <div style={{ marginBottom: spacing.md }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
                    <AlertCircle style={{ width: '20px', height: '20px', color: colors.status.critical }} />
                    <h4 style={{ 
                      ...typography.subheader,
                      fontSize: '16px',
                      color: colors.neutral[900],
                      margin: 0,
                      fontWeight: 600
                    }}>
                      Urgent Items
                    </h4>
                    <span style={{
                      padding: '2px 8px',
                      background: colors.status.critical + '20',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: colors.status.critical,
                      fontWeight: 600
                    }}>
                      {stats.kanban.urgent_items?.length || 0}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, maxHeight: '350px', overflowY: 'auto' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.neutral[600] }}>
                      Loading...
                    </div>
                  ) : stats.kanban.urgent_items && stats.kanban.urgent_items.length > 0 ? (
                    stats.kanban.urgent_items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(item.url)}
                        style={{
                          padding: spacing.md,
                          background: colors.status.critical + '10',
                          borderRadius: '12px',
                          border: `1px solid ${colors.status.critical}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.status.critical + '20';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = colors.status.critical + '10';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <p style={{ 
                          ...typography.label,
                          fontSize: '14px',
                          color: colors.neutral[900],
                          margin: 0,
                          marginBottom: spacing.xs,
                          fontWeight: 600
                        }}>
                          {item.title}
                        </p>
                        <p style={{ 
                          ...typography.bodySmall,
                          fontSize: '12px',
                          color: colors.neutral[600],
                          margin: 0,
                          marginBottom: spacing.xs
                        }}>
                          {item.subtitle}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs }}>
                          <span style={{ 
                            ...typography.bodySmall,
                            fontSize: '11px',
                            color: colors.neutral[500]
                          }}>
                            {item.assignee}
                          </span>
                          <span style={{ 
                            ...typography.bodySmall,
                            fontSize: '11px',
                            color: colors.status.critical,
                            fontWeight: 600
                          }}>
                            {item.time}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.neutral[600] }}>
                      No urgent items
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Access Modules */}
        <div style={{ marginBottom: spacing.xl }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.lg
          }}>
            <h3 style={{
              ...typography.subheader,
              fontSize: '20px',
              color: colors.neutral[900],
              margin: 0,
              fontWeight: 600
            }}>
              🚀 Quick Access
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: spacing.lg
          }}>
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : accessibleModules.length > 0 ? (
              accessibleModules.map((module) => (
                <div
                  key={module.id}
                  onClick={() => navigate(module.path)}
                  style={{
                    background: 'white',
                    padding: spacing.xl,
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: `1px solid ${colors.neutral[200]}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                    e.currentTarget.style.borderColor = colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = colors.neutral[200];
                  }}
                >
                  {/* Badges */}
                  {(module.isNew || module.isPopular) && (
                    <div style={{ position: 'absolute', top: spacing.md, right: spacing.md }}>
                      {module.isNew && (
                        <span style={{
                          padding: '4px 8px',
                          background: colors.success[500],
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginRight: module.isPopular ? spacing.xs : 0
                        }}>
                          New
                        </span>
                      )}
                      {module.isPopular && (
                        <span style={{
                          padding: '4px 8px',
                          background: colors.warning[500],
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          Popular
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: `linear-gradient(135deg, ${module.gradient.includes('blue') ? '#3b82f6' : module.gradient.includes('green') ? '#10b981' : module.gradient.includes('yellow') ? '#f59e0b' : module.gradient.includes('purple') ? '#8b5cf6' : '#6366f1'} 0%, ${module.gradient.includes('blue') ? '#2563eb' : module.gradient.includes('green') ? '#059669' : module.gradient.includes('yellow') ? '#d97706' : module.gradient.includes('purple') ? '#7c3aed' : '#4f46e5'} 100%)`,
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <module.icon style={{ width: '28px', height: '28px', color: 'white' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        ...typography.subheader,
                        fontSize: '18px',
                        margin: 0,
                        marginBottom: spacing.xs,
                        fontWeight: 600,
                        color: colors.neutral[900]
                      }}>
                        {module.name}
                      </h4>
                      <p style={{
                        ...typography.bodySmall,
                        color: colors.neutral[600],
                        margin: 0,
                        lineHeight: 1.4
                      }}>
                        {module.description}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  {module.stats && (
                    <div style={{
                      padding: spacing.md,
                      background: colors.neutral[50],
                      borderRadius: '10px',
                      marginBottom: spacing.md
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          ...typography.bodySmall,
                          color: colors.neutral[600],
                          fontSize: '12px'
                        }}>
                          {module.stats.label}
                        </span>
                        <span style={{
                          ...typography.subheader,
                          color: colors.neutral[900],
                          fontSize: '20px',
                          fontWeight: 700
                        }}>
                          {module.stats.value}
                        </span>
                      </div>
                      {module.stats.trend && (
                        <p style={{
                          ...typography.bodySmall,
                          color: colors.neutral[500],
                          fontSize: '11px',
                          margin: 0,
                          marginTop: spacing.xs
                        }}>
                          {module.stats.trend}
                        </p>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, color: colors.primary, fontWeight: 500 }}>
                    <span>Open Module</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: spacing.xl,
                color: colors.neutral[600],
                background: colors.neutral[50],
                borderRadius: '16px'
              }}>
                No modules available for your role. Contact your administrator.
              </div>
            )}
          </div>
        </div>

        {/* Cross-Module Reports */}
        <div style={{ marginBottom: spacing.xl }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.lg
          }}>
            <h3 style={{
              ...typography.subheader,
              fontSize: '20px',
              color: colors.neutral[900],
              margin: 0,
              fontWeight: 600
            }}>
              📊 Cross-Module Reports & Analytics
            </h3>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: spacing.lg
          }}>
            {/* Gate Pass Reports */}
            {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'guard' || user?.role === 'clerk') && (
              <div
                onClick={() => navigate('/app/gate-pass/reports')}
                style={{
                  background: 'white',
                  padding: spacing.xl,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = colors.neutral[200];
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ClipboardList style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ ...typography.subheader, fontSize: '18px', margin: 0, fontWeight: 600 }}>
                      Gate Pass Reports
                    </h4>
                    <p style={{ ...typography.bodySmall, color: colors.neutral[600], margin: 0 }}>
                      Visitor & vehicle pass analytics
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, color: colors.primary, fontWeight: 500 }}>
                  <span>View Reports</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            )}

            {/* Inspection Reports */}
            {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'inspector') && (
              <div
                onClick={() => navigate('/app/inspections/reports')}
                style={{
                  background: 'white',
                  padding: spacing.xl,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = colors.neutral[200];
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: `linear-gradient(135deg, #10b981 0%, #059669 100%)`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FileText style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ ...typography.subheader, fontSize: '18px', margin: 0, fontWeight: 600 }}>
                      Inspection Reports
                    </h4>
                    <p style={{ ...typography.bodySmall, color: colors.neutral[600], margin: 0 }}>
                      Vehicle inspection analytics & VIR
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, color: colors.primary, fontWeight: 500 }}>
                  <span>View Reports</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            )}

            {/* Expense Reports */}
            {(user?.role === 'super_admin' || user?.role === 'admin') && (
              <div
                onClick={() => navigate('/app/expenses/reports')}
                style={{
                  background: 'white',
                  padding: spacing.xl,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = colors.neutral[200];
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <DollarSign style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ ...typography.subheader, fontSize: '18px', margin: 0, fontWeight: 600 }}>
                      Expense Reports
                    </h4>
                    <p style={{ ...typography.bodySmall, color: colors.neutral[600], margin: 0 }}>
                      Financial analytics & cashflow
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, color: colors.primary, fontWeight: 500 }}>
                  <span>View Reports</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            )}

            {/* Stockyard Analytics */}
            {(user?.role === 'super_admin' || user?.role === 'admin') && (
              <div
                onClick={() => navigate('/app/stockyard')}
                style={{
                  background: 'white',
                  padding: spacing.xl,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = colors.neutral[200];
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: `linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Warehouse style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ ...typography.subheader, fontSize: '18px', margin: 0, fontWeight: 600 }}>
                      Stockyard Analytics
                    </h4>
                    <p style={{ ...typography.bodySmall, color: colors.neutral[600], margin: 0 }}>
                      Inventory & yard operations
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, color: colors.primary, fontWeight: 500 }}>
                  <span>View Dashboard</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            )}

            {/* User Activity Reports */}
            {(user?.role === 'super_admin' || user?.role === 'admin') && (
              <div
                onClick={() => navigate('/app/admin/users/activity')}
                style={{
                  background: 'white',
                  padding: spacing.xl,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.borderColor = colors.neutral[200];
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: `linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ ...typography.subheader, fontSize: '18px', margin: 0, fontWeight: 600 }}>
                      User Activity Reports
                    </h4>
                    <p style={{ ...typography.bodySmall, color: colors.neutral[600], margin: 0 }}>
                      System usage & activity logs
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, color: colors.primary, fontWeight: 500 }}>
                  <span>View Reports</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: spacing.xl,
          boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          border: `1px solid ${colors.neutral[200]}`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: spacing.lg
          }}>
            <h3 style={{ 
              ...typography.subheader,
              fontSize: '18px',
              color: colors.neutral[900],
              margin: 0,
              fontWeight: 600
            }}>
              📈 Recent Activity
            </h3>
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.sm} ${spacing.md}`,
                background: colors.neutral[100],
                border: 'none',
                borderRadius: '10px',
                color: colors.neutral[700],
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
              aria-label="View all recent activity"
            >
              <Users style={{ width: '16px', height: '16px' }} />
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.neutral[600] }}>
                Loading recent activity...
              </div>
            ) : stats?.recent_activity && stats.recent_activity.length > 0 ? (
              stats.recent_activity.map((activity, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                background: colors.neutral[50],
                borderRadius: '12px',
                border: `1px solid ${colors.neutral[200]}`
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: activity.type === 'success' ? colors.status.normal : 
                             activity.type === 'warning' ? colors.status.warning : colors.primary,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle style={{ width: '16px', height: '16px', color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    ...typography.body,
                    color: colors.neutral[900],
                    margin: 0,
                    fontWeight: 500
                  }}>
                    {activity.action}
                  </p>
                  <p style={{ 
                    ...typography.bodySmall,
                    color: colors.neutral[600],
                    margin: 0,
                    fontSize: '12px'
                  }}>
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.neutral[600] }}>
                No recent activity
              </div>
            )}
          </div>
        </div>
    </div>
  );
}