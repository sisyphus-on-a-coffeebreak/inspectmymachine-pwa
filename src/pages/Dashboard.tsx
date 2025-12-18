import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/useAuth";
import { colors, typography, spacing } from "../lib/theme";
import { AnomalyAlert } from "../components/ui/AnomalyAlert";
import { useDashboardStats } from "../lib/queries";
import { useRealtimeDashboard } from "../hooks/useRealtimeDashboard";
import { 
  ClipboardList, 
  FileText, 
  DollarSign, 
  Warehouse,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Users,
  UserCog
} from "lucide-react";
// import { BarChart } from "../components/ui/charts"; // Not used in Dashboard
import { DashboardWidgetsContainer } from "../components/dashboard/DashboardWidgetsContainer";
// import { RealtimeIndicator } from "../components/dashboard/RealtimeIndicator";
import { 
  getDefaultLayout, 
  loadWidgetLayout, 
  saveWidgetLayout 
} from "../lib/widgetRegistry";
import type { WidgetConfig } from "../types/widgets";
// Import widgets to register them
import "../components/dashboard/widgets";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  // Use React Query for dashboard stats
  const { data: stats, isLoading: loading } = useDashboardStats();
  
  // Real-time updates
  const realtime = useRealtimeDashboard({
    enabled: true,
    useWebSocket: true,
    pollingInterval: 30000, // Fallback to 30s polling if WebSocket unavailable
  });
  
  // Widget system state
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    // Try to load saved layout, otherwise use default
    const saved = loadWidgetLayout(user?.id?.toString());
    return saved || getDefaultLayout(user?.role);
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getRoleBasedSubtitle = (role?: string): string => {
    if (!role) return 'Operations Dashboard';
    switch (role) {
      case 'guard':
        return 'Gate Duty Dashboard';
      case 'inspector':
        return 'Inspection Dashboard';
      case 'supervisor':
        return 'Supervisor Dashboard';
      case 'admin':
      case 'super_admin':
        return 'Administration Dashboard';
      default:
        return 'Operations Dashboard';
    }
  };

  // Memoize widget data to prevent recreation on every render (fixes infinite loop in charts)
  const widgetData = useMemo(() => ({
    stats,
    contextData: {
      pendingApprovals: stats?.expense?.pending_approval,
      urgentItems: stats?.overall?.urgent_items,
      activePasses: stats?.gate_pass?.active_passes,
    },
    chartData: stats ? [
      {
        name: 'Gate Passes',
        active: stats.gate_pass?.active_passes || 0,
        completed: stats.gate_pass?.completed_today || 0,
      },
      {
        name: 'Inspections',
        active: stats.inspection?.pending || 0,
        completed: stats.inspection?.completed_today || 0,
      },
      {
        name: 'Expenses',
        active: stats.expense?.pending_approval || 0,
        completed: 0,
      },
    ] : [],
    kanban: stats?.kanban,
  }), [stats]);

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
              fontSize: 'clamp(24px, 5vw, 32px)', // Responsive: 24px mobile, scales up to 32px
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
              fontSize: 'clamp(11px, 2vw, 12px)', // Responsive: 11px mobile, scales up to 12px
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
            {getRoleBasedSubtitle(user?.role)}
          </p>
        </div>

        {/* Real-time Indicator - Temporarily simplified */}
        {realtime && (
          <div style={{ 
            marginBottom: spacing.md,
            padding: spacing.sm,
            backgroundColor: realtime.isConnected ? colors.success[50] : colors.neutral[50],
            borderRadius: '8px',
            border: `1px solid ${realtime.isConnected ? colors.success[200] : colors.neutral[200]}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <span style={{ ...typography.bodySmall, color: realtime.isConnected ? colors.success[700] : colors.neutral[700] }}>
              {realtime.isConnecting ? 'Connecting...' : realtime.isConnected ? 'Live Updates Active' : 'Using polling mode'}
            </span>
          </div>
        )}

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
                onClick: () => navigate('/app/approvals?tab=expense'),
                variant: 'primary',
              },
            ]}
          />
        )}

        {/* Role-specific widgets are now handled by the widget system */}

        {/* Customizable Widgets */}
        <DashboardWidgetsContainer
          widgets={widgets}
          data={widgetData}
          onWidgetsChange={setWidgets}
          onSave={(savedWidgets) => {
            saveWidgetLayout(savedWidgets, user?.id?.toString());
          }}
        />

        {/* Kanban Board (Legacy - can be removed once fully migrated to widgets) */}
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
            <div 
              className="kanban-board-container"
              style={{ 
                display: 'flex',
                overflowX: 'auto',
                gap: spacing.lg,
                paddingBottom: spacing.md,
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x mandatory'
              }}
            >
              {/* Completed Today Column */}
              <div 
                className="kanban-column"
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: spacing.lg,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.neutral[200]}`,
                  minHeight: '400px',
                  // Mobile: fixed width for horizontal scroll
                  minWidth: '280px',
                  maxWidth: '280px',
                  scrollSnapAlign: 'start',
                  flexShrink: 0
                }}
              >
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
                      fontSize: 'clamp(11px, 2vw, 12px)', // Responsive text size
                      color: colors.status.normal,
                      fontWeight: 600
                    }}>
                      {stats.kanban.completed_today?.length || 0}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.neutral[600] }}>
                      Loading...
                    </div>
                  ) : stats.kanban.completed_today && stats.kanban.completed_today.length > 0 ? (
                    stats.kanban.completed_today.map((item: KanbanItem) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(item.url)}
                        className="kanban-card"
                        style={{
                          padding: spacing.md,
                          background: colors.neutral[50],
                          borderRadius: '12px',
                          border: `1px solid ${colors.neutral[200]}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minHeight: '44px', // Touch target minimum
                          touchAction: 'manipulation' // Better touch response
                        }}
                        onMouseEnter={(e) => {
                          // Only on hover-capable devices
                          if (window.matchMedia('(hover: hover)').matches) {
                            e.currentTarget.style.background = colors.neutral[100];
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (window.matchMedia('(hover: hover)').matches) {
                            e.currentTarget.style.background = colors.neutral[50];
                            e.currentTarget.style.transform = 'translateX(0)';
                          }
                        }}
                        onTouchStart={(e) => {
                          // Touch feedback
                          e.currentTarget.style.background = colors.neutral[100];
                          e.currentTarget.style.transform = 'scale(0.98)';
                        }}
                        onTouchEnd={(e) => {
                          // Reset after touch
                          setTimeout(() => {
                            e.currentTarget.style.background = colors.neutral[50];
                            e.currentTarget.style.transform = 'scale(1)';
                          }, 150);
                        }}
                      >
                        <p style={{ 
                          ...typography.label,
                          fontSize: 'clamp(14px, 2.5vw, 16px)', // Responsive: minimum 14px for readability
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
                            fontSize: 'clamp(12px, 2vw, 13px)', // Responsive: minimum 12px for readability
                            color: colors.neutral[500]
                          }}>
                            {item.assignee}
                          </span>
                          <span style={{ 
                            ...typography.bodySmall,
                            fontSize: 'clamp(12px, 2vw, 13px)', // Responsive: minimum 12px for readability
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
              <div 
                className="kanban-column"
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: spacing.lg,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.neutral[200]}`,
                  minHeight: '400px',
                  // Mobile: fixed width for horizontal scroll
                  minWidth: '280px',
                  maxWidth: '280px',
                  scrollSnapAlign: 'start',
                  flexShrink: 0
                }}
              >
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
                      fontSize: 'clamp(11px, 2vw, 12px)', // Responsive text size
                      color: colors.status.warning,
                      fontWeight: 600
                    }}>
                      {stats.kanban.pending_tasks?.length || 0}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.neutral[600] }}>
                      Loading...
                    </div>
                  ) : stats.kanban.pending_tasks && stats.kanban.pending_tasks.length > 0 ? (
                    stats.kanban.pending_tasks.map((item: KanbanItem) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(item.url)}
                        className="kanban-card"
                        style={{
                          padding: spacing.md,
                          background: colors.neutral[50],
                          borderRadius: '12px',
                          border: `1px solid ${colors.neutral[200]}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minHeight: '44px', // Touch target minimum
                          touchAction: 'manipulation' // Better touch response
                        }}
                        onMouseEnter={(e) => {
                          // Only on hover-capable devices
                          if (window.matchMedia('(hover: hover)').matches) {
                            e.currentTarget.style.background = colors.neutral[100];
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (window.matchMedia('(hover: hover)').matches) {
                            e.currentTarget.style.background = colors.neutral[50];
                            e.currentTarget.style.transform = 'translateX(0)';
                          }
                        }}
                        onTouchStart={(e) => {
                          // Touch feedback
                          e.currentTarget.style.background = colors.neutral[100];
                          e.currentTarget.style.transform = 'scale(0.98)';
                        }}
                        onTouchEnd={(e) => {
                          // Reset after touch
                          setTimeout(() => {
                            e.currentTarget.style.background = colors.neutral[50];
                            e.currentTarget.style.transform = 'scale(1)';
                          }, 150);
                        }}
                      >
                        <p style={{ 
                          ...typography.label,
                          fontSize: 'clamp(14px, 2.5vw, 16px)', // Responsive: minimum 14px for readability
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
                            fontSize: 'clamp(12px, 2vw, 13px)', // Responsive: minimum 12px for readability
                            color: colors.neutral[500]
                          }}>
                            {item.assignee}
                          </span>
                          <span style={{ 
                            ...typography.bodySmall,
                            fontSize: 'clamp(12px, 2vw, 13px)', // Responsive: minimum 12px for readability
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
              <div 
                className="kanban-column"
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: spacing.lg,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: `1px solid ${colors.status.critical}`,
                  minHeight: '400px',
                  // Mobile: fixed width for horizontal scroll
                  minWidth: '280px',
                  maxWidth: '280px',
                  scrollSnapAlign: 'start',
                  flexShrink: 0
                }}
              >
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
                      fontSize: 'clamp(11px, 2vw, 12px)', // Responsive text size
                      color: colors.status.critical,
                      fontWeight: 600
                    }}>
                      {stats.kanban.urgent_items?.length || 0}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: spacing.lg, color: colors.neutral[600] }}>
                      Loading...
                    </div>
                  ) : stats.kanban.urgent_items && stats.kanban.urgent_items.length > 0 ? (
                    stats.kanban.urgent_items.map((item: KanbanItem) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(item.url)}
                        className="kanban-card"
                        style={{
                          padding: spacing.md,
                          background: colors.status.critical + '10',
                          borderRadius: '12px',
                          border: `1px solid ${colors.status.critical}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minHeight: '44px', // Touch target minimum
                          touchAction: 'manipulation' // Better touch response
                        }}
                        onMouseEnter={(e) => {
                          // Only on hover-capable devices
                          if (window.matchMedia('(hover: hover)').matches) {
                            e.currentTarget.style.background = colors.status.critical + '20';
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (window.matchMedia('(hover: hover)').matches) {
                            e.currentTarget.style.background = colors.status.critical + '10';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }
                        }}
                        onTouchStart={(e) => {
                          // Touch feedback
                          e.currentTarget.style.background = colors.status.critical + '20';
                          e.currentTarget.style.transform = 'scale(0.98)';
                        }}
                        onTouchEnd={(e) => {
                          // Reset after touch
                          setTimeout(() => {
                            e.currentTarget.style.background = colors.status.critical + '10';
                            e.currentTarget.style.transform = 'scale(1)';
                          }, 150);
                        }}
                      >
                        <p style={{ 
                          ...typography.label,
                          fontSize: 'clamp(14px, 2.5vw, 16px)', // Responsive: minimum 14px for readability
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
                            fontSize: 'clamp(12px, 2vw, 13px)', // Responsive: minimum 12px for readability
                            color: colors.neutral[500]
                          }}>
                            {item.assignee}
                          </span>
                          <span style={{ 
                            ...typography.bodySmall,
                            fontSize: 'clamp(12px, 2vw, 13px)', // Responsive: minimum 12px for readability
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
            
            {/* Responsive styles for kanban board */}
            <style>{`
              /* Mobile: Horizontal scroll (0-767px) */
              @media (max-width: 767px) {
                .kanban-board-container {
                  display: flex !important;
                  overflow-x: auto !important;
                  scroll-snap-type: x mandatory;
                  -webkit-overflow-scrolling: touch;
                }
                .kanban-column {
                  min-width: 280px !important;
                  max-width: 280px !important;
                  scroll-snap-align: start;
                  flex-shrink: 0;
                }
              }
              
              /* Tablet and Desktop: Grid layout (768px+) */
              @media (min-width: 768px) {
                .kanban-board-container {
                  display: grid !important;
                  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
                  overflow-x: visible !important;
                  scroll-snap-type: none !important;
                }
                .kanban-column {
                  min-width: auto !important;
                  max-width: none !important;
                  flex-shrink: 1;
                }
              }
            `}</style>
          </div>
        )}

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

          <div 
            className="module-cards-grid"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', // Single column on mobile
              gap: spacing.lg
            }}
          >
            {/* Gate Pass Reports */}
            {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'guard' || user?.role === 'clerk') && (
              <div
                onClick={() => navigate('/app/gate-pass/reports')}
                className="module-card"
                style={{
                  background: 'white',
                  padding: spacing.xl,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '44px', // Touch target minimum
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  // Only on hover-capable devices
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = colors.neutral[200];
                  }
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onTouchEnd={(e) => {
                  setTimeout(() => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.opacity = '1';
                  }, 150);
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
                className="module-card"
                style={{
                  background: 'white',
                  padding: spacing.xl,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '44px', // Touch target minimum
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  // Only on hover-capable devices
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = colors.neutral[200];
                  }
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onTouchEnd={(e) => {
                  setTimeout(() => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.opacity = '1';
                  }, 150);
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
                className="module-card"
                style={{
                  background: 'white',
                  padding: spacing.xl,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '44px', // Touch target minimum
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  // Only on hover-capable devices
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = colors.neutral[200];
                  }
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onTouchEnd={(e) => {
                  setTimeout(() => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.opacity = '1';
                  }, 150);
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
                className="module-card"
                style={{
                  background: 'white',
                  padding: spacing.xl,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '44px', // Touch target minimum
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  // Only on hover-capable devices
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = colors.neutral[200];
                  }
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onTouchEnd={(e) => {
                  setTimeout(() => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.opacity = '1';
                  }, 150);
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
                className="module-card"
                style={{
                  background: 'white',
                  padding: spacing.xl,
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${colors.neutral[200]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '44px', // Touch target minimum
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  // Only on hover-capable devices
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.matchMedia('(hover: hover)').matches) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = colors.neutral[200];
                  }
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onTouchEnd={(e) => {
                  setTimeout(() => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.opacity = '1';
                  }, 150);
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
          
          {/* Responsive styles for module cards */}
          <style>{`
            /* Mobile: Single column (0-767px) */
            @media (max-width: 767px) {
              .module-cards-grid {
                grid-template-columns: 1fr !important;
              }
            }
            
            /* Tablet: 2 columns (768px-1023px) */
            @media (min-width: 768px) and (max-width: 1023px) {
              .module-cards-grid {
                grid-template-columns: repeat(2, 1fr) !important;
              }
            }
            
            /* Desktop: 3+ columns (1024px+) */
            @media (min-width: 1024px) {
              .module-cards-grid {
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)) !important;
              }
            }
          `}</style>
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
              stats.recent_activity.map((activity: { action: string; user: string; time: string; type: string }, index: number) => (
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
                    fontSize: 'clamp(13px, 2.5vw, 14px)' // Responsive: minimum 13px for readability
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