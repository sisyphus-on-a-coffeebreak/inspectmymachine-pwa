import { type ReactNode, useState, useEffect, createElement } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../providers/useAuth";
import { colors, typography, spacing, borderRadius } from "../../lib/theme";
import { hasCapability } from "../../lib/permissions/evaluator";
import { hasStockyardCapability } from "../../lib/users";
import type { CapabilityModule } from "../../lib/users";
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
  AlertTriangle,
  Search,
  CheckCircle,
  Shield
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
import { unifiedNavItems, filterNavItemsByAccess, type UnifiedNavItem } from "../../lib/unifiedNavigation";

// Keep NavItem interface for backward compatibility with existing code
interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[]; // For backward compatibility
  requiredCapability?: { module: CapabilityModule; action: string }; // For capability-based access
  children?: NavItem[];
}

// Convert UnifiedNavItem to NavItem for compatibility
function unifiedToNavItem(item: UnifiedNavItem): NavItem {
  return {
    id: item.id,
    label: item.label,
    icon: item.icon,
    path: item.path,
    roles: item.roles || [],
    requiredCapability: item.requiredCapability,
    children: item.children?.map(unifiedToNavItem),
  };
}

// Use unified navigation items
const navItems: NavItem[] = unifiedNavItems.map(unifiedToNavItem);

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
      const nowMobile = window.innerWidth < 1024; // Mobile + Tablet (0-1023px) - using standardized breakpoint

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

  // Scoped body scroll lock - ONLY when mobile sidebar drawer is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      // Lock body scroll when drawer is open
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const originalTop = document.body.style.top;
      
      // Store current scroll position to prevent jump
      const scrollY = window.scrollY;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      
      return () => {
        // Restore body scroll immediately when drawer closes
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.top = originalTop;
        
        // Restore scroll position
        if (originalPosition !== 'fixed') {
          window.scrollTo(0, scrollY);
        }
      };
    }
  }, [isMobile, sidebarOpen]);

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

  // Check if user can access a nav item (by role or capability)
  const canAccessNavItem = (item: NavItem): boolean => {
    if (!user) return false;
    
    // For items with requiredCapability, always check capabilities first (for custom roles)
    // This ensures custom roles work correctly
    if (item.requiredCapability) {
      const hasCap = hasCapability(
        user,
        item.requiredCapability.module,
        item.requiredCapability.action as 'read' | 'create' | 'update' | 'delete' | 'approve' | 'validate' | 'review' | 'reassign' | 'export'
      );
      if (hasCap) return true;
    }
    
    // Check role-based access (backward compatibility for hardcoded roles)
    if (item.roles.includes(user.role || "")) {
      return true;
    }
    
    return false;
  };

  // Use unified navigation filtering
  const accessibleUnifiedItems = filterNavItemsByAccess(
    unifiedNavItems,
    user,
    (user, module, action) => hasCapability(user, module, action as any),
    (user, functionType, action) => hasStockyardCapability(user, functionType, action as any)
  );
  const accessibleNavItems = accessibleUnifiedItems.map(unifiedToNavItem);

  // Prefetching for faster navigation
  const { prefetchRoute } = usePrefetch({
    enabled: true,
    prefetchOnHover: true,
    prefetchDelay: 100,
  });

  const renderNavItem = (item: NavItem, level = 0) => {
    const IconComponent = item.icon;
    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const accessibleChildren = item.children?.filter(child => {
      if (!user) return false;
      
      // For items with requiredCapability, always check capabilities first (for custom roles)
      if (child.requiredCapability) {
        const hasCap = hasCapability(
          user,
          child.requiredCapability.module,
          child.requiredCapability.action as 'read' | 'create' | 'update' | 'delete' | 'approve' | 'validate' | 'review' | 'reassign' | 'export'
        );
        if (hasCap) return true;
      }
      
      // Check role-based access (backward compatibility for hardcoded roles)
      if (child.roles.includes(user.role || "")) {
        return true;
      }
      
      return false;
    }) || [];

    const navItemContent = (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (hasChildren && !isCollapsed) {
            toggleExpanded(item.id);
          } else {
            navigate(item.path);
            setSidebarOpen(false);
          }
        }}
        onMouseEnter={(e) => {
          // Only on hover-capable devices
          if (window.matchMedia('(hover: hover)').matches) {
            if (!hasChildren) {
              prefetchRoute(item.path);
            }
            if (!active) {
              e.currentTarget.style.background = colors.neutral[100];
            }
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
          position: "relative",
          minHeight: '44px', // Touch target minimum
          touchAction: 'manipulation'
        }}
        onMouseLeave={(e) => {
          if (!active && window.matchMedia('(hover: hover)').matches) {
            e.currentTarget.style.background = "transparent";
          }
        }}
        onTouchStart={(e) => {
          // Touch feedback
          if (!active) {
            e.currentTarget.style.background = colors.neutral[100];
            e.currentTarget.style.transform = 'scale(0.98)';
          }
        }}
        onTouchEnd={(e) => {
          // Reset after touch
          setTimeout(() => {
            if (!active) {
              e.currentTarget.style.background = "transparent";
            }
            e.currentTarget.style.transform = 'scale(1)';
          }, 150);
        }}
      >
        {createElement(IconComponent as React.ComponentType<{ style?: React.CSSProperties }>, { style: { width: "20px", height: "20px", flexShrink: 0, color: active ? colors.primary : colors.neutral[600] } })}
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
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
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
            flexShrink: 0,
            display: "flex",
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
            justifyContent: "center",
            minWidth: '44px', // Touch target minimum
            minHeight: '44px',
            touchAction: 'manipulation'
          }}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
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
                minWidth: '44px', // Touch target minimum
                minHeight: '44px',
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                if (window.matchMedia('(hover: hover)').matches) {
                  e.currentTarget.style.backgroundColor = colors.neutral[100];
                }
              }}
              onMouseLeave={(e) => {
                if (window.matchMedia('(hover: hover)').matches) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.backgroundColor = colors.neutral[100];
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onTouchEnd={(e) => {
                setTimeout(() => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.transform = 'scale(1)';
                }, 150);
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

      <div style={{ 
        flex: 1,
        minHeight: 0,
        display: "flex",
        overflow: "hidden"
      }}>
        {/* Sidebar - Responsive: Desktop only when showSidebar is true */}
        {showSidebar && (
          <>
            {/* Desktop Sidebar - Completely Rebuilt from Scratch */}
            {!isMobile && (
              <aside 
                role="complementary"
                aria-label="Main navigation"
                style={{
                  position: "fixed",
                  left: 0,
                  top: 0,
                  width: isCollapsed ? "64px" : "280px",
                  height: "100dvh",
                  maxHeight: "100dvh",
                  background: "white",
                  borderRight: `1px solid ${colors.neutral[200]}`,
                  display: "flex",
                  flexDirection: "column",
                  zIndex: 50,
                  transition: "width 0.3s ease",
                  overflow: "hidden",
                  boxSizing: "border-box"
                }}
              >
                {/* TOP: Logo Section - Responsive Height */}
                <header 
                  role="banner"
                  style={{
                    minHeight: "clamp(64px, 8vh, 80px)",
                    maxHeight: "clamp(64px, 8vh, 80px)",
                    flexShrink: 0,
                    padding: spacing.lg,
                    borderBottom: `1px solid ${colors.neutral[200]}`,
                    display: "flex",
                    alignItems: "center",
                    boxSizing: "border-box"
                  }}
                >
                  {!isCollapsed ? (
                    <div style={{ display: "flex", alignItems: "center", gap: spacing.md, width: "100%" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        minWidth: "40px",
                        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <Home style={{ width: "20px", height: "20px", color: "white" }} aria-hidden="true" />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h1 style={{ 
                          fontSize: "18px", 
                          margin: 0, 
                          fontWeight: 700, 
                          lineHeight: 1.2,
                          color: colors.neutral[900],
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          VOMS
                        </h1>
                        <p style={{ 
                          fontSize: "11px", 
                          color: colors.neutral[600], 
                          margin: 0, 
                          lineHeight: 1.2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          Vehicle Operations
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
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
                </header>

                {/* MIDDLE: Scrollable Content - Takes Remaining Space */}
                <div 
                  role="region"
                  aria-label="Navigation menu"
                  tabIndex={0}
                  style={{
                    flex: "1 1 auto",
                    minHeight: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                    padding: spacing.lg,
                    paddingTop: spacing.md,
                    paddingBottom: spacing.md,
                    boxSizing: "border-box",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "thin",
                    scrollbarColor: `${colors.neutral[400]} ${colors.neutral[100]}`
                  }}
                  onKeyDown={(e) => {
                    // Allow arrow key navigation within scrollable area
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                      const scrollAmount = 50;
                      e.currentTarget.scrollBy({
                        top: e.key === "ArrowDown" ? scrollAmount : -scrollAmount,
                        behavior: "smooth"
                      });
                    }
                  }}
                >
                  {/* Navigation Menu */}
                  <nav role="navigation" aria-label="Main menu" style={{ marginBottom: spacing.xl }}>
                    {accessibleNavItems.map(item => renderNavItem(item))}
                  </nav>

                  {/* Recently Viewed - Only when expanded */}
                  {!isCollapsed && (
                    <div style={{ marginBottom: spacing.md }}>
                      <RecentlyViewed />
                    </div>
                  )}
                </div>

                {/* BOTTOM: User Section - Flexible but Never Shrinks */}
                <footer 
                  role="contentinfo"
                  style={{
                    flexShrink: 0,
                    minHeight: "min-content",
                    maxHeight: "clamp(120px, 25vh, 220px)",
                    padding: spacing.lg,
                    paddingTop: spacing.md,
                    borderTop: `1px solid ${colors.neutral[200]}`,
                    background: "white",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    gap: spacing.sm,
                    overflow: "hidden",
                    transition: "max-height 0.3s ease"
                  }}
                >
                  {!isCollapsed ? (
                    <>
                      {/* User Info */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: spacing.sm,
                        padding: spacing.sm,
                        background: colors.neutral[50],
                        borderRadius: "8px",
                        flexShrink: 0
                      }}>
                        <div style={{
                          width: "32px",
                          height: "32px",
                          minWidth: "32px",
                          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}80 100%)`,
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}>
                          <UserCog style={{ width: "16px", height: "16px", color: "white" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ 
                            fontSize: "12px", 
                            margin: 0, 
                            fontWeight: 600,
                            color: colors.neutral[900],
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {user?.name || "User"}
                          </p>
                          <p style={{ 
                            fontSize: "10px", 
                            color: colors.neutral[600], 
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            {getRoleDisplayName(user?.role || "")}
                          </p>
                        </div>
                      </div>

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
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
                          flexShrink: 0
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
                        padding: spacing.sm,
                        background: colors.neutral[50],
                        borderRadius: "8px",
                        flexShrink: 0
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

                  {/* Collapse Button - Always Visible */}
                  <button
                    onClick={toggleCollapse}
                    type="button"
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
                      flexShrink: 0,
                      marginTop: "auto",
                      outline: "none"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.neutral[100];
                      e.currentTarget.style.borderColor = colors.neutral[400];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = colors.neutral[300];
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.outline = `2px solid ${colors.primary}`;
                      e.currentTarget.style.outlineOffset = "2px";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.outline = "none";
                    }}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-expanded={!isCollapsed}
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
                </footer>
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
                position: "fixed",
                top: "64px",
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                zIndex: 50,
                willChange: "transform",
                overflow: "hidden"
              }}>
              {/* Scrollable Content Area */}
              <div style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                // INVARIANT 1: NO overflow-x masking - content must fit by design
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                padding: spacing.lg,
                WebkitOverflowScrolling: "touch"
              }}>
                {/* Navigation */}
                <nav style={{ marginBottom: spacing.xl }}>
                  {accessibleNavItems.map(item => renderNavItem(item))}
                </nav>

                {/* Recently Viewed */}
                <div style={{ marginBottom: spacing.lg }}>
                  <RecentlyViewed />
                </div>
              </div>

              {/* User Section - Fixed at bottom */}
              <div style={{
                padding: spacing.lg,
                background: colors.neutral[50],
                borderRadius: "12px",
                flexShrink: 0,
                borderTop: `1px solid ${colors.neutral[200]}`
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
          minHeight: 0,
          maxWidth: "100%",
          width: "100%",
          overflowY: "auto",
          // INVARIANT 1: NO overflow-x hidden - we prevent, not mask
          WebkitOverflowScrolling: "touch",
          // Responsive margin: no margin on mobile, sidebar margin on desktop
          marginLeft: showSidebar && !isMobile ? (isCollapsed ? "64px" : "280px") : "0",
          padding: isMobile ? spacing.lg : spacing.xl,
          paddingBottom: isMobile ? "calc(1.5rem + 64px)" : spacing.xl,
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
                overflowX: "auto",
                overflowY: "hidden",
                whiteSpace: "nowrap",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "thin",
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
