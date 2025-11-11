import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../providers/useAuth";
import { colors, typography, spacing } from "../lib/theme";
import axios from "axios";
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<{ success: boolean; data: DashboardStats }>('/v1/dashboard', {
        withCredentials: true,
      });
      
      if (response.data.success && response.data.data) {
        setStats(response.data.data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load dashboard stats');
      setError(error);
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 100%)`,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Modern Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${colors.neutral[200]}`,
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: `${spacing.lg} ${spacing.xl}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}>
              <Sparkles style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ 
                ...typography.header,
                fontSize: '24px',
                color: colors.neutral[900],
                margin: 0,
                fontWeight: 700
              }}>
                VOMS
              </h1>
              <p style={{ 
                ...typography.bodySmall,
                color: colors.neutral[600],
                margin: 0
              }}>
                Vehicle Operations Management System
              </p>
            </div>
          </div>
          
          {/* User Info & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            {/* Notifications */}
            <button style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: 'none',
              background: colors.neutral[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.neutral[200];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.neutral[100];
            }}>
              <Bell style={{ width: '18px', height: '18px', color: colors.neutral[600] }} />
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                background: colors.status.critical,
                borderRadius: '50%'
              }} />
            </button>

            {/* Settings */}
            <button style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: 'none',
              background: colors.neutral[100],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.neutral[200];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.neutral[100];
            }}>
              <Settings style={{ width: '18px', height: '18px', color: colors.neutral[600] }} />
            </button>

            {/* User Profile */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              padding: `${spacing.sm} ${spacing.md}`,
              background: colors.neutral[50],
              borderRadius: '12px',
              border: `1px solid ${colors.neutral[200]}`
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User style={{ width: '18px', height: '18px', color: 'white' }} />
              </div>
              <div>
                <p style={{ 
                  ...typography.label,
                  color: colors.neutral[900],
                  margin: 0,
                  fontWeight: 600
                }}>
                  {user?.name}
                </p>
                <p style={{ 
                  ...typography.bodySmall,
                  color: colors.neutral[600],
                  margin: 0,
                  fontSize: '11px'
                }}>
                  {user?.employee_id} • {getRoleDisplayName(user?.role || '')}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: `${spacing.sm} ${spacing.md}`,
                background: 'transparent',
                border: `1px solid ${colors.status.critical}`,
                borderRadius: '10px',
                color: colors.status.critical,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.status.critical;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = colors.status.critical;
              }}
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
              <span style={{ fontSize: '14px' }}>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: `${spacing.xl} ${spacing.xl}`
      }}>
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

        {/* Quick Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: spacing.lg,
          marginBottom: spacing.xl
        }}>
          <div style={{
            background: 'white',
            padding: spacing.lg,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: `1px solid ${colors.neutral[200]}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: `linear-gradient(135deg, ${colors.status.normal} 0%, ${colors.status.normal}80 100%)`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <p style={{ 
                ...typography.label,
                color: colors.neutral[600],
                margin: 0,
                fontSize: '12px'
              }}>
                Completed Today
              </p>
              <p style={{ 
                ...typography.header,
                fontSize: '24px',
                color: colors.neutral[900],
                margin: 0,
                fontWeight: 700
              }}>
                {loading ? '...' : (stats?.overall?.completed_today ?? 0)}
              </p>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: spacing.lg,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: `1px solid ${colors.neutral[200]}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: `linear-gradient(135deg, ${colors.status.warning} 0%, ${colors.status.warning}80 100%)`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <p style={{ 
                ...typography.label,
                color: colors.neutral[600],
                margin: 0,
                fontSize: '12px'
              }}>
                Pending Tasks
              </p>
              <p style={{ 
                ...typography.header,
                fontSize: '24px',
                color: colors.neutral[900],
                margin: 0,
                fontWeight: 700
              }}>
                {loading ? '...' : (stats?.overall?.pending_tasks ?? 0)}
              </p>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: spacing.lg,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: `1px solid ${colors.neutral[200]}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: `linear-gradient(135deg, ${colors.status.critical} 0%, ${colors.status.critical}80 100%)`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <p style={{ 
                ...typography.label,
                color: colors.neutral[600],
                margin: 0,
                fontSize: '12px'
              }}>
                Urgent Items
              </p>
              <p style={{ 
                ...typography.header,
                fontSize: '24px',
                color: colors.neutral[900],
                margin: 0,
                fontWeight: 700
              }}>
                {loading ? '...' : (stats?.overall?.urgent_items ?? 0)}
              </p>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: spacing.lg,
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: `1px solid ${colors.neutral[200]}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <p style={{ 
                ...typography.label,
                color: colors.neutral[600],
                margin: 0,
                fontSize: '12px'
              }}>
                Efficiency
              </p>
              <p style={{ 
                ...typography.header,
                fontSize: '24px',
                color: colors.neutral[900],
                margin: 0,
                fontWeight: 700
              }}>
                {loading ? '...' : (stats?.overall?.efficiency?.toFixed(0) ?? 0)}%
              </p>
            </div>
          </div>
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

        {/* Module Cards Grid */}
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
              🚀 Available Modules
            </h3>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <button style={{
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
              }}>
                <BarChart3 style={{ width: '16px', height: '16px' }} />
                Analytics
              </button>
              <button style={{
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
              }}>
                <Calendar style={{ width: '16px', height: '16px' }} />
                Calendar
              </button>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: spacing.lg
          }}>
            {accessibleModules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  onClick={() => navigate(module.path)}
                  style={{
                    background: 'white',
                    padding: spacing.xl,
                    borderRadius: '20px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                    border: `1px solid ${colors.neutral[200]}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
                  }}
                >
                  {/* Badges */}
                  <div style={{ 
                    position: 'absolute', 
                    top: spacing.md, 
                    right: spacing.md,
                    display: 'flex',
                    gap: spacing.sm
                  }}>
                    {module.isNew && (
                      <div style={{
                        padding: '4px 8px',
                        background: `linear-gradient(135deg, ${colors.status.normal} 0%, ${colors.status.normal}80 100%)`,
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 600
                      }}>
                        NEW
                      </div>
                    )}
                    {module.isPopular && (
                      <div style={{
                        padding: '4px 8px',
                        background: `linear-gradient(135deg, ${colors.status.warning} 0%, ${colors.status.warning}80 100%)`,
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 600
                      }}>
                        POPULAR
                      </div>
                    )}
                  </div>

                  {/* Icon */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: `linear-gradient(135deg, ${module.gradient})`,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.lg,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <div>
                    <h4 style={{ 
                      ...typography.subheader,
                      fontSize: '18px',
                      color: colors.neutral[900],
                      marginBottom: spacing.sm,
                      fontWeight: 600
                    }}>
                      {module.name}
                    </h4>
                    <p style={{ 
                      ...typography.body,
                      color: colors.neutral[600],
                      marginBottom: spacing.lg,
                      lineHeight: 1.5
                    }}>
                      {module.description}
                    </p>

                    {/* Stats */}
                    {module.stats && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `${spacing.sm} ${spacing.md}`,
                        background: colors.neutral[50],
                        borderRadius: '12px',
                        marginBottom: spacing.lg
                      }}>
                        <div>
                          <p style={{ 
                            ...typography.label,
                            color: colors.neutral[600],
                            margin: 0,
                            fontSize: '12px'
                          }}>
                            {module.stats.label}
                          </p>
                          <p style={{ 
                            ...typography.header,
                            fontSize: '20px',
                            color: colors.neutral[900],
                            margin: 0,
                            fontWeight: 700
                          }}>
                            {module.stats.value}
                          </p>
                        </div>
                        {module.stats.trend && (
                          <p style={{ 
                            ...typography.bodySmall,
                            color: colors.status.normal,
                            margin: 0,
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            {module.stats.trend}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      color: colors.primary,
                      fontWeight: 600,
                      fontSize: '14px'
                    }}>
                      <span>Open Module</span>
                      <ArrowRight style={{ width: '16px', height: '16px' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* No Access Message */}
        {accessibleModules.length === 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${colors.status.warning}20 0%, ${colors.status.warning}10 100%)`,
            border: `1px solid ${colors.status.warning}`,
            borderRadius: '16px',
            padding: spacing.xl,
            textAlign: 'center'
          }}>
            <AlertCircle style={{ 
              width: '48px', 
              height: '48px', 
              color: colors.status.warning,
              margin: '0 auto',
              marginBottom: spacing.md
            }} />
            <h3 style={{ 
              ...typography.subheader,
              color: colors.status.warning,
              marginBottom: spacing.sm
            }}>
              No Module Access
            </h3>
            <p style={{ 
              ...typography.body,
              color: colors.neutral[700],
              margin: 0
            }}>
              You don't have access to any modules. Please contact your administrator to get the necessary permissions.
            </p>
          </div>
        )}

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
            <button style={{
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
            }}>
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
      </main>
    </div>
  );
}