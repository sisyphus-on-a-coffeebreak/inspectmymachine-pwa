import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  DoorOpen,
  ClipboardCheck,
  Receipt,
  MoreHorizontal,
  Warehouse,
  UserCog,
  AlertTriangle,
} from 'lucide-react';
import { colors, spacing, borderRadius, shadows } from '../../lib/theme';
import { Modal } from './Modal';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/dashboard',
  },
  {
    id: 'gate-pass',
    label: 'Gate Pass',
    icon: DoorOpen,
    path: '/app/gate-pass',
  },
  {
    id: 'inspections',
    label: 'Inspections',
    icon: ClipboardCheck,
    path: '/app/inspections',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    path: '/app/expenses',
  },
];

const moreNavItems: NavItem[] = [
  {
    id: 'stockyard',
    label: 'Stockyard',
    icon: Warehouse,
    path: '/app/stockyard',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: AlertTriangle,
    path: '/app/alerts',
  },
  {
    id: 'users',
    label: 'Users',
    icon: UserCog,
    path: '/app/admin/users',
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Detect keyboard open/close
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        setKeyboardOpen(viewportHeight < windowHeight * 0.75);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setShowMoreSheet(false);
  };

  // Hide on desktop
  if (window.innerWidth >= 768) {
    return null;
  }

  // Hide when keyboard is open
  if (keyboardOpen) {
    return null;
  }

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: 'white',
          borderTop: `1px solid ${colors.neutral[200]}`,
          boxShadow: shadows.lg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 100,
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        }}
        className="dark:bg-zinc-900 dark:border-zinc-800"
      >
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                flex: 1,
                padding: spacing.sm,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: active ? colors.primary : colors.neutral[600],
                transition: 'color 0.2s',
                position: 'relative',
              }}
              aria-label={item.label}
            >
              <Icon
                style={{
                  width: '24px',
                  height: '24px',
                  fill: active ? colors.primary : 'none',
                  strokeWidth: active ? 2.5 : 2,
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: active ? 600 : 400,
                  color: active ? colors.primary : colors.neutral[600],
                }}
              >
                {item.label}
              </span>
              {item.badge && item.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '50%',
                    transform: 'translateX(12px)',
                    backgroundColor: colors.error[500],
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setShowMoreSheet(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            flex: 1,
            padding: spacing.sm,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: showMoreSheet ? colors.primary : colors.neutral[600],
            transition: 'color 0.2s',
          }}
          aria-label="More"
        >
          <MoreHorizontal
            style={{
              width: '24px',
              height: '24px',
              fill: showMoreSheet ? colors.primary : 'none',
              strokeWidth: showMoreSheet ? 2.5 : 2,
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: showMoreSheet ? 600 : 400,
              color: showMoreSheet ? colors.primary : colors.neutral[600],
            }}
          >
            More
          </span>
        </button>
      </nav>

      {/* More Sheet Modal */}
      {showMoreSheet && (
        <Modal
          title="More"
          onClose={() => setShowMoreSheet(false)}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    background: active ? colors.primary + '15' : 'transparent',
                    border: `1px solid ${active ? colors.primary : colors.neutral[200]}`,
                    borderRadius: borderRadius.md,
                    cursor: 'pointer',
                    color: active ? colors.primary : colors.neutral[700],
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = colors.neutral[50];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon
                    style={{
                      width: '20px',
                      height: '20px',
                      color: active ? colors.primary : colors.neutral[600],
                    }}
                  />
                  <span style={{ flex: 1, fontWeight: active ? 600 : 400 }}>
                    {item.label}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span
                      style={{
                        backgroundColor: colors.error[500],
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </>
  );
}

