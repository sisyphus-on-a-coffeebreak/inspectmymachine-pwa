import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../providers/useAuth";
import { colors, typography, spacing, borderRadius } from "../../lib/theme";
import { useScrollDirection } from "../../hooks/useScrollDirection";
import "./AppLayout.css";
import {
  Home,
  ClipboardList,
  FileText,
  DollarSign,
  Warehouse,
  UserCog,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Settings,
  Bell,
  AlertTriangle,
  Search,
  CheckCircle
} from "lucide-react";
import { RecentlyViewed } from "../ui/RecentlyViewed";
import { NotificationBell } from "../ui/NotificationBell";
import { OfflineIndicator } from "../ui/OfflineIndicator";
import { CommandPalette } from "../ui/CommandPalette";
import { useAppKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { BottomNav } from "../ui/BottomNav";
import { Tooltip } from "../ui/Tooltip";
import { InstallBanner } from "../ui/InstallBanner";
import { SkipToContent } from "../ui/SkipToContent";
import { generateBreadcrumbs, shouldShowBreadcrumbs } from "../../lib/breadcrumbUtils";
import { usePrefetch } from "../../hooks/usePrefetch";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Home,
    path: "/dashboard",
    roles: ["super_admin", "admin", "supervisor", "inspector", "guard", "clerk"]
  },
  {
    id: "gate-pass",
    label: "Gate Passes",
    icon: ClipboardList,
    path: "/app/gate-pass",
    roles: ["super_admin", "admin", "guard", "clerk"],
    children: [
      { id: "dashboard", label: "Dashboard", icon: ClipboardList, path: "/app/gate-pass", roles: ["super_admin", "admin", "guard", "clerk"] },
      { id: "create-visitor", label: "Create Visitor Pass", icon: ClipboardList, path: "/app/gate-pass/create-visitor", roles: ["super_admin", "admin", "clerk"] },
      { id: "create-vehicle", label: "Create Vehicle Pass", icon: ClipboardList, path: "/app/gate-pass/create-vehicle", roles: ["super_admin", "admin", "clerk"] },
      { id: "guard-register", label: "Guard Register", icon: ClipboardList, path: "/app/gate-pass/guard-register", roles: ["super_admin", "admin", "guard"] },
      { id: "validation", label: "Validation", icon: ClipboardList, path: "/app/gate-pass/validation", roles: ["super_admin", "admin", "supervisor", "guard"] },
      { id: "calendar", label: "Calendar", icon: ClipboardList, path: "/app/gate-pass/calendar", roles: ["super_admin", "admin", "guard", "clerk"] },
      { id: "reports", label: "Reports", icon: ClipboardList, path: "/app/gate-pass/reports", roles: ["super_admin", "admin"] }
    ]
  },
  {
    id: "inspections",
    label: "Inspections",
    icon: FileText,
    path: "/app/inspections",
    roles: ["super_admin", "admin", "inspector"],
    children: [
      { id: "dashboard", label: "Dashboard", icon: FileText, path: "/app/inspections", roles: ["super_admin", "admin", "inspector"] },
      { id: "new", label: "New Inspection", icon: FileText, path: "/app/inspections/new", roles: ["super_admin", "admin", "inspector"] },
      { id: "completed", label: "Completed", icon: FileText, path: "/app/inspections/completed", roles: ["super_admin", "admin", "inspector"] },
      { id: "reports", label: "Reports", icon: FileText, path: "/app/inspections/reports", roles: ["super_admin", "admin", "inspector"] }
    ]
  },
  {
    id: "expenses",
    label: "Expenses",
    icon: DollarSign,
    path: "/app/expenses",
    roles: ["super_admin", "admin", "supervisor", "inspector", "guard", "clerk"],
    children: [
      { id: "dashboard", label: "Dashboard", icon: DollarSign, path: "/app/expenses", roles: ["super_admin", "admin", "supervisor", "inspector", "guard", "clerk"] },
      { id: "create", label: "Create Expense", icon: DollarSign, path: "/app/expenses/create", roles: ["super_admin", "admin", "supervisor", "inspector", "guard", "clerk"] },
      { id: "history", label: "History", icon: DollarSign, path: "/app/expenses/history", roles: ["super_admin", "admin", "supervisor", "inspector", "guard", "clerk"] },
      { id: "reports", label: "Reports", icon: DollarSign, path: "/app/expenses/reports", roles: ["super_admin", "admin"] },
      { id: "analytics", label: "Analytics", icon: DollarSign, path: "/app/expenses/analytics", roles: ["super_admin", "admin"] }
    ]
  },
  {
    id: "stockyard",
    label: "Stockyard",
    icon: Warehouse,
    path: "/app/stockyard",
    roles: ["super_admin", "admin"],
    children: [
      { id: "dashboard", label: "Dashboard", icon: Warehouse, path: "/app/stockyard", roles: ["super_admin", "admin"] },
      { id: "create", label: "Record Movement", icon: Warehouse, path: "/app/stockyard/create", roles: ["super_admin", "admin"] },
      { id: "scan", label: "Scan Vehicle", icon: Warehouse, path: "/app/stockyard/scan", roles: ["super_admin", "admin", "guard"] },
      { id: "components", label: "Component Ledger", icon: Warehouse, path: "/app/stockyard/components", roles: ["super_admin", "admin"] },
      { id: "analytics", label: "Analytics", icon: Warehouse, path: "/app/stockyard/analytics", roles: ["super_admin", "admin"] },
    ]
  },
  {
    id: "approvals",
    label: "Approvals",
    icon: CheckCircle,
    path: "/app/approvals",
    roles: ["super_admin", "admin", "supervisor"]
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: AlertTriangle,
    path: "/app/alerts",
    roles: ["super_admin", "admin", "supervisor"]
  },
  {
    id: "users",
    label: "User Management",
    icon: UserCog,
    path: "/app/admin/users",
    roles: ["super_admin", "admin"],
    children: [
      { id: "dashboard", label: "Dashboard", icon: UserCog, path: "/app/admin/users", roles: ["super_admin", "admin"] },
      { id: "user-activity", label: "Activity Dashboard", icon: UserCog, path: "/app/admin/users/activity", roles: ["super_admin", "admin"] },
      { id: "capability-matrix", label: "Capability Matrix", icon: UserCog, path: "/app/admin/users/capability-matrix", roles: ["super_admin", "admin"] },
      { id: "bulk-operations", label: "Bulk Operations", icon: UserCog, path: "/app/admin/users/bulk-operations", roles: ["super_admin", "admin"] }
    ]
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/app/settings",
    roles: ["super_admin", "admin"],
    children: [
      { id: "report-branding", label: "Report Branding", icon: Settings, path: "/app/settings/report-branding", roles: ["super_admin", "admin"] }
    ]
  }
];

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  title?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
}

export default function AppLayout({ 
  children, 
  showSidebar = true,
  title,
  breadcrumbs: propBreadcrumbs 
}: AppLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Auto-generate breadcrumbs from route if not provided
  const autoBreadcrumbs = shouldShowBreadcrumbs(location.pathname) 
    ? generateBreadcrumbs(location.pathname)
    : [];
  const breadcrumbs = propBreadcrumbs || autoBreadcrumbs;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  // Removed auto-hide scroll behavior for better mobile UX
  // const scrollDirection = useScrollDirection(5);
  
  // Initialize keyboard shortcuts
  useAppKeyboardShortcuts();
  const [isMobile, setIsMobile] = useState(false);
  
  // Collapsible sidebar state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('voms_sidebar_collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('voms_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Detect mobile viewport with debouncing and proper state management
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout;

    const checkMobile = () => {
      const wasMobile = isMobile;
      const nowMobile = window.innerWidth < 1024; // Mobile + Tablet (0-1023px)

      setIsMobile(nowMobile);

      // Close mobile sidebar when switching to desktop
      if (wasMobile && !nowMobile && sidebarOpen) {
        setSidebarOpen(false);
      }

      // Reset collapsed state when switching to mobile/tablet (they don't use collapsed state)
      if (!wasMobile && nowMobile && isCollapsed) {
        setIsCollapsed(false);
      }
    };
    
    // Initial check
    checkMobile();
    
    // Debounced resize handler for better performance
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkMobile, 150);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also listen to orientation changes on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobile, 200);
    });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', checkMobile);
      clearTimeout(resizeTimer);
    };
  }, [isMobile, sidebarOpen, isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
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

  const accessibleNavItems = navItems.filter(item =>
    item.roles.includes(user?.role || "")
  );

  // Prefetching for faster navigation
  const { prefetchRoute, handleLinkHover } = usePrefetch({
    enabled: true,
    prefetchOnHover: true,
    prefetchDelay: 100,
  });

  const renderNavItem = (item: NavItem, level = 0) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const accessibleChildren = item.children?.filter(child =>
      child.roles.includes(user?.role || "")
    ) || [];

    const navItemContent = (
      <div
        onClick={() => {
          if (hasChildren && !isCollapsed) {
            toggleExpanded(item.id);
          } else if (!hasChildren) {
            navigate(item.path);
            setSidebarOpen(false);
          }
        }}
        onMouseEnter={(e) => {
          if (!hasChildren) {
            prefetchRoute(item.path);
          }
          if (!active) {
            e.currentTarget.style.background = colors.neutral[100];
          }
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing.sm,
          padding: `${spacing.sm} ${spacing.md}`,
          paddingLeft: isCollapsed ? spacing.md : `${parseInt(spacing.md) + level * parseInt(spacing.md)}px`,
          justifyContent: isCollapsed ? "center" : "flex-start",
          background: active ? colors.primary + "15" : "transparent",
          color: active ? colors.primary : colors.neutral[700],
          borderRadius: "8px",
          cursor: "pointer",
          transition: "background-color 0.2s ease, color 0.2s ease",
          marginBottom: spacing.xs,
          fontWeight: active ? 600 : 500,
          position: "relative"
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <Icon style={{ width: "20px", height: "20px", flexShrink: 0, color: active ? colors.primary : colors.neutral[600] }} />
        {!isCollapsed && (
          <>
            <span style={{ flex: 1, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.label}
            </span>
            {hasChildren && (
              <ChevronRight
                style={{
                  width: "16px",
                  height: "16px",
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  flexShrink: 0,
                  willChange: "transform"
                }}
              />
            )}
          </>
        )}
      </div>
    );

    return (
      <div key={item.id}>
        {isCollapsed ? (
          <Tooltip content={item.label} position="right" delay={200}>
            {navItemContent}
          </Tooltip>
        ) : (
          navItemContent
        )}
        {hasChildren && isExpanded && !isCollapsed && (
          <div style={{ marginLeft: spacing.md }}>
            {accessibleChildren.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 100%)`,
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Mobile Header - Only on mobile */}
      {showSidebar && isMobile && (
        <header
          className="app-layout-mobile-header"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${colors.neutral[200]}`,
            position: "sticky",
            top: 0,
            zIndex: 100,
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${spacing.md} ${spacing.lg}`,
            paddingTop: `calc(${spacing.md} + env(safe-area-inset-top, 0px))`,
            paddingLeft: `calc(${spacing.lg} + env(safe-area-inset-left, 0px))`,
            paddingRight: `calc(${spacing.lg} + env(safe-area-inset-right, 0px))`,
          }}
        >
        <button
          onClick={toggleSidebar}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: spacing.sm,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {sidebarOpen ? (
            <X style={{ width: "24px", height: "24px", color: colors.neutral[700] }} />
          ) : (
            <Menu style={{ width: "24px", height: "24px", color: colors.neutral[700] }} />
          )}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
          <div style={{
            width: "32px",
            height: "32px",
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Home style={{ width: "20px", height: "20px", color: "white" }} />
          </div>
          <span style={{ ...typography.label, fontWeight: 600, color: colors.neutral[900] }}>
            VOMS
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, flex: 1, maxWidth: isMobile ? "auto" : "400px" }}>
          {isMobile ? (
            // Mobile: Simple search button
            <button
              onClick={() => {
                // Open command palette when clicking search button
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.neutral[700],
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.neutral[100];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              aria-label="Search"
            >
              <Search style={{ width: "24px", height: "24px" }} />
            </button>
          ) : (
            // Desktop: Full search input with keyboard shortcut
            <div style={{
              position: "relative",
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: spacing.xs,
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: colors.neutral[50],
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.neutral[200]}`,
              transition: "all 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.backgroundColor = "white";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.neutral[200];
              e.currentTarget.style.backgroundColor = colors.neutral[50];
            }}
            >
              <Search style={{ width: "18px", height: "18px", color: colors.neutral[500], flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search or press Cmd+K..."
                onClick={() => {
                  const { useCommandPalette } = require('../../hooks/useCommandPalette');
                  // Open command palette when clicking search input
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
                }}
                onFocus={() => {
                  // Open command palette on focus
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
                }}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "14px",
                  color: colors.neutral[900],
                  fontFamily: typography.body.fontFamily,
                }}
                readOnly
                aria-label="Search"
              />
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                padding: "2px 6px",
                backgroundColor: colors.neutral[200],
                borderRadius: borderRadius.sm,
                fontSize: "11px",
                color: colors.neutral[600],
                fontFamily: "monospace",
              }}>
                <span>⌘</span>
                <span>K</span>
              </div>
            </div>
          )}
          <NotificationBell />
        </div>
      </header>
      )}

      <div style={{ display: "flex", minHeight: "calc(100dvh - 64px)" }}>
        {/* Sidebar - Responsive: Desktop only when showSidebar is true */}
        {showSidebar && (
          <>
            {/* Desktop Sidebar - Hidden on mobile, visible on desktop */}
            {!isMobile && (
              <aside className="app-layout-desktop-sidebar" style={{
                width: isCollapsed ? "64px" : "280px",
                background: "white",
                borderRight: `1px solid ${colors.neutral[200]}`,
                position: "fixed",
                left: 0,
                top: 0,
                height: "100dvh",
                display: "flex",
                flexDirection: "column",
                zIndex: 50,
                transition: "width 0.3s ease"
              }}>
              {/* Scrollable Content Area - Only menu items scroll */}
              <div style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                padding: spacing.lg,
                paddingBottom: spacing.md
              }}>
                {/* Logo */}
                <div style={{ marginBottom: spacing.xl }}>
                  {!isCollapsed ? (
                    <div style={{ display: "flex", alignItems: "center", gap: spacing.md, marginBottom: spacing.md }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Home style={{ width: "20px", height: "20px", color: "white" }} aria-hidden="true" />
                      </div>
                      <div>
                        <h1 style={{ ...typography.header, fontSize: "18px", margin: 0, fontWeight: 700 }}>
                          VOMS
                        </h1>
                        <p style={{ ...typography.bodySmall, fontSize: "11px", color: colors.neutral[600], margin: 0 }}>
                          Vehicle Operations
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: spacing.md }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Home style={{ width: "20px", height: "20px", color: "white" }} aria-hidden="true" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <nav style={{ marginBottom: spacing.xl }}>
                  {accessibleNavItems.map(item => renderNavItem(item))}
                </nav>

                {/* Recently Viewed - Hide when collapsed */}
                {!isCollapsed && (
                  <div style={{ marginBottom: spacing.xl }}>
                    <RecentlyViewed />
                  </div>
                )}
              </div>

              {/* User Section - Fixed at Bottom, Separate Component */}
              <div style={{
                padding: spacing.lg,
                background: "white",
                borderTop: `1px solid ${colors.neutral[200]}`,
                flexShrink: 0,
                zIndex: 10,
                position: "relative"
              }}>
                {!isCollapsed ? (
                  <>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: spacing.sm,
                      marginBottom: spacing.md,
                      padding: spacing.sm,
                      background: colors.neutral[50],
                      borderRadius: "8px"
                    }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <UserCog style={{ width: "16px", height: "16px", color: "white" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ ...typography.label, fontSize: "12px", margin: 0, fontWeight: 600 }}>
                          {user?.name}
                        </p>
                        <p style={{ ...typography.bodySmall, fontSize: "10px", color: colors.neutral[600], margin: 0 }}>
                          {getRoleDisplayName(user?.role || "")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: spacing.sm,
                        padding: spacing.sm,
                        background: "transparent",
                        border: `1px solid ${colors.status.critical}`,
                        borderRadius: "8px",
                        color: colors.status.critical,
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 500,
                        transition: "all 0.2s ease",
                        marginBottom: spacing.sm
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.status.critical;
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = colors.status.critical;
                      }}
                    >
                      <LogOut style={{ width: "14px", height: "14px" }} />
                      Logout
                    </button>
                  </>
                ) : (
                  <Tooltip content={user?.name || "User"} position="right">
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: spacing.md,
                      padding: spacing.sm,
                      background: colors.neutral[50],
                      borderRadius: "8px"
                    }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <UserCog style={{ width: "16px", height: "16px", color: "white" }} />
                      </div>
                    </div>
                  </Tooltip>
                )}
                
                {/* Collapse Toggle Button */}
                <button
                  onClick={toggleCollapse}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    gap: spacing.sm,
                    padding: spacing.sm,
                    background: "transparent",
                    border: `1px solid ${colors.neutral[300]}`,
                    borderRadius: "8px",
                    color: colors.neutral[700],
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    marginTop: !isCollapsed ? spacing.sm : 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.neutral[100];
                    e.currentTarget.style.borderColor = colors.neutral[400];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = colors.neutral[300];
                  }}
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? (
                    <ChevronRight style={{ width: "16px", height: "16px" }} />
                  ) : (
                    <>
                      <ChevronLeft style={{ width: "16px", height: "16px" }} />
                      <span>Collapse</span>
                    </>
                  )}
                </button>
              </div>
            </aside>
            )}

            {/* Mobile Sidebar Overlay - Only on mobile */}
            {sidebarOpen && isMobile && (
              <div
                onClick={() => setSidebarOpen(false)}
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0, 0, 0, 0.5)",
                  zIndex: 40
                }}
              />
            )}

            {/* Mobile Sidebar - Only on mobile */}
            {isMobile && (
              <aside className={`app-layout-mobile-sidebar ${sidebarOpen ? "open" : "closed"}`} style={{
                width: "280px",
                background: "white",
                borderRight: `1px solid ${colors.neutral[200]}`,
                padding: spacing.lg,
                position: "fixed",
                top: "64px",
                height: "calc(100dvh - 64px)",
                overflowY: "auto",
                zIndex: 50,
                willChange: "transform"
              }}>
              {/* Navigation */}
              <nav style={{ marginBottom: spacing.xl }}>
                {accessibleNavItems.map(item => renderNavItem(item))}
              </nav>

              {/* Recently Viewed */}
              <div style={{ marginBottom: spacing.lg }}>
                <RecentlyViewed />
              </div>

              {/* User Section */}
              <div style={{
                padding: spacing.lg,
                background: colors.neutral[50],
                borderRadius: "12px",
                marginTop: spacing.xl
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.sm,
                  marginBottom: spacing.md
                }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <UserCog style={{ width: "20px", height: "20px", color: "white" }} aria-hidden="true" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ ...typography.label, fontSize: "12px", margin: 0, fontWeight: 600 }}>
                      {user?.name}
                    </p>
                    <p style={{ ...typography.bodySmall, fontSize: "10px", color: colors.neutral[600], margin: 0 }}>
                      {getRoleDisplayName(user?.role || "")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: spacing.sm,
                    padding: spacing.sm,
                    background: "transparent",
                    border: `1px solid ${colors.status.critical}`,
                    borderRadius: "8px",
                    color: colors.status.critical,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500
                  }}
                >
                  <LogOut style={{ width: "14px", height: "14px" }} />
                  Logout
                </button>
              </div>
            </aside>
            )}
          </>
        )}

        {/* Main Content */}
        <main 
          id="main-content"
          tabIndex={-1}
          className="app-layout-main-content" 
          data-sidebar-collapsed={isCollapsed}
          data-is-mobile={isMobile}
          style={{
          flex: 1,
          maxWidth: "1400px",
          width: "100%",
          // Responsive margin: no margin on mobile, sidebar margin on desktop
          marginLeft: showSidebar && !isMobile ? (isCollapsed ? "64px" : "280px") : "0",
          padding: isMobile ? spacing.lg : spacing.xl, // 1.5rem on mobile, 2rem on desktop
          paddingBottom: isMobile ? "calc(1.5rem + 64px)" : spacing.xl, // Account for bottom nav on mobile
          transition: "margin-left 0.3s ease, padding 0.3s ease"
        }}>
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div 
              className="breadcrumb-container"
              style={{
                display: "flex",
                alignItems: "center",
                gap: spacing.xs,
                marginBottom: spacing.lg,
                flexWrap: "wrap"
              }}
            >
              {isMobile && breadcrumbs.length > 2 ? (
                <>
                  <button
                    onClick={() => navigate(breadcrumbs[0].path || '/dashboard')}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: colors.primary,
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 400,
                      padding: 0
                    }}
                  >
                    ...
                  </button>
                  <ChevronRight style={{ width: "14px", height: "14px", color: colors.neutral[400] }} />
                  {breadcrumbs.slice(-2).map((crumb, index) => {
                    const actualIndex = breadcrumbs.length - 2 + index;
                    return (
                      <div key={actualIndex} style={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
                        {index > 0 && (
                          <ChevronRight style={{ width: "14px", height: "14px", color: colors.neutral[400] }} />
                        )}
                        {crumb.path ? (
                          <button
                            onClick={() => navigate(crumb.path!)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: actualIndex === breadcrumbs.length - 1 ? colors.neutral[900] : colors.primary,
                              cursor: "pointer",
                              fontSize: "14px",
                              fontWeight: actualIndex === breadcrumbs.length - 1 ? 600 : 400,
                              padding: 0
                            }}
                          >
                            {crumb.label}
                          </button>
                        ) : (
                          <span style={{
                            color: colors.neutral[900],
                            fontSize: "14px",
                            fontWeight: 600
                          }}>
                            {crumb.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                breadcrumbs.map((crumb, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: spacing.xs }}>
                    {index > 0 && (
                      <ChevronRight style={{ width: "14px", height: "14px", color: colors.neutral[400] }} />
                    )}
                    {crumb.path ? (
                      <button
                        onClick={() => navigate(crumb.path!)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: index === breadcrumbs.length - 1 ? colors.neutral[900] : colors.primary,
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                          padding: 0
                        }}
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span style={{
                        color: colors.neutral[900],
                        fontSize: "14px",
                        fontWeight: 600
                      }}>
                        {crumb.label}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Page Title */}
          {title && (
            <h1 style={{
              ...typography.header,
              fontSize: "28px",
              color: colors.neutral[900],
              marginBottom: spacing.lg,
              fontWeight: 700
            }}>
              {title}
            </h1>
          )}

          {children}
        </main>
      </div>
      
      {/* Offline Indicator */}
      <OfflineIndicator position="bottom" showDetails={true} />
      
      {/* Skip to Content Link */}
      <SkipToContent mainContentId="main-content" />
      
      {/* Command Palette */}
      <CommandPalette />
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNav />}
      
      {/* PWA Install Banner */}
      <InstallBanner />
    </div>
  );
}

